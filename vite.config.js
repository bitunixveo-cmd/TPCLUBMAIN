const { defineConfig } = require('vite');

function goRoutePlugin() {
  const rewriteGoPath = (req, _res, next) => {
    const url = req.url || '';

    if (url === '/go' || url.startsWith('/go?')) {
      req.url = `/go/${url.slice(3)}`;
    }

    next();
  };

  return {
    name: 'tpclub-go-route',
    configureServer(server) {
      server.middlewares.use(rewriteGoPath);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewriteGoPath);
    }
  };
}

module.exports = defineConfig({
  plugins: [goRoutePlugin()],
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'src/main.js',
        go: 'src/go.jsx'
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
