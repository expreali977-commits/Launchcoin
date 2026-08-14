// src/wallet-adapter-polyfill.js
// Questo file fornisce un fallback per wallet che non supportano l'adapter standard

// Polyfill per connessione Phantom
export function connectPhantom() {
  return new Promise((resolve, reject) => {
    if (!window.solana) {
      reject(new Error('Phantom non installato'));
      return;
    }
    
    if (!window.solana.isPhantom) {
      reject(new Error('Phantom non rilevato'));
      return;
    }
    
    window.solana.connect()
      .then(response => {
        resolve({
          publicKey: response.publicKey.toString(),
          wallet: 'phantom'
        });
      })
      .catch(reject);
  });
}

// Polyfill per connessione Solflare
export function connectSolflare() {
  return new Promise((resolve, reject) => {
    if (!window.solflare) {
      reject(new Error('Solflare non installato'));
      return;
    }
    
    window.solflare.connect()
      .then(() => {
        resolve({
          publicKey: window.solflare.publicKey.toString(),
          wallet: 'solflare'
        });
      })
      .catch(reject);
  });
}

// Rilevamento wallet installati
export function detectInstalledWallets() {
  const wallets = [];
  
  if (window.solana && window.solana.isPhantom) {
    wallets.push('phantom');
  }
  
  if (window.solflare) {
    wallets.push('solflare');
  }
  
  if (window.trustwallet) {
    wallets.push('trust');
  }
  
  if (window.coinbaseWallet) {
    wallets.push('coinbase');
  }
  
  return wallets;
}
