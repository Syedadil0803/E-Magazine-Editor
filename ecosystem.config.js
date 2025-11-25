module.exports = {
  apps: [
    {
      name: 'magazine-editor',
      script: 'npm',
      args: 'run dev',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3333
      }
    }
  ]
};

