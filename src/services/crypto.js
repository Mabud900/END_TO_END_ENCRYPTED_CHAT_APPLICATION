import sodium from 'libsodium-wrappers';

let sodiumReady = false;

export const initCrypto = async () => {
  if (!sodiumReady) {
    await sodium.ready;
    sodiumReady = true;
  }
  return sodium;
};

export const generateKeyPair = async () => {
  const sodium = await initCrypto();
  const keyPair = sodium.crypto_box_keypair();
  return {
    publicKey: sodium.to_base64(keyPair.publicKey),
    privateKey: sodium.to_base64(keyPair.privateKey)
  };
};

export const getPublicKey = (keys) => keys?.publicKey || null;

export const encryptMessage = async (message, recipientPublicKey, senderPrivateKey) => {
  const sodium = await initCrypto();
  
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const messageBytes = sodium.from_string(message);
  const recipientPubKeyBytes = sodium.from_base64(recipientPublicKey);
  const senderPrivKeyBytes = sodium.from_base64(senderPrivateKey);
  
  const ciphertext = sodium.crypto_box_easy(
    messageBytes,
    nonce,
    recipientPubKeyBytes,
    senderPrivKeyBytes
  );
  
  return {
    ciphertext: sodium.to_base64(ciphertext),
    nonce: sodium.to_base64(nonce)
  };
};

export const decryptMessage = async (ciphertext, nonce, senderPublicKey, recipientPrivateKey) => {
  const sodium = await initCrypto();
  
  const ciphertextBytes = sodium.from_base64(ciphertext);
  const nonceBytes = sodium.from_base64(nonce);
  const senderPubKeyBytes = sodium.from_base64(senderPublicKey);
  const recipientPrivKeyBytes = sodium.from_base64(recipientPrivateKey);
  
  const decrypted = sodium.crypto_box_open_easy(
    ciphertextBytes,
    nonceBytes,
    senderPubKeyBytes,
    recipientPrivKeyBytes
  );
  
  return sodium.to_string(decrypted);
};
