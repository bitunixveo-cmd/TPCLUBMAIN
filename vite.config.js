const { defineConfig } = require('vite');

module.exports = defineConfig({
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'src/main.js'
      },
      output: {
        entryFileNames: 'assets/[name].js'
      }
    }
  },
  publicDir: false,
  server: {
    host: '0.0.0.0'
  },
  preview: {
    host: '0.0.0.0'
  }
});
