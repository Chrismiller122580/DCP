"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSmallestUnit = toSmallestUnit;
exports.fromSmallestUnit = fromSmallestUnit;
function toSmallestUnit(amount, decimals) {
    const [whole, frac = ''] = amount.split('.');
    const padded = (frac + '0'.repeat(decimals)).slice(0, decimals);
    return (BigInt(whole || '0') * BigInt(10 ** decimals) + BigInt(padded || '0')).toString();
}
function fromSmallestUnit(amount, decimals) {
    const bn = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const whole = bn / divisor;
    const frac = (bn % divisor).toString().padStart(decimals, '0').replace(/0+$/, '');
    return frac ? `${whole}.${frac}` : whole.toString();
}
