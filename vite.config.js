const { defineConfig } = require('vite');

module.exports = defineConfig({
  publicDir: false,
  server: {
    host: '0.0.0.0'
  },
  preview: {
    host: '0.0.0.0'
  }
});
