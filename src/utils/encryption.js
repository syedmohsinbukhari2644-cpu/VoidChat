import CryptoJS from 'crypto-js';

// Secret key for demo purposes (In production, this should be derived via Diffie-Hellman/X25519)
const MASTER_KEY = 'VOID_CHAT_SECURE_256_KEY_2026';

export const encryptMessage = (text) => {
  if (!text) return text;
  try {
    // Encrypt using AES-256
    const cipher = CryptoJS.AES.encrypt(text, MASTER_KEY).toString();
    // Add prefix to identify E2EE messages
    return `E2EE::${cipher}`;
  } catch (error) {
    console.error('Encryption failed', error);
    return text;
  }
};

export const decryptMessage = (cipherText) => {
  if (!cipherText || !cipherText.startsWith('E2EE::')) {
    return cipherText;
  }
  
  try {
    const actualCipher = cipherText.replace('E2EE::', '');
    const bytes = CryptoJS.AES.decrypt(actualCipher, MASTER_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || '🔒 [Message Corrupted]';
  } catch (error) {
    console.error('Decryption failed', error);
    return '🔒 [Decryption Failed]';
  }
};

export const isEncrypted = (text) => {
  return typeof text === 'string' && text.startsWith('E2EE::');
};
