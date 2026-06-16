"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAIN_CONFIG = exports.SUPPORTED_CHAINS = void 0;
exports.SUPPORTED_CHAINS = ['xrpl', 'solana', 'base'];
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
    solana: {
        name: 'Solana',
        nativeCurrency: 'SOL',
        decimals: 9,
    },
    base: {
        name: 'Base',
        nativeCurrency: 'ETH',
        decimals: 18,
    },
};
//# sourceMappingURL=chains.js.map