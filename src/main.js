// ===== CONFIGURAZIONE =====
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
import { useWallet } from '@solana/wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';

// ===== COMPONENTE PRINCIPALE =====
function App() {
  const endpoint = useMemo(() => clusterApiUrl('mainnet-beta'), []);
  
  // TUTTI I WALLET SUPPORTATI (come Uniswap)
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
          <div style={{ padding: '20px' }}>
            <WalletMultiButton />
            <h1>LaunchCoin</h1>
            <p>Solana Token Creator</p>
            <p>from concept to token in just a few clicks!</p>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// ===== RENDER =====
ReactDOM.render(<App />, document.getElementById('root'));
