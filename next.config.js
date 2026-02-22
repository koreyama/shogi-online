const withSerwist = require('@serwist/next').default({
    swSrc: 'src/app/sw.ts',
    swDest: 'public/sw.js',
    reloadOnOnline: true,
    disable: true, // 緊急退避: Service Workerを無効化し登録を解除する
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'standalone', // Disabled for debugging
};

module.exports = withSerwist(nextConfig);
