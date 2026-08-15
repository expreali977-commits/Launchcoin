import { defineConfig } from 'vite';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    nodePolyfills({
      include: ['crypto', 'stream', 'events', 'buffer', 'process']
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
      '@': path.resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    include: [
      '@web3modal/solana',
      '@solana/web3.js'
    ]
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});
