import { defineConfig } from 'vite';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    nodePolyfills({
      include: [
        'crypto',
        'stream',
        'events',
        'buffer',
        'process',
        'util',
        'string_decoder',
        'zlib',
        'http',
        'https',
        'url',
        'path',
        'fs',
        'net',
        'tls',
        'dgram',
        'dns'
      ]
    })
  ],
  server: { port: 3000 },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        create: path.resolve(__dirname, 'create.html'),
        liquidity: path.resolve(__dirname, 'liquidity.html'),
        faq: path.resolve(__dirname, 'faq.html'),
        wallet: path.resolve(__dirname, 'wallet.html'),
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Aggiungi questi alias per risolvere i moduli Node.js
      'node:net': 'net',
      'node:http': 'http',
      'node:https': 'https',
      'node:url': 'url',
      'node:path': 'path',
      'node:fs': 'fs',
      'node:stream': 'stream',
      'node:crypto': 'crypto',
      'node:zlib': 'zlib',
      'node:tls': 'tls',
      'node:dgram': 'dgram',
      'node:dns': 'dns'
    }
  },
  optimizeDeps: {
    include: [
      '@web3modal/solana',
      '@solana/web3.js',
      'rpc-websockets',
      'node-fetch'
    ]
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});
