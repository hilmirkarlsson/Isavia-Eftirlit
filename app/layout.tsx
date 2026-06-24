import type { Metadata, Viewport } from "next";
import "./globals.css";
import { EftirlitProvider } from "@/lib/store";
import { FidsProvider } from "@/lib/fidsStore";
import BottomNav from "@/components/BottomNav";
import LoginGate from "@/components/LoginGate";
import PinGate from "@/components/PinGate";
import SwRegister from "@/components/SwRegister";
import FloatingMenu from "@/components/FloatingMenu";
import OpnaAHeim from "@/components/OpnaAHeim";

export const metadata: Metadata = {
  title: "Eftirlit KEF",
  description: "Vaktatól fyrir eftirlit á Keflavíkurflugvelli",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Eftirlit KEF",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
        <SwRegister />
        <PinGate>
          <EftirlitProvider>
            <FidsProvider>
              <LoginGate>
                <OpnaAHeim />
                <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
                  <main className="flex-1 pb-20">{children}</main>
                </div>
                <FloatingMenu />
                <BottomNav />
              </LoginGate>
            </FidsProvider>
          </EftirlitProvider>
        </PinGate>
      </body>
    </html>
  );
}
