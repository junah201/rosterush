import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/** 로컬 API 서버 (serverless offline) */
const API_DEV_ORIGIN = process.env.API_DEV_ORIGIN ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // 정적 export는 rewrites/redirects를 지원하지 않으므로 빌드할 때만 켠다.
  // 개발 중에는 아래 rewrites로 CloudFront의 경로 라우팅 일부를 대신한다.
  output: isDev ? undefined : "export",
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ["@rosterush/core", "@rosterush/games"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(isDev && {
    // trailingSlash의 `/api/results` → `/api/results/` 308 리다이렉트를 끈다 (API 요청이 한 번 더 왕복하지 않게).
    // 페이지 링크는 항상 `/`로 끝나게 작성하므로 영향 없음.
    skipTrailingSlashRedirect: true,
    // `/` → `/ko/` 이동 (배포 환경에서는 CloudFront Function이 담당)
    redirects: async () => [{ source: "/", destination: "/ko/", permanent: false }],
    rewrites: async () => [
      // `/api/*` → serverless offline (배포 환경에서는 CloudFront → API Gateway)
      { source: "/api/:path*", destination: `${API_DEV_ORIGIN}/api/:path*` },
      // `/s/{shareId}` → 공유 페이지. 배포 환경에서는 API가 기록 언어의 껍데기에 미리보기 메타 태그를 넣어 응답하고,
      // 개발 중에는 메타 태그 없이 ko 껍데기만 보여준다.
      { source: "/s/:shareId", destination: "/ko/s/" },
    ],
  }),
};

export default nextConfig;
