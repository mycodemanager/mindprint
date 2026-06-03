import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 归档经 Server Action 传 htmlContent（≤10MB 文件）。默认 body 限 1MB → 调高。
    // 取 16mb：UTF-8/CJK 序列化会膨胀，10MB 文件序列化后可能超 10MB，留余量。
    // ⚠️ 已知坑 vercel/next.js#77505：个别版本生产忽略此限；上线后大文件归档报 body 超限时排查。
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
