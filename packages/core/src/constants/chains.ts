export const SUPPORTED_CHAINS = ['xrpl', 'bitcoin', 'ethereum', 'solana', 'base', 'dogecoin'] as const;

export const CHAIN_CONFIG = {
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
} as const;

export type PopularCoin = {
  chain: keyof typeof CHAIN_CONFIG;
  symbol: string;
  label: string;
};

export const POPULAR_COINS: PopularCoin[] = [
  { chain: 'xrpl', symbol: 'XRP', label: 'XRP (XRPL)' },
  { chain: 'bitcoin', symbol: 'BTC', label: 'Bitcoin (BTC)' },
  { chain: 'ethereum', symbol: 'ETH', label: 'Ethereum (ETH)' },
  { chain: 'solana', symbol: 'SOL', label: 'Solana (SOL)' },
  { chain: 'base', symbol: 'USDC', label: 'USDC (Base)' },
  { chain: 'dogecoin', symbol: 'DOGE', label: 'Dogecoin (DOGE)' },
];
