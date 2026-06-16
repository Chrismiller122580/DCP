export declare const SUPPORTED_CHAINS: readonly ["xrpl", "solana", "base"];
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
    readonly solana: {
        readonly name: "Solana";
        readonly nativeCurrency: "SOL";
        readonly decimals: 9;
    };
    readonly base: {
        readonly name: "Base";
        readonly nativeCurrency: "ETH";
        readonly decimals: 18;
    };
};
//# sourceMappingURL=chains.d.ts.map