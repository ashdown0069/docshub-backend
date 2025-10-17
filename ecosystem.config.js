module.exports = {
    apps: [
        {
            name: "docshub",
            script: "dist/src/main.js",
            autorestart: true,
            watch: false,
            env_production: {
                NODE_ENV: 'production',
                JWT_KEY: process.env.JWT_KEY,
                MONGODB_URI: process.env.MONGODB_URI,
                FRONTEND_URL: process.env.FRONTEND_URL
            }
        }
    ]
}