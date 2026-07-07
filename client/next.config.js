/** @type {import('next').NextConfig} */
const nextConfig = {
  // En dev, autoriser l'accès via les tunnels (téléphone) en plus du LAN.
  allowedDevOrigins: ['172.17.80.1', '*.trycloudflare.com', '*.ngrok-free.app', '*.loca.lt'],
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  // Le lint du repo est cassé (pas de config flat) → ne pas bloquer le build de prod dessus.
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
