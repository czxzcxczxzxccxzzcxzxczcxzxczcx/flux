#!/usr/bin/env node

const inquirer = require('inquirer');
const bip39 = require('bip39');
const { ethers } = require('ethers');
const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');

async function main() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to do?',
      choices: [
        'Generate new wallet',
        'Show balance',
        'Send transaction',
        'Exit',
      ],
    },
  ]);

  if (action === 'Generate new wallet') {
    const { chain } = await inquirer.prompt([
      {
        type: 'list',
        name: 'chain',
        message: 'Which blockchain?',
        choices: ['Ethereum', 'Bitcoin'],
      },
    ]);
    const mnemonic = bip39.generateMnemonic();
    console.log(`\nMnemonic: ${mnemonic}`);
    if (chain === 'Ethereum') {
      const wallet = ethers.Wallet.fromMnemonic(mnemonic);
      console.log(`Ethereum Address: ${wallet.address}`);
      console.log(`Private Key: ${wallet.privateKey}`);
    } else {
      const seed = await bip39.mnemonicToSeed(mnemonic);
      const root = bitcoin.bip32.fromSeed(seed);
      const child = root.derivePath('m/44'/0'/0'/0/0');
      const { address } = bitcoin.payments.p2pkh({ pubkey: child.publicKey });
      console.log(`Bitcoin Address: ${address}`);
      console.log(`Private Key (WIF): ${child.toWIF()}`);
    }
  } else if (action === 'Show balance') {
    const { chain } = await inquirer.prompt([
      {
        type: 'list',
        name: 'chain',
        message: 'Which blockchain?',
        choices: ['Ethereum', 'Bitcoin'],
      },
    ]);
    const { address } = await inquirer.prompt([
      {
        type: 'input',
        name: 'address',
        message: 'Enter address:',
      },
    ]);
    if (chain === 'Ethereum') {
      const provider = ethers.getDefaultProvider();
      const balance = await provider.getBalance(address);
      console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);
    } else {
      // Use Blockstream API for Bitcoin balance
      try {
        const resp = await axios.get(`https://blockstream.info/api/address/${address}`);
        const balance = resp.data.chain_stats.funded_txo_sum - resp.data.chain_stats.spent_txo_sum;
        console.log(`Balance: ${balance / 1e8} BTC`);
      } catch (e) {
        console.log('Error fetching Bitcoin balance:', e.message);
      }
    }
  } else if (action === 'Send transaction') {
    const { chain } = await inquirer.prompt([
      {
        type: 'list',
        name: 'chain',
        message: 'Which blockchain?',
        choices: ['Ethereum', 'Bitcoin'],
      },
    ]);
    if (chain === 'Ethereum') {
      const { privateKey, to, amount } = await inquirer.prompt([
        { type: 'input', name: 'privateKey', message: 'Enter your private key:' },
        { type: 'input', name: 'to', message: 'Recipient address:' },
        { type: 'input', name: 'amount', message: 'Amount (ETH):' },
      ]);
      const provider = ethers.getDefaultProvider();
      const wallet = new ethers.Wallet(privateKey, provider);
      const tx = await wallet.sendTransaction({
        to,
        value: ethers.utils.parseEther(amount),
      });
      console.log('Transaction sent! Hash:', tx.hash);
    } else {
      console.log('Bitcoin send not implemented in this demo.');
    }
  } else {
    process.exit(0);
  }
}

main();
