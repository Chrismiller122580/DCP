"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.generateApiKey = generateApiKey;
exports.generateWebhookSecret = generateWebhookSecret;
const crypto_1 = require("crypto");
function generateId(prefix = 'inv') {
    const rand = (0, crypto_1.randomBytes)(12).toString('hex');
    return `${prefix}_${Date.now().toString(36)}_${rand}`;
}
function generateApiKey() {
    return 'dcp_' + (0, crypto_1.randomBytes)(32).toString('hex');
}
function generateWebhookSecret() {
    return (0, crypto_1.randomBytes)(32).toString('hex');
}
//# sourceMappingURL=id.js.map