// src/wallet.js
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { TrustWalletAdapter } from '@solana/wallet-adapter-trust';
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import { TokenPocketWalletAdapter } from '@solana/wallet-adapter-tokenpocket';

// Configurazione
export const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
export const connection = new Connection(SOLANA_RPC, 'confirmed');

// Lista wallet supportati
export const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new TrustWalletAdapter(),
  new CoinbaseWalletAdapter(),
  new BackpackWalletAdapter(),
  new TokenPocketWalletAdapter(),
];

// Stato wallet
let currentWallet = null;
let publicKey = null;

// Ottieni wallet per nome
export function getWalletAdapter(name) {
  const walletMap = {
    'phantom': PhantomWalletAdapter,
    'solflare': SolflareWalletAdapter,
    'trust': TrustWalletAdapter,
    'coinbase': CoinbaseWalletAdapter,
    'backpack': BackpackWalletAdapter,
    'tokenpocket': TokenPocketWalletAdapter,
  };
  
  const AdapterClass = walletMap[name];
  if (AdapterClass) {
    return new AdapterClass();
  }
  return null;
}

// Connetti wallet
export async function connectWallet(walletName) {
  try {
    // Se c'è già un wallet connesso, disconnetti
    if (currentWallet) {
      await disconnectWallet();
    }
    
    const adapter = getWalletAdapter(walletName);
    if (!adapter) {
      throw new Error(`Wallet ${walletName} non supportato`);
    }
    
    await adapter.connect();
    publicKey = adapter.publicKey;
    currentWallet = adapter;
    
    return {
      success: true,
      publicKey: publicKey.toString(),
      walletName: walletName,
    };
  } catch (error) {
    console.error('Errore connessione:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Disconnetti wallet
export async function disconnectWallet() {
  if (currentWallet) {
    try {
      await currentWallet.disconnect();
    } catch (e) {}
  }
  currentWallet = null;
  publicKey = null;
}

// Ottieni wallet connesso
export function getConnectedWallet() {
  return {
    publicKey: publicKey ? publicKey.toString() : null,
    wallet: currentWallet,
    isConnected: !!currentWallet && !!publicKey,
  };
}

// Firma transazione (esempio)
export async function signTransaction(transaction) {
  if (!currentWallet || !publicKey) {
    throw new Error('Wallet non connesso');
  }
  return await currentWallet.signTransaction(transaction);
}

// Ottieni saldo
export async function getBalance(address) {
  try {
    const pubKey = new PublicKey(address);
    const balance = await connection.getBalance(pubKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Errore saldo:', error);
    return 0;
  }
}
