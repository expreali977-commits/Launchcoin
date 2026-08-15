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

// ===== CONNECT WALLET =====
window.connectWallet = async function() {
  console.log('🔵 connectWallet chiamata');
  
  // 1. Prova Phantom (estensione)
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

  // 2. WalletConnect (carica dinamicamente)
  try {
    // Carica WalletConnect dal CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@walletconnect/web3wallet@1.16.1/dist/index.umd.min.js';
    document.head.appendChild(script);
    
    await new Promise((resolve) => {
      script.onload = resolve;
      script.onerror = () => {
        // Fallback a cdnjs
        const script2 = document.createElement('script');
        script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/walletconnect-web3wallet/1.16.1/index.min.js';
        document.head.appendChild(script2);
        script2.onload = resolve;
        setTimeout(resolve, 5000);
      };
      setTimeout(resolve, 5000);
    });

    const WalletConnectWallet = window.WalletConnectWallet || window.web3wallet;
    if (!WalletConnectWallet) {
      throw new Error('WalletConnect non caricato');
    }

    const web3wallet = await WalletConnectWallet.init({
      projectId: 'da6aaea2be14c6cc676dbaf3325b5bd5',
      metadata: {
        name: 'LaunchCoin',
        description: 'Solana Token Creator',
        url: window.location.origin,
        icons: ['https://launchcoin.io/logo.png']
      }
    });

    // Apri il modale WalletConnect (genera QR)
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
      return;
    }
  } catch(e) {
    console.error('WalletConnect error:', e);
  }

  // 3. Fallback: reindirizza a wallet.html
  window.location.href = 'wallet.html';
};

// ===== SELECT WALLET =====
window.selectWallet = function(walletName) {
  console.log('🔵 selectWallet:', walletName);
  if (walletName === 'phantom') {
    window.connectWallet();
    return;
  }
  // Per gli altri wallet, usa WalletConnect
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

// ===== CHIUDI MENU =====
document.addEventListener('click', function(e) {
  const wrapper = document.querySelector('.menu-wrapper');
  const menu = document.getElementById('dropdownMenu');
  if (wrapper && menu && !wrapper.contains(e.target)) menu.classList.remove('open');
});

console.log('✅ main.js caricato');
