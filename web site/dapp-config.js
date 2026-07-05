// ── Legacy Protocol dApp configuration ──────────────────────────────────────
// Fill in real values as they become available. Nothing here is a secret
// until you paste a real key in — this file currently ships with placeholders
// only, so it is safe to commit as-is.
//
// SECURITY NOTE: Pinata JWTs used here should be *scoped* tokens (Pinata lets
// you mint a JWT restricted to pinning only, with no admin/unpin rights) —
// that is the one credential in this file actually meant to sit in
// client-side code. Filebase access/secret keys are NOT meant to be exposed
// to a public browser — anyone who views page source can extract them and
// use your storage quota. For a real deployment, route the Filebase (and
// ideally Arweave/Irys) upload through a small backend proxy — e.g. a
// Cloudflare Worker function with the keys stored as Worker secrets — so the
// browser only ever talks to your own domain, never holds the real key.
// Until that proxy exists, treat FILEBASE_* here as local-development-only
// and do not deploy this file to a public host with real Filebase keys filled in.

window.LGY_CONFIG = {
  // ── Network ──────────────────────────────────────────────────────────────
  // "local"  -> Anvil (chainId 31337, http://127.0.0.1:8545) — for testing
  // "sepolia"-> Base Sepolia testnet (chainId 84532)
  network: "local",

  contracts: {
    local:   { address: "0x5FbDB2315678afecb367f032d93F642f64180aa3", chainIdHex: "0x7a69" },
    sepolia: { address: "0x0000000000000000000000000000000000000000", chainIdHex: "0x14a34" },
  },

  // ── Storage providers ────────────────────────────────────────────────────
  // "mock" needs no account and works immediately — content is kept as a
  // data: URI (small demo files only) purely for exercising the on-chain
  // create/claim/delete flow without any real storage backend.
  //
  // Pinata:   https://app.pinata.cloud/developers/api-keys
  //           -> create a key scoped to "pinFileToIPFS" only, paste the JWT below.
  // Filebase: https://console.filebase.com/ -> Access Keys -> create an IPFS
  //           bucket, then an access key/secret pair scoped to that bucket.
  // Arweave:  via Irys (https://irys.xyz) so you can pay in ETH instead of
  //           needing native AR tokens — no separate signup, it uses your
  //           connected wallet directly.
  storage: {
    pinata: {
      jwt: "", // paste your scoped Pinata JWT here
    },
    filebase: {
      accessKeyId: "",     // Filebase access key
      secretAccessKey: "", // Filebase secret key — see SECURITY NOTE above
      bucket: "",          // your Filebase IPFS bucket name
      endpoint: "https://s3.filebase.com",
    },
    arweave: {
      // Irys network to use — "https://node1.irys.xyz" is Irys mainnet, which
      // still settles permanently on Arweave. No extra config needed beyond
      // the connected wallet, which pays for storage in ETH.
      irysNode: "https://node1.irys.xyz",
    },
  },
};
