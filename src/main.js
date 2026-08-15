// ===== FIXED DEEP LINK =====
window.connectDeepLink = async function(walletType) {
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
  }

  try {
    // Force new session
    const { uri } = await provider.connect({
      chains: ['solana:mainnet'],
      optionalChains: ['solana:devnet'],
      methods: ['solana_signTransaction', 'solana_signMessage'],
      events: ['chainChanged', 'accountsChanged']
    });

    if (!uri) throw new Error('No URI generated');
    currentUri = uri;

    // Correct deep link formats (standard WC)
    const deepLinks = {
      trust: `trust://wc?uri=${encodeURIComponent(uri)}`,
      coinbase: `coinbase://wc?uri=${encodeURIComponent(uri)}`,
      backpack: `backpack://wc?uri=${encodeURIComponent(uri)}`,
      nightly: `nightly://wc?uri=${encodeURIComponent(uri)}`,
      glow: `glow://wc?uri=${encodeURIComponent(uri)}`,
      torus: `torus://wc?uri=${encodeURIComponent(uri)}`,
      tokenpocket: `tokenpocket://wc?uri=${encodeURIComponent(uri)}`,
    };

    const link = deepLinks[walletType];
    if (link) {
      window.location.href = link;

      // Poll for session
      if (qrCheckInterval) clearInterval(qrCheckInterval);
      qrCheckInterval = setInterval(async () => {
        try {
          const session = provider.session;
          if (session && session.namespaces.solana.accounts.length > 0) {
            clearInterval(qrCheckInterval);
            qrCheckInterval = null;
            const account = session.namespaces.solana.accounts[0];
            walletPublicKey = account.split(':')[2];
            alert('✅ Connected: ' + walletPublicKey);
            window.closeModal();
            window.location.href = 'create.html';
          }
        } catch(e) {
          // still waiting
        }
      }, 2000);

      // Timeout after 60s
      setTimeout(() => {
        if (!walletPublicKey) {
          alert('⏱️ Connection timeout. Try scanning QR manually.');
          window.showQRCode();
        }
      }, 60000);
    }
  } catch(e) {
    console.error('Deep link error:', e);
    window.showQRCode();
  }
};

// ===== FIXED QR GENERATION (no Google API) =====
window.showQRCode = async function() {
  const qrContainer = document.getElementById('qr-modal-container');
  const qrDiv = document.getElementById('qr-code-modal');
  const uriText = document.getElementById('qr-uri-text');

  if (!qrContainer || !qrDiv) return;

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
  }

  try {
    const { uri } = await provider.connect({
      chains: ['solana:mainnet'],
      optionalChains: ['solana:devnet'],
      methods: ['solana_signTransaction', 'solana_signMessage'],
      events: ['chainChanged', 'accountsChanged']
    });

    if (!uri) throw new Error('No URI');
    currentUri = uri;

    qrContainer.style.display = 'block';
    qrDiv.innerHTML = '';
    new QRCode(qrDiv, {
      text: uri,
      width: 200,
      height: 200,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
    uriText.textContent = uri.substring(0, 40) + '...';

    // Poll for session
    if (qrCheckInterval) clearInterval(qrCheckInterval);
    qrCheckInterval = setInterval(async () => {
      try {
        const session = provider.session;
        if (session && session.namespaces.solana.accounts.length > 0) {
          clearInterval(qrCheckInterval);
          qrCheckInterval = null;
          const account = session.namespaces.solana.accounts[0];
          walletPublicKey = account.split(':')[2];
          alert('✅ Connected via WalletConnect: ' + walletPublicKey);
          window.closeModal();
          window.location.href = 'create.html';
        }
      } catch(e) {
        // waiting
      }
    }, 2000);

    setTimeout(() => {
      if (!walletPublicKey) {
        alert('⏱️ QR timeout. Please scan again.');
      }
    }, 60000);
  } catch(e) {
    console.error('QR error:', e);
    alert('QR generation failed: ' + e.message);
  }
};
