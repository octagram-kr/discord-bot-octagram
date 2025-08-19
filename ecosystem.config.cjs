module.exports = {
  apps: [
    {
      name: "octagram-bot-prod",
      script: "./src/index.ts",
      interpreter: "bun",
      env: {
        NODE_ENV: "production"
      }
    }, {
      name: "octagram-bot-dev",
      script: "./src/index.ts",
      interpreter: "bun",
      env: {
        NODE_ENV: "development"
      }
    }
  ]
}