// ===== main.js – SOLO DEEP LINK APERTURA APP =====
let walletPublicKey = null;
let currentStep = 0;
const steps = document.querySelectorAll('.step');

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
        <button onclick="window.openWallet('phantom')" style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px 16px;color:#ecf5ff;cursor:pointer;transition:0.2s;font-size:15px;width:100%;">
          <img src="assets/phantom.png" alt="Phantom" style="width:28px;height:28px;" /> Phantom (App)
        </button>
        <button onclick="window.openWallet('solflare')" style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px 16px;color:#ecf5ff;cursor:pointer;transition:0.2s;font-size:15px;width:100%;">
          <img src="assets/solflare.png" alt="Solflare" style="width:28px;height:28px;" /> Solflare
        </button>
        <button onclick="window.openWallet('trust')" style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px 16px;color:#ecf5ff;cursor:pointer;transition:0.2s;font-size:15px;width:100%;">
          <img src="assets/trust.png" alt="Trust" style="width:28px;height:28px;" /> Trust Wallet
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

window.closeModal = function() {
  const overlay = document.getElementById('wallet-modal-overlay');
  if (overlay) overlay.remove();
};

// ===== APRI WALLET DIRETTAMENTE (NESSUN QR, NESSUNA SESSIONE WC) =====
window.openWallet = function(walletName) {
  window.closeModal();
  
  // Genera un link di connessione diretto (es. per Phantom)
  // Questo link apre l'app del wallet e avvia la connessione automatica
  const deepLinks = {
    'phantom': 'https://phantom.app/ul/browse/' + encodeURIComponent(window.location.href),
    'solflare': 'solflare://',
    'trust': 'trust://',
  };

  const link = deepLinks[walletName] || 'https://phantom.app/ul/browse/' + encodeURIComponent(window.location.href);
  window.location.href = link;

  // SIMULAZIONE: dopo 5 secondi, mostra un messaggio di connessione fittizia (per test)
  setTimeout(() => {
    walletPublicKey = 'fakePublicKey123'; // Sostituisci con la vera chiave se hai un meccanismo di callback
    alert('✅ Wallet aperto! (Simulazione)');
    window.location.href = 'create.html';
  }, 5000);
};

// ===== MAIN CONNECT =====
window.connectWallet = async function() {
  console.log('🔵 connectWallet chiamata');
  createModal();
};

// ===== CREAZIONE TOKEN =====
window.createCoin = async function() {
  if (!walletPublicKey) {
    alert('Connetti prima il wallet!');
    return;
  }
  alert('✅ Token creato! (Simulazione)');
};

// ===== NAVIGAZIONE STEP =====
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
