// ===== CONFIGURAZIONE =====
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter, TrustWalletAdapter, CoinbaseWalletAdapter, TorusWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useWallet } from '@solana/wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';

// ===== COMPONENTE PRINCIPALE (COME UNISWAP) =====
function App() {
  // Configurazione della rete Solana
  const endpoint = useMemo(() => clusterApiUrl('mainnet-beta'), []);
  
  // Lista wallet supportati (come Uniswap)
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TrustWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {/* Pulsante Connect che apre la finestra con tutti i wallet */}
          <WalletMultiButton />
          <div id="app-content">
            {/* Il resto del tuo sito */}
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// ===== RENDER =====
ReactDOM.render(<App />, document.getElementById('root'));
