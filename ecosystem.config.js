module.exports = {
  apps: [
    {
      name: "dukanmitra.com",
      script: "npx",
      args: "cds-serve",
      interpreter: "none", // run without wrapping in node
      instances: 1, // or "max" if you want cluster mode
      exec_mode: "fork", // or "cluster"
      watch: false,
      env: {
        NODE_ENV: "development",
        PORT: 4004, // default CAP port
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 4004,
      },
    },
  ],
};
