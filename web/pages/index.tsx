import { useState } from 'react';
import { Box, Button, Container, Typography, TextField, Paper } from '@mui/material';
import bip39 from 'bip39';
import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('../components/Dashboard'), { ssr: false });

export default function Home() {
  const [mnemonic, setMnemonic] = useState('');
  const [inputMnemonic, setInputMnemonic] = useState('');
  const [error, setError] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  const handleGenerate = () => {
    const phrase = bip39.generateMnemonic();
    setMnemonic(phrase);
    setInputMnemonic(phrase);
    setError('');
  };

  const handleLogin = () => {
    if (bip39.validateMnemonic(inputMnemonic.trim())) {
      setMnemonic(inputMnemonic.trim());
      setLoggedIn(true);
      setError('');
    } else {
      setError('Invalid 12-word phrase.');
    }
  };

  const handleLogout = () => {
    setMnemonic('');
    setInputMnemonic('');
    setLoggedIn(false);
    setError('');
  };

  if (!loggedIn) {
    return (
      <Box minHeight="100vh" sx={{ bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="sm">
          <Paper elevation={6} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, bgcolor: 'background.paper', boxShadow: 6 }}>
            <Typography variant="h3" fontWeight={700} align="center" gutterBottom sx={{ letterSpacing: 1, mb: 2 }}>
              Flux Wallet
            </Typography>
            <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
              Login or create a new wallet using a 12-word phrase
            </Typography>
            <Box display="flex" flexDirection="column" gap={2} mt={3}>
              <TextField
                label="12-word phrase"
                multiline
                minRows={2}
                value={inputMnemonic}
                onChange={e => setInputMnemonic(e.target.value)}
                placeholder="Enter or paste your 12-word phrase"
                fullWidth
                error={!!error}
                helperText={error}
                sx={{ fontSize: 18, fontFamily: 'monospace', bgcolor: '#181818', borderRadius: 2 }}
              />
              <Button variant="contained" color="primary" size="large" sx={{ fontWeight: 600, py: 1.5 }} onClick={handleLogin}>
                Login
              </Button>
              <Button variant="outlined" color="secondary" size="large" sx={{ fontWeight: 600, py: 1.5 }} onClick={handleGenerate}>
                Generate New Wallet
              </Button>
              {mnemonic && (
                <Box mt={3}>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 1 }}>
                    Save this phrase securely. It is your only way to access your wallet.
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: '#181818', color: '#fff', fontFamily: 'monospace', wordBreak: 'break-word', borderRadius: 2, fontSize: 18, textAlign: 'center', letterSpacing: 1 }}>
                    {mnemonic}
                  </Paper>
                </Box>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  return <Dashboard mnemonic={mnemonic} onLogout={handleLogout} />;
}
