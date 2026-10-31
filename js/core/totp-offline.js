/* ==========================================================================
   LA NUEVA PARISIENNE - MOTOR CRIPTOGRÁFICO TOTP OFFLINE (RFC 6238 / RFC 4226)
   Generador y validador de códigos 2FA para Google Authenticator, Authy y MS Auth.
   100% Offline, sin dependencias externas, compatible con HTTP, HTTPS y localhost.
   ========================================================================== */

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(b32) {
  const clean = String(b32 || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  if (!clean) return new Uint8Array(0);

  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean.charAt(i));
    if (val !== -1) {
      bits += val.toString(2).padStart(5, '0');
    }
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  return new Uint8Array(bytes);
}

function sha1(bytes) {
  function rotl(n, s) { return (n << s) | (n >>> (32 - s)); }
  const H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
  const msgLen = bytes.length;
  const words = [];
  for (let i = 0; i < msgLen; i++) {
    words[i >> 2] |= (bytes[i] & 0xFF) << (24 - (i % 4) * 8);
  }
  words[msgLen >> 2] |= 0x80 << (24 - (msgLen % 4) * 8);
  words[(((msgLen + 8) >> 6) << 4) + 15] = msgLen * 8;

  const W = new Array(80);
  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t++) W[t] = words[i + t] || 0;
    for (let t = 16; t < 80; t++) W[t] = rotl(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4];
    for (let t = 0; t < 80; t++) {
      let f, k;
      if (t < 20) { f = (b & c) | ((~b) & d); k = 0x5A827999; }
      else if (t < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
      else if (t < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
      else { f = b ^ c ^ d; k = 0xCA62C1D6; }
      const temp = (rotl(a, 5) + f + e + k + (W[t] | 0)) | 0;
      e = d; d = c; c = rotl(b, 30); b = a; a = temp;
    }
    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
  }
  const res = new Uint8Array(20);
  for (let i = 0; i < 5; i++) {
    res[i * 4] = (H[i] >>> 24) & 0xFF;
    res[i * 4 + 1] = (H[i] >>> 16) & 0xFF;
    res[i * 4 + 2] = (H[i] >>> 8) & 0xFF;
    res[i * 4 + 3] = H[i] & 0xFF;
  }
  return res;
}

function hmacSha1(key, message) {
  const blockSize = 64;
  let finalKey = key;
  if (finalKey.length > blockSize) finalKey = sha1(finalKey);

  const kPadO = new Uint8Array(blockSize);
  const kPadI = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    const k = i < finalKey.length ? finalKey[i] : 0;
    kPadO[i] = k ^ 0x5C;
    kPadI[i] = k ^ 0x36;
  }
  const innerMsg = new Uint8Array(blockSize + message.length);
  innerMsg.set(kPadI);
  innerMsg.set(message, blockSize);
  const innerHash = sha1(innerMsg);

  const outerMsg = new Uint8Array(blockSize + 20);
  outerMsg.set(kPadO);
  outerMsg.set(innerHash, blockSize);
  return sha1(outerMsg);
}

export const TOTPOffline = {
  /**
   * Genera un secreto Base32 aleatorio
   */
  generateSecret(length = 16) {
    let secret = '';
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * BASE32_CHARS.length);
      secret += BASE32_CHARS[idx];
    }
    return secret;
  },

  /**
   * Calcula el código TOTP de 6 dígitos actual o para un timeSlice dado
   */
  calculateCode(secret, timeSlice = null) {
    if (!secret) return null;
    if (timeSlice === null) {
      timeSlice = Math.floor(Date.now() / 30000);
    }
    const key = base32Decode(secret);
    if (key.length === 0) return null;

    const timeBytes = new Uint8Array(8);
    let temp = timeSlice;
    for (let i = 7; i >= 0; i--) {
      timeBytes[i] = temp & 0xFF;
      temp = Math.floor(temp / 256);
    }

    const hmac = hmacSha1(key, timeBytes);
    const offset = hmac[19] & 0x0F;
    const codeNum = ((hmac[offset] & 0x7F) << 24) |
                    ((hmac[offset + 1] & 0xFF) << 16) |
                    ((hmac[offset + 2] & 0xFF) << 8) |
                    (hmac[offset + 3] & 0xFF);
    return (codeNum % 1000000).toString().padStart(6, '0');
  },

  /**
   * Verifica un código ingresado admitiendo ventana de tolerancia de desfase (por defecto ±4 = ±120s)
   */
  verifyCode(secret, code, discrepancy = 4) {
    const cleanCode = String(code || '').trim().replace(/[^0-9]/g, '');
    if (!cleanCode || cleanCode.length !== 6) {
      return false;
    }
    const currentTimeSlice = Math.floor(Date.now() / 30000);
    for (let i = -discrepancy; i <= discrepancy; i++) {
      const expected = this.calculateCode(secret, currentTimeSlice + i);
      if (expected && expected === cleanCode) {
        return true;
      }
    }
    return false;
  },

  /**
   * Retorna los segundos restantes en el ciclo actual de 30 segundos
   */
  getRemainingSeconds() {
    return 30 - (Math.floor(Date.now() / 1000) % 30);
  },

  /**
   * Genera el URI estándar otpauth:// reconocido universalmente por Google Authenticator
   */
  getOtpAuthUrl(accountName, secret, issuer = 'Parisienne') {
    const cleanIssuer = String(issuer || 'Parisienne').replace(/[^A-Za-z0-9_-]/g, '') || 'Parisienne';
    const cleanAccount = String(accountName || 'Usuario').replace(/[^A-Za-z0-9_@.-]/g, '') || 'Usuario';
    return `otpauth://totp/${cleanIssuer}:${cleanAccount}?secret=${secret}&issuer=${cleanIssuer}&algorithm=SHA1&digits=6&period=30`;
  },

  /**
   * Formatea el secreto con espacios cada 4 caracteres para facilitar lectura humana
   * Ej: PARI SIEN NESU PER2
   */
  formatSecret(secret) {
    const clean = String(secret || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
    return clean.match(/.{1,4}/g)?.join(' ') || clean;
  }
};
