// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      // Forza l'uso del file CommonJS per risolvere l'import problematico
      'rpc-websockets/dist/lib/client': 'rpc-websockets/dist/lib/client.cjs',
    },
  },
  // Opzionale: evita di pre-bundlare @solana/web3.js per ridurre errori
  optimizeDeps: {
    exclude: ['@solana/web3.js', '@web3modal/solana'],
  },
});
