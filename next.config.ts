import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // The slide export picks the highlight font file at runtime, so the
  // tracer can't see which one; ship all of them with the Studio routes.
  outputFileTracingIncludes: {
    "/api/studio/posts/**": ["./src/assets/fonts/**/*"],
  },
  async redirects() {
    return [
      {
        source: "/discover",
        destination: "/discowver",
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
      {
        protocol: "https",
        hostname: "mosaic.scdn.co",
      },
      {
        protocol: "https",
        hostname: "image-cdn-ak.spotifycdn.com",
      },
      {
        protocol: "https",
        hostname: "image-cdn-fa.spotifycdn.com",
      },
    ],
  },
}

export default nextConfig
