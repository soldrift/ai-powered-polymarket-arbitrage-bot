const path = require("path");

const root = __dirname;

module.exports = {
  apps: [
    {
      name: "polytrail-bot",
      cwd: root,
      script: "node",
      args: "dist/index.js",
      interpreter: "none",
      env: { NODE_ENV: "production" },
      autorestart: true,
      watch: false,
    },
    {
      name: "polytrail-frontend",
      cwd: path.join(root, "frontend"),
      script: "npm",
      args: "run start",
      interpreter: "none",
      env: { NODE_ENV: "development" },
      autorestart: true,
      watch: false,
    },
  ],
};
