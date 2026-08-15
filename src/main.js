// ===== CONFIGURAZIONE =====
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TrustWalletAdapter,
  CoinbaseWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  WalletConnectWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// ===== STILI WALLET ADAPTER (COME UNISWAP) =====
import '@solana/wallet-adapter-react-ui/styles.css';

// ===== COMPONENTE PRINCIPALE =====
function App() {
  const endpoint = useMemo(() => clusterApiUrl('mainnet-beta'), []);
  
  // TUTTI I WALLET (COME UNISWAP)
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TrustWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new WalletConnectWalletAdapter({
        network: 'mainnet-beta',
        options: {
          projectId: 'da6aaea2be14c6cc676dbaf3325b5bd5',
        },
      }),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            {/* PULSANTE CONNECT (COME UNISWAP) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <WalletMultiButton />
            </div>
            
            {/* CONTENUTO DEL SITO */}
            <header>
              <h1 style={{ color: '#22d1f8', fontSize: '52px' }}>LaunchCoin</h1>
              <p style={{ fontSize: '28px', color: '#ecf5ff' }}>Solana Token Creator</p>
              <p style={{ fontSize: '20px', color: '#abc4ff' }}>from concept to token in just a few clicks!</p>
            </header>
            
            {/* STATS */}
            <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', marginTop: '40px' }}>
              <div><span style={{ color: '#22d1f8' }}>$BONK</span><br /><small>Market Cap $1,402,083,298</small></div>
              <div><span style={{ color: '#22d1f8' }}>$FLOKI</span><br /><small>Market Cap $918,084,213</small></div>
              <div><span style={{ color: '#22d1f8' }}>$SHIB</span><br /><small>Market Cap $9,577,353,223</small></div>
            </div>
            
            {/* CONTENUTO REATTIVO PER LA CREAZIONE DEL TOKEN */}
            <div id="app-content">
              {/* Il resto del tuo sito verrà aggiunto qui */}
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// ===== RENDER =====
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
