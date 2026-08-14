import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
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
    }
  },
  optimizeDeps: {
    include: [
      '@web3modal/ethers',
      '@web3modal/core',
      '@walletconnect/universal-provider',
      'react',
      'react-dom'
    ]
  },
  // Forza l'uso di React 18 per evitare conflitti
  define: {
    'process.env.NODE_ENV': '"production"',
  }
});
