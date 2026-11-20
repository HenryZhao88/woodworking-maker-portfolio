import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { SmoothScroll } from "@/components/SmoothScroll";
import { LightboxProvider } from "@/components/Lightbox";
import { QualityGate } from "@/components/QualityGate";
import { SceneCanvas } from "@/components/gl/SceneCanvas";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  style: ["normal", "italic"],
});

const body = Geist({ variable: "--font-body", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Maker Portfolio — Henry Zhao", template: "%s — Maker Portfolio" },
  description: "A woodworking maker portfolio by Henry Zhao.",
};

export const viewport: Viewport = { themeColor: "#0e0b08" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <SmoothScroll>
          <QualityGate />
          <SceneCanvas />
          <LightboxProvider>
            <Nav />
            {children}
          </LightboxProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
