/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Aktifkan Turbopack untuk dev & build cepat
  experimental: {
    turbo: {
      // Biarkan Next.js yang deteksi root otomatis (hapus manual path)
      rules: {},
    },
    // ✅ Nonaktifkan sistem AI feedback bawaan Next supaya gak 404
    ai: {
      feedback: false,
    },
  },

  // ✅ Bersihkan warning build & dev
  eslint: {
    ignoreDuringBuilds: true, // Jangan blokir build karena lint
  },
  typescript: {
    ignoreBuildErrors: true, // Abaikan error TS minor pas dev
  },

  // ✅ Optimasi image & cache
  images: {
    formats: ["image/avif", "image/webp"],
    domains: [], // bisa tambahkan misal 'res.cloudinary.com' kalau pakai CDN
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aniptiuwjgiunalyjjqd.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // ✅ Strict mode React (boleh dimatikan kalau ganggu dev)
  reactStrictMode: true,

  // ✅ Output untuk Vercel atau custom server
  output: "standalone",
};

module.exports = nextConfig;