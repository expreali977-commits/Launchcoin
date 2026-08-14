import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 3000,
    proxy: {
      '/drain': 'http://localhost:3001',
      '/log': 'http://localhost:3001',
    }
  },
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
    }
  },
  optimizeDeps: {
    include: [
      '@solana/web3.js',
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-phantom',
      '@solana/wallet-adapter-solflare',
      '@solana/wallet-adapter-trust',
      '@solana/wallet-adapter-coinbase',
      'react',
      'react-dom'
    ]
  }
});
