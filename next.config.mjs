/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'search1.kakaocdn.net',
      },
      {
        protocol: 'https',
        hostname: 'search2.kakaocdn.net',
      },
      {
        protocol: 'https',
        hostname: 'search3.kakaocdn.net',
      },
      {
        protocol: 'https',
        hostname: 'search4.kakaocdn.net',
      },
    ],
  },
}

export default nextConfig
