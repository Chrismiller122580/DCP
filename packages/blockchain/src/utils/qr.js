"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildQRCodeData = buildQRCodeData;
function buildQRCodeData(address, amount, tag, chain = 'xrpl') {
    // Simple text payload for QR. Real implementation uses qrcode lib in api/mobile.
    // For XRPL typical: "xrpl:ADDRESS?amount=XX&dt=YYYY" or use XUMM style.
    if (chain === 'xrpl') {
        let uri = `xrpl:${address}`;
        const params = [];
        if (amount)
            params.push(`amount=${encodeURIComponent(amount)}`);
        if (tag)
            params.push(`dt=${tag}`);
        if (params.length)
            uri += `?${params.join('&')}`;
        return uri;
    }
    return address;
}
