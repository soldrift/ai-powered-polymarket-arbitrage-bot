import type { Metadata } from "next";
import Link from "next/link";
import { ToastProvider } from "@/contexts/ToastContext";
import { NavLinks } from "@/components/NavLinks";
import "./globals.css";

export const metadata: Metadata = {
  title: "PolyTrail | Polymarket Trading Bot",
  description: "Polymarket trading bot – impulse detection, trailing stop, hedging, auto-redeem for Up/Down markets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
        <div className="layout layoutWithSidebar">
          <aside className="sidebar">
            <Link href="/" className="sidebarLogo">
              <span className="appLogo">▲ PolyTrail</span>
            </Link>
            <nav className="sidebarNav">
              <NavLinks />
            </nav>
          </aside>
          <div className="layoutMain">
            <header className="layoutHeader">
              <div className="layoutHeaderInner" />
            </header>
            <main className="main">{children}</main>
          </div>
        </div>
        </ToastProvider>
      </body>
    </html>
  );
}
