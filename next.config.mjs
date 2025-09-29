/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Temporarily disable CSP headers for development AI testing
  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         {
  //           key: 'Content-Security-Policy',
  //           value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' data:; object-src 'none'; base-uri 'none';"
  //         }
  //       ]
  //     }
  //   ]
  // }
}

export default nextConfig
