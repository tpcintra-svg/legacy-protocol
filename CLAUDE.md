# Legacy Protocol — Project Context for Claude

## Who I am
Tomas Petrauskas — Co-Founder & CEO of Legacy Protocol. Contact: tpcintra@gmail.com / ceo@legacyprotocol.io

## What Legacy Protocol is
A non-custodial dead man's switch on BASE (Coinbase L2). Users lock encrypted material (wills, crypto keys, evidence) in a smart contract vault that releases to named recipients after a set time — or earlier via a signed emergency claim — with no custodian.

**Live website:** https://legacyprotocol.io — fully migrated and live
**GitHub:** https://github.com/tpcintra-svg/legacy-protocol  
**Deployed on:** Cloudflare Workers (static assets) — migrated from Netlify on 2026-07-01 after Netlify ran out of build credits.
- Worker name: `legacy-protocol`, account subdomain: `legacyprotocol.workers.dev`
- Live temporary URL: https://legacy-protocol.legacyprotocol.workers.dev
- Deploy method: manual "Upload assets" (Direct Upload) via Cloudflare dashboard. **No GitHub auto-deploy is connected** — `git push` to `master` does NOT redeploy the live site. After any web site change is pushed to GitHub, someone must manually go to Workers & Pages → `legacy-protocol` → Deployments → "Create deployment"/"Upload assets" and re-upload the `web site/` files, or the live site will keep serving stale content. (Setting up the GitHub↔Cloudflare Build integration — Worker Settings → Build → Connect — would remove this step; not done yet, requires interactive GitHub OAuth authorization from Tomas.)
- Custom domain `legacyprotocol.io` is attached and DNS has fully propagated (nameservers on Namecheap point to Cloudflare: `aida.ns.cloudflare.com` / `lewis.ns.cloudflare.com`).
- `index.html` in `web site/` is kept in sync with `legacy-protocol-website.html` (identical content) so it works as the default file on any static host. Old pre-migration version backed up as `web site/index.OLD-backup.html`.
- **Known environment quirk:** the Cloudflare dashboard frequently hangs indefinitely (infinite loading spinner) when driven by browser automation, even in a fresh tab — this is a recurring issue, not a one-off. Manual "Upload assets" deploys have had to be done by Tomas directly in his own browser session every time so far.
- **Localized static pages:** full translated copies of the landing page exist at `web site/es/index.html`, `web site/fr/index.html`, `web site/ru/index.html`, `web site/zh/index.html`, `web site/ar/index.html` (Arabic uses `dir="rtl"`/`lang="ar"`). Nav includes a language-switcher dropdown (`#lang-switch-trigger` / `#lang-switch-menu`, styled black background / white text) linking between all 6 versions. The old Google Translate widget dropdown was removed from the nav (kept only initially as a plain external-link "Translate" button, now fully replaced by the static-page switcher).

---

## Smart Contracts

### Main contract: `Code/LegacyProtocol_fixed_10.sol`
- Network: BASE (Coinbase L2)
- Key parameters: `CORE_KEY_COUNT=6`, `REQUIRED_APPROVALS=3`, 14-day timelock
- Fee split: 80% nodes, 8% marketing, 7% dev, 5% burn
- Fees currently in ETH (LGY token not yet launched)

**Key features (all live in contract):**
- Multi-recipient vaults (up to 50 recipients)
- EIP-191 signature-verified claims (anti-frontrunning)
- 3-of-6 multisig governance + 14-day timelock
- Creator veto window (72h–30d, configurable per vault)
- `vetoWaived` flag — creator can permanently waive veto at vault creation
- `deleteVaultContent()` — recipient can permanently delete content after claiming
- `notifyVaultClaimable()` — on-chain event for indexers/keepers
- `365-day recovery window` after first claim
- **Service Provider Registry** — governance can add/remove storage providers; vault creators choose which provider to use (9th param to `createLegacyVault`)

**Governance proposal types:** `StorageRouter`, `CostPerSecond`, `CoreKeyReplacement`, `AddServiceProvider`, `RemoveServiceProvider`

**`createLegacyVault` signature (9 params):**
```solidity
createLegacyVault(
    uint256 _durationInSeconds,
    uint256 _customVetoWindowInSeconds,
    bytes32[] _recipientHashes,
    address[] _recipientAddresses,
    string _encryptedLabel,
    string _encryptedDataURI,
    bool _useAirdropCredits,
    bool _waiveVeto,
    uint256 _serviceProviderId  // 0 = default storageRouter
)
```

### BTC Airdrop contract: `Code/LGY_BTC_Airdrop.sol`
5-phase lifecycle:
1. `setSnapshot(btcBlock)` — owner locks BTC snapshot block
2. `openRegistration()` — owner opens 90-day window when ready
3. `registerRecipient(btcAddress, ethAddress)` — owner registers after off-chain proof
4. `setAllocations()` + `finalizeAndOpenClaim()` — owner sets amounts, opens claim
5. `claim()` — user claims Soulbound LGY (usable only in protocol, burns after 90d)

**Soulbound rules:** Not transferable, only spendable via `spendSoulbound()` called by protocol contract. Auto-burns after 90 days. `sweepExpired()` and `sweepUnclaimed()` for cleanup.

---

## Foundry Tests
Location: `foundry-tests/`  
Run with: `forge test` from `foundry-tests/` directory  
**Status: 38/38 tests passing** (9 main contract + 27 BTC airdrop + 2 counter)

Key test helpers:
- Cost must be computed BEFORE `vm.startPrank` (or prank gets consumed by getter)
- First vault ID is `1` (not 0) — `nextVaultId` starts at 1
- `createLegacyVault` test call: pass `false, false, 0` for last 3 params

---

## Website
**Files in `web site/`:**
- `legacy-protocol-website.html` — main landing page, English (dark theme, Fraunces + IBM Plex fonts)
- `index.html` — full copy of the landing page (kept in sync with `legacy-protocol-website.html`), serves as the default file for the Cloudflare Worker
- `es/index.html`, `fr/index.html`, `ru/index.html`, `zh/index.html`, `ar/index.html` — full translated static copies (Arabic is RTL)
- `app.html` — password-gated investor/admin dashboard (password: "123")
- `LGY_Whitepaper_Rev2026_3.pdf` — current white paper (content covers protocol/contract/tokenomics only — not affected by website/hosting work). Rev2026_2 kept alongside for history.
  - Rev2026.3 changelog vs 2026.2: fixed governance threshold references (was incorrectly stated as 3-of-5, live contract is 3-of-6); added Service Provider Registry (§3.2, code exists but not yet covered by tests — flagged as such); added optional permanent veto waiver (§3.4); added new §3.6 Post-Claim Content Deletion (`deleteVaultContent()`); added new §4.7 BTC Holder Airdrop mechanics; Security Posture (§6) now discloses `debugClaimMessage()` pending removal and explicitly notes claim/governance/service-provider code paths aren't yet covered by the Foundry test suite (only vault creation/extension/veto/unstake/notify are).
- `netlify.toml` — leftover from the old Netlify setup; no longer used (Cloudflare Workers doesn't read it), kept for reference only
- `index.OLD-backup.html` — pre-migration backup, not otherwise used

**Deploying a website change (current process — see Hosting note above):**
1. Commit and push to `master` on GitHub (this alone does NOT go live).
2. Manually redeploy via Cloudflare dashboard: Workers & Pages → `legacy-protocol` → Deployments → "Create deployment"/"Upload assets" → upload the `web site/` files (all 6 language `index.html` files + `legacy-protocol-website.html` + `app.html` + the PDF). Best done by Tomas directly in his own browser — dashboard automation tends to hang.

**Nav has:** a language-switcher dropdown linking EN/ES/FR/RU/ZH/AR static pages, plus "Get in touch". The old Google Translate widget/dropdown has been removed entirely.

---

## Token Economics (planned, not yet deployed)
- 1B LGY fixed supply
- Allocation: 40% Web3 Core Dev & Validators, 20% Airdrop & Marketing, 15% R&D, 10% Seed, 10% BTC Holder Airdrop, 5% Pre-Seed
- Pre-Seed: $250k, 5% supply, $0.005/token, 12mo cliff + 24mo vesting
- Seed: $1.5M, 10% supply, $0.015/token, post-MVP
- Invariant Honey Pot: 1M LGY locked forever as live bug bounty
- BTC Holder Airdrop: 100M LGY, 90-day claim window, unclaimed burned

---

## Roadmap Status
- ✅ Phase 0: Contract hardening (internal review done, 3rd party audit pending)
- ✅ Phase 1: Core vault product (live in contract)
- ⏳ Phase 2: LGY token & vesting
- ⏳ Phase 3: Decentralized storage (Shamir's Secret Sharing)
- ⏳ Phase 4: Claims adjudication
- ⏳ Phase 5: True zero-knowledge discovery

---

## Legal & Structure
- Swiss foundation planned (15% of pre-seed funds)
- SAFT structure for investors
- NDA template: `Legacy_Protocol_NDA_Template.docx`

---

## Key Files
```
Code/
  LegacyProtocol_fixed_10.sol   ← main contract
  LGY_BTC_Airdrop.sol           ← BTC airdrop contract
foundry-tests/
  src/LegacyProtocol.sol        ← copy of main contract for tests
  src/LGY_BTC_Airdrop.sol       ← copy of airdrop contract for tests
  test/LegacyProtocol.t.sol     ← 9 main contract tests
  test/LGY_BTC_Airdrop.t.sol    ← 27 airdrop tests
web site/
  legacy-protocol-website.html  ← landing page (English)
  index.html                    ← synced copy of landing page, default Worker file
  es/ fr/ ru/ zh/ ar/index.html ← translated static pages (ar = RTL)
  app.html                      ← dashboard (password: 123)
  netlify.toml                  ← unused leftover from Netlify era
```

---

## Things NOT yet done (pending)
- Remove `debugClaimMessage()` before mainnet deployment
- Base Sepolia testnet deployment (need test ETH)
- 3rd party security audit (CertiK / Hacken)
- LGY ERC-20 token contract
- Validator bootstrap strategy (how validators participate before real LGY exists)
- Test coverage gap: claim/delete signature flows, governance proposal lifecycle, and the Service Provider Registry are implemented but not yet covered by Foundry tests (only 9 vault-lifecycle tests + 27 airdrop tests + 2 counter exist)
