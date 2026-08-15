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
      },
      // AGGIUNGI QUESTA RIGA QUI SOTTO PER RISOLVERE L'ERRORE DI BUILD
      external: ['rpc-websockets/dist/lib/client']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  optimizeDeps: {
    include: [
      '@web3modal/solana',  // Cambiato da '@web3modal/ethers'
      '@solana/web3.js',
    ]
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  }
});
