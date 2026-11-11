/** @type {import('next').NextConfig} */
if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
  throw new Error("PH01: Không cho phép NEXT_PUBLIC_DEMO_MODE=true trong production/staging build");
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
