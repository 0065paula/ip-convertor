import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  basePath: process.env.NODE_ENV === 'production' ? '/ip-convertor' : '',
};

export default nextConfig;
