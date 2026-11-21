import type { NextConfig } from "next";
import widths from "./lib/imageWidths.json";

const nextConfig: NextConfig = {
  images: {
    // Pre-sized static WebP files (scripts/image-variants.mjs), see lib/imageLoader.ts for why.
    loader: "custom",
    loaderFile: "./lib/imageLoader.ts",
    deviceSizes: widths.deviceSizes,
    imageSizes: widths.imageSizes,
  },
};

export default nextConfig;
