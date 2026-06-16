export declare const SUPPORTED_CHAINS: readonly ["xrpl", "bitcoin", "ethereum", "solana", "base", "dogecoin"];
export declare const CHAIN_CONFIG: {
    readonly xrpl: {
        readonly name: "XRP Ledger";
        readonly nativeCurrency: "XRP";
        readonly decimals: 6;
        readonly testnet: {
            readonly url: "wss://s.altnet.rippletest.net:51233";
            readonly explorer: "https://testnet.xrpl.org";
        };
        readonly mainnet: {
            readonly url: "wss://xrplcluster.com";
            readonly explorer: "https://xrpscan.com";
        };
    };
    readonly bitcoin: {
        readonly name: "Bitcoin";
        readonly nativeCurrency: "BTC";
        readonly decimals: 8;
        readonly testnet: {
            readonly url: "wss://testnet-seed.bitcoin.jonasschnelli.ch:18333";
            readonly explorer: "https://blockstream.info/testnet";
        };
    };
    readonly ethereum: {
        readonly name: "Ethereum";
        readonly nativeCurrency: "ETH";
        readonly decimals: 18;
        readonly testnet: {
            readonly url: "wss://sepolia.infura.io/ws/v3/YOUR_KEY";
            readonly explorer: "https://sepolia.etherscan.io";
        };
    };
    readonly solana: {
        readonly name: "Solana";
        readonly nativeCurrency: "SOL";
        readonly decimals: 9;
        readonly testnet: {
            readonly url: "wss://api.testnet.solana.com";
            readonly explorer: "https://explorer.solana.com/?cluster=testnet";
        };
    };
    readonly base: {
        readonly name: "Base";
        readonly nativeCurrency: "ETH";
        readonly decimals: 18;
        readonly testnet: {
            readonly url: "wss://sepolia.base.org";
            readonly explorer: "https://sepolia.basescan.org";
        };
    };
    readonly dogecoin: {
        readonly name: "Dogecoin";
        readonly nativeCurrency: "DOGE";
        readonly decimals: 8;
        readonly testnet: {
            readonly explorer: "https://sochain.com/testnet/doge";
        };
    };
};
export type PopularCoin = {
    chain: keyof typeof CHAIN_CONFIG;
    symbol: string;
    label: string;
};
export declare const POPULAR_COINS: PopularCoin[];
