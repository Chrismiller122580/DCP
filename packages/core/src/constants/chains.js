"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POPULAR_COINS = exports.CHAIN_CONFIG = exports.SUPPORTED_CHAINS = void 0;
exports.SUPPORTED_CHAINS = ['xrpl', 'bitcoin', 'ethereum', 'solana', 'base', 'dogecoin'];
exports.CHAIN_CONFIG = {
    xrpl: {
        name: 'XRP Ledger',
        nativeCurrency: 'XRP',
        decimals: 6,
        testnet: {
            url: 'wss://s.altnet.rippletest.net:51233',
            explorer: 'https://testnet.xrpl.org',
        },
        mainnet: {
            url: 'wss://xrplcluster.com',
            explorer: 'https://xrpscan.com',
        },
    },
    bitcoin: {
        name: 'Bitcoin',
        nativeCurrency: 'BTC',
        decimals: 8,
        testnet: {
            url: 'wss://testnet-seed.bitcoin.jonasschnelli.ch:18333',
            explorer: 'https://blockstream.info/testnet',
        },
    },
    ethereum: {
        name: 'Ethereum',
        nativeCurrency: 'ETH',
        decimals: 18,
        testnet: {
            url: 'wss://sepolia.infura.io/ws/v3/YOUR_KEY', // placeholder
            explorer: 'https://sepolia.etherscan.io',
        },
    },
    solana: {
        name: 'Solana',
        nativeCurrency: 'SOL',
        decimals: 9,
        testnet: {
            url: 'wss://api.testnet.solana.com',
            explorer: 'https://explorer.solana.com/?cluster=testnet',
        },
    },
    base: {
        name: 'Base',
        nativeCurrency: 'ETH',
        decimals: 18,
        testnet: {
            url: 'wss://sepolia.base.org',
            explorer: 'https://sepolia.basescan.org',
        },
    },
    dogecoin: {
        name: 'Dogecoin',
        nativeCurrency: 'DOGE',
        decimals: 8,
        testnet: {
            explorer: 'https://sochain.com/testnet/doge',
        },
    },
};
exports.POPULAR_COINS = [
    { chain: 'xrpl', symbol: 'XRP', label: 'XRP (XRPL)' },
    { chain: 'bitcoin', symbol: 'BTC', label: 'Bitcoin (BTC)' },
    { chain: 'ethereum', symbol: 'ETH', label: 'Ethereum (ETH)' },
    { chain: 'solana', symbol: 'SOL', label: 'Solana (SOL)' },
    { chain: 'base', symbol: 'USDC', label: 'USDC (Base)' },
    { chain: 'dogecoin', symbol: 'DOGE', label: 'Dogecoin (DOGE)' },
];
