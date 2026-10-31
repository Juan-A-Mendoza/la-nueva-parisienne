// Test TOTP JS implementation
function base32Decode(base32) {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    let val = base32chars.indexOf(clean.charAt(i));
    bits += val.toString(2).padStart(5, '0');
  }
  let bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  return new Uint8Array(bytes);
}

// Simple pure JS SHA1 + HMAC
function sha1(bytes) {
  function rotl(n, s) { return (n << s) | (n >>> (32 - s)); }
  let H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
  let msgLen = bytes.length;
  let words = [];
  for (let i = 0; i < msgLen; i++) {
    words[i >> 2] |= (bytes[i] & 0xFF) << (24 - (i % 4) * 8);
  }
  words[msgLen >> 2] |= 0x80 << (24 - (msgLen % 4) * 8);
  words[(((msgLen + 8) >> 6) << 4) + 15] = msgLen * 8;

  let W = new Array(80);
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
      let temp = (rotl(a, 5) + f + e + k + (W[t] | 0)) | 0;
      e = d; d = c; c = rotl(b, 30); b = a; a = temp;
    }
    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
  }
  let res = new Uint8Array(20);
  for (let i = 0; i < 5; i++) {
    res[i * 4] = (H[i] >>> 24) & 0xFF;
    res[i * 4 + 1] = (H[i] >>> 16) & 0xFF;
    res[i * 4 + 2] = (H[i] >>> 8) & 0xFF;
    res[i * 4 + 3] = H[i] & 0xFF;
  }
  return res;
}

function hmacSha1(key, message) {
  let blockSize = 64;
  if (key.length > blockSize) key = sha1(key);
  let kPadO = new Uint8Array(blockSize);
  let kPadI = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    let k = i < key.length ? key[i] : 0;
    kPadO[i] = k ^ 0x5C;
    kPadI[i] = k ^ 0x36;
  }
  let innerMsg = new Uint8Array(blockSize + message.length);
  innerMsg.set(kPadI);
  innerMsg.set(message, blockSize);
  let innerHash = sha1(innerMsg);

  let outerMsg = new Uint8Array(blockSize + 20);
  outerMsg.set(kPadO);
  outerMsg.set(innerHash, blockSize);
  return sha1(outerMsg);
}

function calculateTOTP(secret, timeSlice = null) {
  if (timeSlice === null) {
    timeSlice = Math.floor(Date.now() / 30000);
  }
  let key = base32Decode(secret);
  let timeBytes = new Uint8Array(8);
  let temp = timeSlice;
  for (let i = 7; i >= 0; i--) {
    timeBytes[i] = temp & 0xFF;
    temp = Math.floor(temp / 256);
  }
  let hmac = hmacSha1(key, timeBytes);
  let offset = hmac[19] & 0x0F;
  let codeNum = ((hmac[offset] & 0x7F) << 24) |
                ((hmac[offset + 1] & 0xFF) << 16) |
                ((hmac[offset + 2] & 0xFF) << 8) |
                (hmac[offset + 3] & 0xFF);
  let otp = (codeNum % 1000000).toString().padStart(6, '0');
  return otp;
}

let secret = 'PARISIENNESUPER2';
let jsCode = calculateTOTP(secret);
console.log('JS Code:', jsCode);
