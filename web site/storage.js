// ── Legacy Protocol — client-side encryption + storage provider abstraction ──
// Every provider function here takes an ALREADY-ENCRYPTED Uint8Array and
// returns a URI string to store on-chain as the vault's encryptedDataURI.
// The contract never sees plaintext and never sees the decryption key —
// encryption happens entirely in the browser, before any network call.

// ── Encryption (AES-256-GCM via the browser's native Web Crypto API) ───────
// No external crypto library needed or wanted here: Web Crypto is
// constant-time, audited by browser vendors, and available in every modern
// browser without a CDN dependency.
async function lgyEncrypt(plaintextBytes) {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintextBytes);
  const rawKey = await crypto.subtle.exportKey("raw", key);

  // Prefix the IV onto the ciphertext so decryption only needs the key.
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return {
    encryptedBytes: combined,
    keyBase64: bytesToBase64(new Uint8Array(rawKey)),
  };
}

async function lgyDecrypt(encryptedBytes, keyBase64) {
  const rawKey = base64ToBytes(keyBase64);
  const key = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
  const iv = encryptedBytes.slice(0, 12);
  const ciphertext = encryptedBytes.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new Uint8Array(plaintext);
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── Provider: Mock / Local ───────────────────────────────────────────────
// No account, no network call. Stores the encrypted blob as a data: URI.
// Only suitable for small demo content — this is for exercising the
// on-chain create/claim/delete flow locally, not a real storage backend.
async function uploadToMock(encryptedBytes) {
  const b64 = bytesToBase64(encryptedBytes);
  return "data:application/octet-stream;base64," + b64;
}

// ── Provider: Pinata (IPFS) ──────────────────────────────────────────────
// Docs: https://docs.pinata.cloud/api-reference/endpoint/pin-file-to-ipfs
async function uploadToPinata(encryptedBytes, cfg) {
  if (!cfg.jwt) throw new Error("Pinata JWT not set — add it to dapp-config.js (storage.pinata.jwt).");

  const form = new FormData();
  form.append("file", new Blob([encryptedBytes]), "vault.enc");

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: "Bearer " + cfg.jwt },
    body: form,
  });
  if (!res.ok) throw new Error("Pinata upload failed: " + res.status + " " + (await res.text()));
  const data = await res.json();
  return "ipfs://" + data.IpfsHash;
}

// ── Provider: Filebase (IPFS, S3-compatible API) ────────────────────────
// Docs: https://docs.filebase.com/api-documentation/s3-compatible-api
// Uses aws4fetch (loaded via CDN in app.html) to sign requests with AWS
// SigV4 entirely client-side — no AWS SDK / Node dependency needed.
async function uploadToFilebase(encryptedBytes, cfg) {
  if (!cfg.accessKeyId || !cfg.secretAccessKey || !cfg.bucket) {
    throw new Error("Filebase credentials not set — add them to dapp-config.js (storage.filebase).");
  }
  if (typeof AwsClient === "undefined") {
    throw new Error("aws4fetch not loaded — check the <script> include in app.html.");
  }

  const client = new AwsClient({
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    service: "s3",
    region: "us-east-1", // Filebase ignores region but the SigV4 signer requires one
  });

  const objectKey = "vault-" + Date.now() + "-" + Math.random().toString(36).slice(2) + ".enc";
  const url = cfg.endpoint + "/" + cfg.bucket + "/" + objectKey;

  const res = await client.fetch(url, {
    method: "PUT",
    body: encryptedBytes,
    headers: { "Content-Type": "application/octet-stream" },
  });
  if (!res.ok) throw new Error("Filebase upload failed: " + res.status + " " + (await res.text()));

  // Filebase returns the IPFS CID in this response header once pinning completes.
  const cid = res.headers.get("x-amz-meta-cid") || res.headers.get("cid");
  if (!cid) throw new Error("Filebase upload succeeded but no CID header was returned — check bucket IPFS settings.");
  return "ipfs://" + cid;
}

// ── Provider: Arweave (permanent storage), paid in ETH via Irys ────────
// Docs: https://docs.irys.xyz/build/d/sdk/getting-started
// Irys lets you pay for permanent Arweave storage using your existing
// wallet's ETH balance instead of needing native AR tokens.
async function uploadToArweave(encryptedBytes, cfg, ethersSigner) {
  if (typeof WebIrys === "undefined") {
    throw new Error("Irys SDK not loaded — check the <script> include in app.html.");
  }
  const irys = new WebIrys({
    network: "mainnet",
    token: "ethereum",
    wallet: { rpcUrl: cfg.irysNode, name: "ethereum", provider: ethersSigner.provider },
  });
  await irys.ready();

  const price = await irys.getPrice(encryptedBytes.length);
  const balance = await irys.getLoadedBalance();
  if (balance.isLessThan(price)) {
    await irys.fund(price.multipliedBy(1.1)); // small buffer over the quoted price
  }

  const receipt = await irys.upload(Buffer.from(encryptedBytes));
  return "ar://" + receipt.id;
}

// ── Unified entry point used by app.html ────────────────────────────────
// providerKey: "mock" | "pinata" | "filebase" | "arweave"
async function lgyUploadEncrypted(plaintextBytes, providerKey, ethersSigner) {
  const { encryptedBytes, keyBase64 } = await lgyEncrypt(plaintextBytes);
  const cfg = window.LGY_CONFIG.storage;

  let uri;
  if (providerKey === "mock") uri = await uploadToMock(encryptedBytes);
  else if (providerKey === "pinata") uri = await uploadToPinata(encryptedBytes, cfg.pinata);
  else if (providerKey === "filebase") uri = await uploadToFilebase(encryptedBytes, cfg.filebase);
  else if (providerKey === "arweave") uri = await uploadToArweave(encryptedBytes, cfg.arweave, ethersSigner);
  else throw new Error("Unknown storage provider: " + providerKey);

  return { uri, keyBase64 };
}
