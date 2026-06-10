import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
    ],
  },
  experimental: {
    serverActions: {
      // 商品圖片與 CSV 經 Server Action 上傳
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
