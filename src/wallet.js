// src/wallet.js
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { TrustWalletAdapter } from '@solana/wallet-adapter-trust';
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase';
// import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack'; // RIMOSSO: non più usato
import { TokenPocketWalletAdapter } from '@solana/wallet-adapter-tokenpocket';

// ... resto del codice
export const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new TrustWalletAdapter(),
  new CoinbaseWalletAdapter(),
  // new BackpackWalletAdapter(), // RIMOSSO: non più usato
  new TokenPocketWalletAdapter(),
];

// ... la funzione getWalletAdapter va aggiornata di conseguenza
export function getWalletAdapter(name) {
  const walletMap = {
    'phantom': PhantomWalletAdapter,
    'solflare': SolflareWalletAdapter,
    'trust': TrustWalletAdapter,
    'coinbase': CoinbaseWalletAdapter,
    // 'backpack': BackpackWalletAdapter, // RIMOSSO
    'tokenpocket': TokenPocketWalletAdapter,
  };
  // ... 
}
