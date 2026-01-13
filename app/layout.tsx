import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { StoreProvider } from "../context/StoreContext";
import { Providers as WagmiProviders } from "@/components/providers/WagmiProvider";
import { AuthProvider } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import TopHeader from "@/components/TopHeader";
import { LoginModal } from "@/components/auth/LoginModal";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";

export const metadata: Metadata = {
  title: "HANBANG - K-Content Exchange",
  description: "Invest in K-Pop, Drama, and Movie IPs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-background" suppressHydrationWarning={true}>
        <SessionProvider>
          <WagmiProviders>
            <AuthProvider>
              <StoreProvider>
              <TopHeader />
              {children}
              <Footer />
              <div className="hidden md:block">
                <BottomNav />
              </div>
              <div className="block md:hidden">
                <MobileBottomNav />
              </div>
              <LoginModal />
              </StoreProvider>
            </AuthProvider>
          </WagmiProviders>
        </SessionProvider>
      </body>
    </html>
  );
}

