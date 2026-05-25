const { defineConfig } = require('vite');
const tailwindcss = require('@tailwindcss/vite').default;

function rewriteTrailingIndex(req, fromPrefix, toPrefix) {
  const url = req.url || '';

  if (url === fromPrefix) {
    req.url = `${toPrefix}/`;
    return true;
  }

  if (url.startsWith(`${fromPrefix}?`)) {
    req.url = `${toPrefix}/${url.slice(fromPrefix.length)}`;
    return true;
  }

  return false;
}

function routeRewritePlugin() {
  const rewritePaths = (req, _res, next) => {
    const url = req.url || '';

    if (url === '/go' || url.startsWith('/go?')) {
      req.url = `/go/${url.slice(3)}`;
      next();
      return;
    }

    if (
      rewriteTrailingIndex(req, '/zh', '/zh') ||
      rewriteTrailingIndex(req, '/en', '/en') ||
      rewriteTrailingIndex(req, '/v2', '/v2')
    ) {
      next();
      return;
    }

    next();
  };

  return {
    name: 'tpclub-route-rewrite',
    configureServer(server) {
      server.middlewares.use(rewritePaths);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewritePaths);
    }
  };
}

module.exports = defineConfig({
  plugins: [tailwindcss(), routeRewritePlugin()],
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'src/main.js',
        go: 'src/go.jsx',
        v2: 'src/v2.jsx'
      },
      output: {
        entryFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]'
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
