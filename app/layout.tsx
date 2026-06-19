import type { Metadata, Viewport } from "next";
import "./globals.css";
import { EftirlitProvider } from "@/lib/store";
import BottomNav from "@/components/BottomNav";
import LoginGate from "@/components/LoginGate";

export const metadata: Metadata = {
  title: "Eftirlit KEF",
  description: "Vaktatól fyrir eftirlit á Keflavíkurflugvelli",
};

export const viewport: Viewport = {
  themeColor: "#005595",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="is">
      <body>
        <EftirlitProvider>
          <LoginGate>
            <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
              <main className="flex-1 pb-20">{children}</main>
            </div>
            <BottomNav />
          </LoginGate>
        </EftirlitProvider>
      </body>
    </html>
  );
}
