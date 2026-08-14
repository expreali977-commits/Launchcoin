// ===== CONFIGURAZIONE =====
import { createWeb3Modal, defaultConfig } from '@web3modal/solana';

let walletPublicKey = null;
let web3modal = null;

// ===== INIT WEB3MODAL (SOLANA) =====
async function initWeb3Modal() {
  if (!web3modal) {
    try {
      const config = {
        projectId: 'da6aaea2be14c6cc676dbaf3325b5bd5', // il tuo projectId
        themeMode: 'dark',
        themeVariables: {
          '--w3m-z-index': '10000',
          '--w3m-background-color': '#0b1022',
          '--w3m-accent-color': '#22d1f8',
          '--w3m-border-radius': '16px',
        },
        metadata: {
          name: 'LaunchCoin',
          description: 'Solana Token Creator',
          url: window.location.origin,
          icons: ['https://launchcoin.io/logo.png'],
        },
        // Abilita i wallet desiderati
        enableWalletConnect: true,        // mostra WalletConnect (QR code)
        enableInjected: true,            // rileva wallet installati (Phantom, ecc.)
        enableCoinbase: true,            // Coinbase Wallet
        walletConnectVersion: 2,
        // Includi wallet Solana più comuni
        includeWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // Phantom
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Solflare
          '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Torus
          'c03dfee351b6fcc421b4494ea33b9d4b92a7f33d6df5c43ee76267edfceed3a2', // Coin98
          'f2436c67184f158d1beda5df5327ee9bad2c749486aac4bf5e18b4eab0aebc45', // Trust Wallet
        ],
      };

      web3modal = createWeb3Modal(config);
      console.log('✅ Web3Modal Solana inizializzato');
    } catch (e) {
      console.error('❌ Web3Modal error:', e);
      throw e;
    }
  }
  return web3modal;
}

// ===== CONNECT WALLET =====
window.connectWallet = async function() {
  console.log('🔵 connectWallet chiamata');
  try {
    const modal = await initWeb3Modal();
    await modal.open();

    // Ascolta l'evento di connessione
    modal.subscribeEvents((event) => {
      if (event.type === 'connected') {
        const { address } = event.data; // l'indirizzo Solana
        walletPublicKey = address;
        alert('✅ Connesso: ' + walletPublicKey);
        window.location.href = 'create.html';
      }
    });
  } catch (e) {
    console.error('❌ Errore connessione:', e);
    alert('Errore durante la connessione. Riprova.');
  }
};

// ===== MENU TOGGLE (già presente) =====
window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
};

document.addEventListener('click', function(e) {
  const wrapper = document.querySelector('.menu-wrapper');
  const menu = document.getElementById('dropdownMenu');
  if (wrapper && menu && !wrapper.contains(e.target)) menu.classList.remove('open');
});

// ===== CREAZIONE TOKEN (resto invariato) =====
window.createCoin = async function() {
  console.log('🟢 createCoin chiamata');
  if (!walletPublicKey) {
    alert('Connetti prima il wallet!');
    return;
  }
  // ... il resto del tuo codice createCoin ...
};

// ===== ALTRE FUNZIONI (step, ecc.) =====
// ... mantieni il codice per gli step ...
