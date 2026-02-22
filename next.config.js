const withSerwist = require('@serwist/next').default({
    swSrc: 'src/app/sw.ts',
    swDest: 'public/sw.js',
    reloadOnOnline: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'standalone', // Disabled for debugging
};

module.exports = withSerwist(nextConfig);
