/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'xvmzbysdwvnooozisvoc.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
        ],
        unoptimized: true
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '50mb'
        }
    }
}

export default nextConfig
