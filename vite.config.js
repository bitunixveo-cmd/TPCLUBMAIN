const { defineConfig } = require('vite');
const tailwindcss = require('@tailwindcss/vite').default;

function rewriteTrailingIndex(req, fromPrefix, toPrefix = fromPrefix) {
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

    if (url === '/zh/go' || url.startsWith('/zh/go?')) {
      req.url = `/zh/go/${url.slice(6)}`;
      next();
      return;
    }

    if (rewriteTrailingIndex(req, '/meta', '/zh/meta')) {
      next();
      return;
    }

    if (
      rewriteTrailingIndex(req, '/en/meta') ||
      rewriteTrailingIndex(req, '/zh/meta') ||
      rewriteTrailingIndex(req, '/zh') ||
      rewriteTrailingIndex(req, '/en') ||
      rewriteTrailingIndex(req, '/v2') ||
      rewriteTrailingIndex(req, '/agt') ||
      rewriteTrailingIndex(req, '/dashboard')
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
        v2: 'src/v2.jsx',
        agt: 'src/agt.js',
        dashboard: 'src/dashboard.js'
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
