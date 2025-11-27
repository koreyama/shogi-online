/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        RESEND_API_KEY: process.env.RESEND_API_KEY,
        CONTACT_EMAIL: process.env.CONTACT_EMAIL,
    },
};

export default nextConfig;
