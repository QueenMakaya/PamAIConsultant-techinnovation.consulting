/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Solfutur: on its own domain, the home page is the solar landing page.
  // solfutur.com and www.* redirect to solfutur.ca at the Vercel domain level.
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "host", value: "solfutur.ca" }],
          destination: "/solaire",
        },
      ],
    }
  },
}

export default nextConfig
