import { createWeb3Modal, defaultSolanaConfig } from '@web3modal/solana';

let walletPublicKey = null;
let currentStep = 0;
const steps = document.querySelectorAll('.step');

window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
};

// ===== CONFIGURAZIONE WEB3MODAL (SOLANA) =====
const projectId = 'da6aaea2be14c6cc676dbaf3325b5bd5';

const modal = createWeb3Modal({
  solanaConfig: defaultSolanaConfig({
    metadata: {
      name: 'LaunchCoin',
      description: 'Solana Token Creator',
      url: window.location.origin,
      icons: ['https://launchcoin.io/logo.png']
    }
  }),
  projectId,
  chains: ['solana:mainnet'], // Solo Solana
  themeMode: 'dark',
  themeVariables: {
    '--w3m-z-index': '10000',
    '--w3m-background-color': '#0b1022',
    '--w3m-accent-color': '#22d1f8',
    '--w3m-border-radius': '16px'
  }
});

// ===== CONNECT WALLET =====
window.connectWallet = async function() {
  try {
    await modal.open();

    const unsubscribe = modal.subscribeEvents((event) => {
      if (event.type === 'connect') {
        const { address } = event.data;
        walletPublicKey = address;
        alert('✅ Connesso a ' + walletPublicKey);
        window.location.href = 'create.html';
        unsubscribe();
      }
      if (event.type === 'modal_closed') {
        console.log('❌ Modale chiuso senza connessione');
        unsubscribe();
      }
    });
  } catch (e) {
    console.error('❌ Web3Modal error:', e);
    window.location.href = 'wallet.html';
  }
};

// ===== SELECT WALLET (per la pagina wallet.html) =====
window.selectWallet = function(walletName) {
  window.connectWallet();
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

document.addEventListener('click', function(e) {
  const wrapper = document.querySelector('.menu-wrapper');
  const menu = document.getElementById('dropdownMenu');
  if (wrapper && menu && !wrapper.contains(e.target)) menu.classList.remove('open');
});

console.log('✅ main.js caricato (Web3Modal Solana)');
