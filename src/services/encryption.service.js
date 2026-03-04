const crypto = require('crypto');
const config = require('../config');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * @param {string} plaintext
 * @returns {{ encrypted: string, iv: string, tag: string }}
 */
function encrypt(plaintext) {
    if (!plaintext) return { encrypted: '', iv: '', tag: '' };

    const key = Buffer.from(config.encryption.key, 'hex');
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    return {
        encrypted,
        iv: iv.toString('hex'),
        tag,
    };
}

/**
 * Decrypt an encrypted string using AES-256-GCM.
 * @param {string} encrypted
 * @param {string} ivHex
 * @param {string} tagHex
 * @returns {string}
 */
function decrypt(encrypted, ivHex, tagHex) {
    if (!encrypted) return '';

    const key = Buffer.from(config.encryption.key, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

module.exports = { encrypt, decrypt };
