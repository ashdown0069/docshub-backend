module.exports = {
    apps: [
        {
            name: "docshub",
            script: "dist/src/main.js",
            watch: true,
            env: {
                "NODE_ENV": "development",
            }
        }
    ]
}