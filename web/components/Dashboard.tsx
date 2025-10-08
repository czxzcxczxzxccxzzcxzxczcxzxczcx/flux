import { useEffect, useState } from 'react';
import { Box, Button, Typography, Paper, Grid, TextField, MenuItem, CircularProgress } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
// import { ethers } from 'ethers';
// import { HDNode } from '@ethersproject/hdnode';
import * as bitcoin from 'bitcoinjs-lib';
import * as bip32 from 'bip32';
import axios from 'axios';
import bip39 from 'bip39';


interface DashboardProps {
  mnemonic: string;
  onLogout: () => void;
}




function getBtcAddress(mnemonic: string) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed);
  const child = root.derivePath("m/44'/0'/0'/0/0");
  return bitcoin.payments.p2pkh({ pubkey: child.publicKey }).address;
}

export default function Dashboard({ mnemonic, onLogout }: DashboardProps) {
  const [btcAddress, setBtcAddress] = useState('');
  const [btcBalance, setBtcBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [sendError, setSendError] = useState('');

  // Bitcoin price state
  const [btcPrice, setBtcPrice] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<{ time: string; price: number }[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);

  // Send form state
  // Only BTC now
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    setBtcAddress(getBtcAddress(mnemonic) || '');
  }, [mnemonic]);

  // Fetch current BTC price
  useEffect(() => {
    async function fetchPrice() {
      setPriceLoading(true);
      try {
        // Coingecko API for current price
        const resp = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        setBtcPrice(resp.data.bitcoin.usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' }));
      } catch (e) {
        setBtcPrice('Error');
      }
      setPriceLoading(false);
    }
    fetchPrice();
  }, []);

  // Fetch BTC price history (last 7 days)
  useEffect(() => {
    async function fetchHistory() {
      try {
        // Coingecko API for 7-day price history
        const resp = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart', {
          params: { vs_currency: 'usd', days: 7, interval: 'hourly' },
        });
        const prices = resp.data.prices.map((p: [number, number]) => ({
          time: new Date(p[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: p[1],
        }));
        setPriceHistory(prices);
      } catch (e) {
        setPriceHistory([]);
      }
    }
    fetchHistory();
  }, []);

  useEffect(() => {
    async function fetchBalances() {
      setLoading(true);
      try {
  const btcAddr = getBtcAddress(mnemonic);
  const resp = await axios.get(`https://blockstream.info/api/address/${btcAddr}`);
  const balance = resp.data.chain_stats.funded_txo_sum - resp.data.chain_stats.spent_txo_sum;
  setBtcBalance((balance / 1e8).toFixed(8));
      } catch (e: any) {
        setEthBalance('Error');
        setBtcBalance('Error');
      }
      setLoading(false);
    }
    fetchBalances();
  }, [mnemonic]);

  async function handleSend() {
    setSendState('sending');
    setSendError('');
    try {
      // Only BTC send (not implemented)
      setSendError('BTC send not implemented in demo.');
      setSendState('error');
      return;
    } catch (e: any) {
      setSendError(e.message || 'Error sending transaction');
      setSendState('error');
    }
  }

  return (
    <Box>
      <Paper elevation={4} sx={{ p: 4, bgcolor: 'background.paper', mb: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Wallet Dashboard</Typography>
          <Button color="secondary" onClick={onLogout}>Logout</Button>
        </Grid>
        <Box mt={3}>
          <Typography variant="subtitle1">Bitcoin Address:</Typography>
          <Paper sx={{ p: 1, bgcolor: '#222', color: '#fff', fontFamily: 'monospace', wordBreak: 'break-word' }}>{btcAddress}</Paper>
        </Box>
        <Box mt={3}>
          <Typography variant="h6">Balances</Typography>
          {loading ? <CircularProgress /> : (
            <>
              <Typography>BTC: {btcBalance} </Typography>
            </>
          )}
        </Box>
        <Box mt={3}>
          <Typography variant="h6">Bitcoin Price</Typography>
          {priceLoading ? <CircularProgress size={20} /> : (
            <Typography fontSize={22} fontWeight={700} color="primary.main">
              {btcPrice ? `BTC/USD: ${btcPrice}` : '—'}
            </Typography>
          )}
        </Box>
        <Box mt={3}>
          <Typography variant="h6">Bitcoin Price (7d)</Typography>
          {priceHistory.length > 0 ? (
            <Line
              data={{
                labels: priceHistory.map(p => p.time),
                datasets: [
                  {
                    label: 'BTC/USD',
                    data: priceHistory.map(p => p.price),
                    borderColor: '#f7931a',
                    backgroundColor: 'rgba(247,147,26,0.1)',
                    tension: 0.2,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: { display: false },
                },
                scales: {
                  x: { display: true, title: { display: false } },
                  y: { display: true, title: { display: false } },
                },
              }}
              height={80}
            />
          ) : (
            <Typography color="text.secondary">No price data.</Typography>
          )}
        </Box>
      </Paper>
      <Paper elevation={4} sx={{ p: 4, bgcolor: 'background.paper' }}>
        <Typography variant="h5" mb={2} fontWeight={700} align="center">Send Bitcoin</Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: { sm: 'flex-end' },
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <TextField
            label="Recipient Address"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            fullWidth
            sx={{ minWidth: 220 }}
          />
          <TextField
            label="Amount (BTC)"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            type="number"
            inputProps={{ min: 0, step: 'any' }}
            sx={{ maxWidth: 180 }}
          />
          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{ minWidth: 120, fontWeight: 600, py: 1.5 }}
            disabled={sendState === 'sending'}
            onClick={handleSend}
          >
            {sendState === 'sending' ? <CircularProgress size={24} /> : 'Send'}
          </Button>
        </Box>
        {sendState === 'sent' && (
          <Typography color="success.main" align="center" mt={2} fontWeight={600}>
            Transaction sent!
          </Typography>
        )}
        {sendState === 'error' && (
          <Typography color="error.main" align="center" mt={2} fontWeight={600}>
            {sendError}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
