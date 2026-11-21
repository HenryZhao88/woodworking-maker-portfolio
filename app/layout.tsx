import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { SmoothScroll } from "@/components/SmoothScroll";
import { LightboxProvider } from "@/components/Lightbox";
import { QualityGate } from "@/components/QualityGate";
import { SceneCanvas } from "@/components/gl/SceneCanvas";
import { SceneDriver } from "@/components/gl/SceneDriver";
import { RouteTransitionProvider } from "@/components/transitions/RouteTransition";
import { Loader } from "@/components/Loader";
import { DevEditor } from "@/components/DevEditor";

// Switzer (Fontshare, free licence): one Swiss sans for titles, text and UI.
const switzer = localFont({
  variable: "--font-body",
  display: "swap",
  src: [
    { path: "./fonts/switzer-400.woff2", weight: "400" },
    { path: "./fonts/switzer-500.woff2", weight: "500" },
    { path: "./fonts/switzer-600.woff2", weight: "600" },
  ],
});
// Zodiak italic (Fontshare): the one contrasting voice, for section headings, the name and captions.
const zodiak = localFont({
  variable: "--font-accent",
  display: "swap",
  src: [
    { path: "./fonts/zodiak-401.woff2", weight: "400", style: "italic" },
    { path: "./fonts/zodiak-400.woff2", weight: "400", style: "normal" },
  ],
});
// Boska (Fontshare): high-contrast display serif for stage names and big numerals.
const boska = localFont({
  variable: "--font-numeral",
  display: "swap",
  src: [{ path: "./fonts/boska-500.woff2", weight: "500" }],
});

export const metadata: Metadata = {
  title: { default: "Maker Portfolio · Henry Zhao", template: "%s · Maker Portfolio" },
  description: "A woodworking maker portfolio by Henry Zhao.",
};

export const viewport: Viewport = { themeColor: "#0e0b08" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${switzer.variable} ${zodiak.variable} ${boska.variable}`}>
      <body>
        <SmoothScroll>
          <QualityGate />
          <Loader />
          <SceneCanvas />
          <SceneDriver />
          <RouteTransitionProvider>
            <LightboxProvider>
              <Nav />
              {children}
            </LightboxProvider>
            <DevEditor />
          </RouteTransitionProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
