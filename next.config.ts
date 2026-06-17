import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@amcharts/amcharts5', '@amcharts/amcharts5-geodata'],
};

export default nextConfig;
