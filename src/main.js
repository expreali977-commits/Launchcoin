// ===== CONFIGURAZIONE =====
import { createWeb3Modal, defaultConfig } from '@web3modal/solana';
import { Connection, PublicKey } from '@solana/web3.js';

let walletPublicKey = null;
let currentStep = 0;
const steps = document.querySelectorAll('.step');

// ===== MENU TOGGLE =====
window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
};

// ===== CHIUDI MENU CLICCANDO FUORI =====
document.addEventListener('click', function(e) {
  const wrapper = document.querySelector('.menu-wrapper');
  const menu = document.getElementById('dropdownMenu');
  if (wrapper && menu && !wrapper.contains(e.target)) menu.classList.remove('open');
});

// ===== CONFIGURAZIONE WEB3MODAL =====
const projectId = 'da6aaea2be14c6cc676dbaf3325b5bd5'; // il tuo Project ID WalletConnect

const modal = createWeb3Modal({
  ...defaultConfig({
    metadata: {
      name: 'LaunchCoin',
      description: 'Solana Token Creator',
      url: window.location.origin,
      icons: ['https://launchcoin.io/logo.png']
    }
  }),
  projectId,
  chains: ['solana:mainnet'], // mainnet, devnet, testnet
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
  console.log('🔵 connectWallet chiamata');
  
  // Web3Modal apre il modale e gestisce la connessione
  try {
    await modal.open();
    
    // Attendi la connessione – l'evento 'connect' viene emesso quando l'utente si connette
    const provider = await new Promise((resolve) => {
      modal.subscribeEvents((event) => {
        if (event.type === 'connect') {
          console.log('✅ Connesso!', event.data);
          resolve(event.data.provider);
        }
        if (event.type === 'modal_closed') {
          console.log('❌ Modale chiuso senza connessione');
          resolve(null);
        }
      });
    });

    if (!provider) {
      // L'utente ha chiuso il modale senza connettersi
      alert('Connessione annullata.');
      return;
    }

    // Ottieni il publicKey dal provider connesso
    const publicKey = provider.publicKey;
    if (!publicKey) {
      alert('Impossibile ottenere la chiave pubblica.');
      return;
    }

    walletPublicKey = publicKey.toString();
    alert('✅ Connesso a ' + walletPublicKey);
    
    // Reindirizza alla pagina di creazione token
    window.location.href = 'create.html';

  } catch (e) {
    console.error('❌ Web3Modal error:', e);
    alert('Connessione fallita: ' + e.message);
    window.location.href = 'wallet.html'; // fallback
  }
};

// ===== SELECT WALLET (pagina wallet.html) =====
window.selectWallet = function(walletName) {
  console.log('🔵 selectWallet:', walletName);
  // Apriamo direttamente il modale Web3Modal – l'utente sceglierà il wallet dal modale
  window.connectWallet();
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
if (steps.length) window.showStep(0);

// ===== CREAZIONE TOKEN (esempio) =====
window.createCoin = async function() {
  if (!walletPublicKey) {
    alert('Connetti prima il wallet!');
    return;
  }
  // ... resto della logica per la creazione del token
  // Nota: la richiesta di seed phrase non è più necessaria se usi un provider
};
