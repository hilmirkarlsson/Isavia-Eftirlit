import type { Metadata, Viewport } from "next";
import "./globals.css";
import { EftirlitProvider } from "@/lib/store";
import { FidsProvider } from "@/lib/fidsStore";
import { ThemeProvider, TEMA_FORSKRIFT } from "@/lib/theme";
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

// Ekkert maximumScale: að banna klip-aðdrátt (pinch zoom) er aðgengisbrot –
// starfsfólk með skerta sjón þarf að geta stækkað.
export const viewport: Viewport = {
  themeColor: "#005595",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="is">
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_FORSKRIFT }} />
      </head>
      <body>
        <SwRegister />
        <ThemeProvider>
          <PinGate>
            <EftirlitProvider>
              <FidsProvider>
                <LoginGate>
                  <OpnaAHeim />
                  {/* Á borðtölvu (lg+) er hliðarstika til vinstri – efnið hliðrast
                      um breidd hennar og botnstikubilið (pb-20) fellur burt. */}
                  <div className="lg:pl-60">
                    <div className="mx-auto flex min-h-screen max-w-3xl flex-col lg:max-w-5xl">
                      <main className="flex-1 pb-20 lg:pb-8">{children}</main>
                    </div>
                  </div>
                  <FloatingMenu />
                  <BottomNav />
                </LoginGate>
              </FidsProvider>
            </EftirlitProvider>
          </PinGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
