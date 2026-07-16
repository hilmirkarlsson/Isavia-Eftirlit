-- =====================================================================
-- Eftirlit KEF – sameiginlegt vaktaástand (shared state)
-- =====================================================================
-- Keyrðu þetta EINU SINNI í Supabase: opnaðu verkefnið þitt á
-- supabase.com → SQL Editor → límdu þetta inn → Run.
--
-- Þetta býr til eina töflu sem geymir allt sameiginlegt ástand vaktarinnar
-- (DMA stæði, Suður hlið, verkefnastöðu, þrep, eyðublöð, skipulag, fylgdir
-- og valda vaktstjóra). Hvert tæki les og skrifar í gegnum þjóninn, svo
-- allir sjá sömu mynd í rauntíma.
-- =====================================================================

-- 1) Taflan sjálf: einn lykill (key) per "svið", gildið er JSON.
create table if not exists public.shared_state (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2) Grunnraðir – búnar til ef þær vantar (tómar í byrjun).
insert into public.shared_state (key, value) values
  ('dma',           '{}'::jsonb),
  ('sudur',         '{}'::jsonb),
  ('threp',         '{}'::jsonb),
  ('verkefniStada', '{}'::jsonb),
  ('verkefniVinna', '{}'::jsonb),
  ('ytriAdilar',    '{}'::jsonb),
  ('fylgdir',       '[]'::jsonb),
  ('skipulag',      '{"skipulag":null}'::jsonb),
  ('settings',      '{}'::jsonb),
  ('meta',          '{}'::jsonb)
on conflict (key) do nothing;

-- 3) merge_state: bætir/uppfærir lyklum inn í JSON-hlut (grunnt, atómískt).
--    Tveir geta uppfært ólík stæði samtímis án þess að yfirskrifa hvor annan.
create or replace function public.merge_state(p_key text, p_patch jsonb)
returns void
language sql
as $$
  insert into public.shared_state (key, value, updated_at)
  values (p_key, p_patch, now())
  on conflict (key) do update
    set value = public.shared_state.value || excluded.value,
        updated_at = now();
$$;

-- 4) set_state: yfirskrifar allt gildið (fyrir lista/skipulag).
create or replace function public.set_state(p_key text, p_value jsonb)
returns void
language sql
as $$
  insert into public.shared_state (key, value, updated_at)
  values (p_key, p_value, now())
  on conflict (key) do update
    set value = excluded.value,
        updated_at = now();
$$;

-- 5) ensure_today: núllstillir dagleg gögn (þrep, verkefnastaða, ábyrgð, eyðublöð)
--    þegar nýr dagur byrjar – kallað við hverja lesun frá þjóninum.
create or replace function public.ensure_today(p_today text)
returns void
language plpgsql
as $$
declare
  cur text;
begin
  select value->>'dagur' into cur from public.shared_state where key = 'meta';
  if cur is distinct from p_today then
    perform public.set_state('threp',         '{}'::jsonb);
    perform public.set_state('verkefniStada', '{}'::jsonb);
    perform public.set_state('verkefniVinna', '{}'::jsonb);
    perform public.set_state('ytriAdilar',    '{}'::jsonb);
    perform public.merge_state('meta', jsonb_build_object('dagur', p_today));
  end if;
end;
$$;

-- 6) Öryggi (RLS): lestur leyfður öllum svo rauntími og fyrsta hleðsla virki.
--    Skrif fara EINGÖNGU gegnum þjóninn (service role) sem hunsar RLS.
alter table public.shared_state enable row level security;

drop policy if exists "read shared_state" on public.shared_state;
create policy "read shared_state"
  on public.shared_state
  for select
  using (true);

-- 7) Rauntími: bæta töflunni við publication svo breytingar berist í tæki.
--    (Örugt að keyra aftur – villa ef hún er þegar með er hunsuð.)
do $$
begin
  alter publication supabase_realtime add table public.shared_state;
exception
  when others then null;
end $$;
