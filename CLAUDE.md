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
- `deleteVaultContent()` — a recipient can permanently delete their own access to a vault's content after claiming; scoped per-recipient via `recipientContentDeleted` mapping, so on a multi-recipient vault one recipient deleting does not affect any other recipient's access (fixed 2026-07-03: previously cleared the vault-wide `encryptedDataURI`/`encryptedLabel` fields, wiping access for every recipient)
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
**Status: 63/63 tests passing** (34 main contract + 27 BTC airdrop + 2 counter)

2026-07-03: expanded main-contract coverage from 9 → 34 tests. Now covers what was
previously the test-coverage gap: claim/delete signature flows (including a
regression test for the per-recipient content-deletion scoping fix — one recipient
deleting their access must not affect any other recipient of the same vault), the
full governance propose/approve/execute/cancel lifecycle, and the Service Provider
Registry (add/remove/select-at-vault-creation). Signing in tests uses `vm.addr`/
`vm.sign` on private keys (`recipientPk`, `recipient2Pk`, `strangerPk`, `coreKeyPks`)
rather than plain `address(0x5)`-style constants, since EIP-191 signature tests need
a known private key to sign with.

Key test helpers:
- Cost must be computed BEFORE `vm.startPrank` (or prank gets consumed by getter)
- First vault ID is `1` (not 0) — `nextVaultId` starts at 1
- `createLegacyVault` test call: pass `false, false, 0` for last 3 params
- `_sign(pk, message)` — EIP-191 personal-sign helper matching the contract's `_recoverSigner`
- `_setUpCoreKeys()` — registers 6 core keys derived from `coreKeyPks`
- `_createVaultMulti(duration, recipients[])` — multi-recipient vault helper for scoping tests

---

## Website
**Files in `web site/`:**
- `legacy-protocol-website.html` — main landing page, English (dark theme, Fraunces + IBM Plex fonts)
- `index.html` — full copy of the landing page (kept in sync with `legacy-protocol-website.html`), serves as the default file for the Cloudflare Worker
- `es/index.html`, `fr/index.html`, `ru/index.html`, `zh/index.html`, `ar/index.html` — full translated static copies (Arabic is RTL)
- `app.html` — wallet-connected vault dashboard (password-gated, password: "123"; gate is client-side only, trivially bypassable — not real access control). 2026-07-03/04: rewritten to match the current contract — ABI now includes `claimLegacyVault`, `deleteVaultContent`, the 9-param `createLegacyVault`, `getVaultIdsByRecipientHash` (Private Discovery lookup), `getActiveServiceProviders`. Supports both `local` (Anvil, chainId 31337) and `sepolia` (Base Sepolia) networks via `dapp-config.js`. Create-vault flow: client-side AES-256-GCM encrypt (Web Crypto API) → upload via chosen storage provider → decryption key shown once in an inline reveal box (never `window.prompt`/`alert` — unreliable in mobile wallet in-app browsers) → on-chain `createLegacyVault` call. Incoming tab: claim (EIP-191 sign + `callStatic` to read the return URI before the real tx) → fetch from URI → decrypt with a pasted key → "delete my access" button (per-recipient scoped, matches the 2026-07-03 contract fix). Vault expiry/status checks use the chain's own `provider.getBlock("latest").timestamp`, not the browser's wall clock.
- `dapp-config.js` — per-environment config: active network, contract address per network, storage provider credentials (Pinata JWT, Filebase keys, Irys node). Ships with placeholders only — safe to commit as-is. Filebase/Arweave keys are NOT meant for public client-side exposure long-term; a real deployment should proxy those through a backend (e.g. a Cloudflare Worker function) so secrets never reach the browser.
- `storage.js` — client-side encryption + storage provider abstraction. `mock` provider (data: URI, no account needed) is fully tested end-to-end. `pinata` (IPFS) and `filebase` (IPFS via aws4fetch/S3 SigV4) are written per each provider's docs but **untested** — no real credentials existed when written. `arweave` (via Irys, pay in ETH) needs a working CDN `<script>` include for the Irys browser SDK added to `app.html` before it'll work — the bundle URL could not be verified (see comment in `app.html`).
- `LGY_Whitepaper_Rev2026_3.pdf` — current white paper (content covers protocol/contract/tokenomics only — not affected by website/hosting work). Rev2026_2 kept alongside for history.
  - Rev2026.3 changelog vs 2026.2: fixed governance threshold references (was incorrectly stated as 3-of-5, live contract is 3-of-6); added Service Provider Registry (§3.2, code exists but not yet covered by tests — flagged as such); added optional permanent veto waiver (§3.4); added new §3.6 Post-Claim Content Deletion (`deleteVaultContent()`); added new §4.7 BTC Holder Airdrop mechanics; Security Posture (§6) now discloses `debugClaimMessage()` pending removal and explicitly notes claim/governance/service-provider code paths aren't yet covered by the Foundry test suite (only vault creation/extension/veto/unstake/notify are). 2026-07-04: content-deletion description corrected to per-recipient scoping (matches the contract fix); test-count language corrected (36 tests specific to the two contracts, 38 total in the repo including 2 unrelated Foundry template tests). The whitepaper docx (`white paper/LGY_Whitepaper_Rev2026_3.docx`) was fully rewritten from scratch (via docx-js) to match the PDF's exact section numbering — old version kept as `LGY_Whitepaper_Rev2026_3_pre-full-rewrite-backup.docx`.
- `robots.txt`, `sitemap.xml` — added 2026-07-05. Sitemap lists all 6 language URLs with `hreflang` alternates; robots.txt disallows `/app.html` (gated dashboard, not meant for search indexing).
- `LGY_Twitter_Avatar.png` (400×400, favicon + og:image fallback), `LGY_Twitter_Banner.png` (1500×500, og:image/twitter:image) — copied here from the project root so they're servable from the live domain.
- `netlify.toml` — leftover from the old Netlify setup; no longer used (Cloudflare Workers doesn't read it), kept for reference only
- `index.OLD-backup.html` — pre-migration backup, not otherwise used

**SEO (added 2026-07-05):** all 7 HTML files (`index.html`, `legacy-protocol-website.html`, + 5 language pages) now have unique `meta description`, Open Graph + Twitter Card tags, self-referencing `canonical`, full `hreflang` alternates cross-linking all 6 language versions (+ `x-default` → English), and a favicon. Before this, the site had only `<title>` tags — no description, no social preview images, no sitemap/robots.txt, no hreflang (risked language/duplicate-content confusion in search).

**Deploying a website change (current process — see Hosting note above):**
1. Commit and push to `master` on GitHub (this alone does NOT go live).
2. Manually redeploy via Cloudflare dashboard: Workers & Pages → `legacy-protocol` → Deployments → "Create deployment"/"Upload assets" → upload the `web site/` files (all 6 language `index.html` files + `legacy-protocol-website.html` + `app.html` + `dapp-config.js` + `storage.js` + `robots.txt` + `sitemap.xml` + the two `LGY_Twitter_*.png` images + the PDF). Best done by Tomas directly in his own browser — dashboard automation tends to hang.

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
  foundry.toml                  ← optimizer enabled (needed — see below)
  src/LegacyProtocol.sol        ← copy of main contract for tests
  src/LGY_BTC_Airdrop.sol       ← copy of airdrop contract for tests
  test/LegacyProtocol.t.sol     ← 34 main contract tests
  test/LGY_BTC_Airdrop.t.sol    ← 27 airdrop tests
web site/
  legacy-protocol-website.html  ← landing page (English)
  index.html                    ← synced copy of landing page, default Worker file
  es/ fr/ ru/ zh/ ar/index.html ← translated static pages (ar = RTL)
  app.html                      ← wallet-connected vault dashboard (password: 123)
  dapp-config.js                ← network + storage provider config (placeholders only)
  storage.js                    ← client-side encryption + Pinata/Filebase/Arweave/Mock upload
  robots.txt, sitemap.xml       ← added 2026-07-05 for SEO
  LGY_Twitter_Avatar.png/Banner.png ← favicon + og:image source
  netlify.toml                  ← unused leftover from Netlify era
```

**Important — Solidity optimizer must stay enabled:** `LegacyProtocol` compiles to ~41.8KB without the optimizer, but EIP-170 caps deployable contract size at 24,576 bytes — it could not be deployed to BASE (or any EVM chain) at all before this was fixed. With `optimizer = true, optimizer_runs = 200` in `foundry-tests/foundry.toml`, it compiles to ~23KB (~1.5KB margin). Do not remove this setting.

---

## Things NOT yet done (pending)
- Remove `debugClaimMessage()` before mainnet deployment
- Base Sepolia testnet deployment (need test ETH)
- 3rd party security audit (CertiK / Hacken)
- LGY ERC-20 token contract
- Validator bootstrap strategy (how validators participate before real LGY exists)
- ~~Test coverage gap~~ — resolved 2026-07-03: claim/delete signature flows, governance proposal lifecycle, and the Service Provider Registry now have Foundry tests (main contract went from 9 → 34 tests; 63/63 total passing).
- Real storage backend not yet connected: the contract only stores an `encryptedDataURI` string — no actual client-side encryption + upload flow (e.g. IPFS/Arweave via a pinning service) exists yet in a front-end/dApp, and no real Service Provider has been registered via governance.
- Front-end/dApp — unclear if a functional vault create/claim/veto UI exists beyond the marketing website reviewed in this repo.

- > Šis fragmentas skirtas įklijuoti į `legacy-protocol` (viešo repo)
> `CLAUDE.md` failą — pvz. kaip naują skyrių arti dokumento pabaigos,
> po "Things NOT yet done". Paruošta 2026-08-16 koordinatoriaus, kad
> Code sesijos matytų sprendimų ribas tiesiogiai repo viduje, ne tik
> per atskirą perdavimo dokumentą.

---

## Task Handoff Protocol (kaip Code sesija turi suprasti "judam" nurodymus)

Kai žmogus šiame repo parašo **„tesk"** (arba tiesiog nurodo veikti pagal šį protokolą):

1. Patikrink, ar repo master šaknyje yra failas `KITA-UZDUOTIS.md`.
2. Jei yra — perskaityk jį VISĄ ir įvykdyk būtent tą užduotį, laikydamasis jos apimties ir "NE ŠIOS UŽDUOTIES APIMTYJE" apribojimų.
3. Baigus (arba jei negali baigti dėl trūkstamos prieigos/informacijos) — atnaujink `PROGRESAS.md` ir `RAPORTAS-LATEST.md` (sukurk, jei jų dar nėra), tada IŠTRINK `KITA-UZDUOTIS.md`.
4. Jei `KITA-UZDUOTIS.md` faile yra skyrius „Reikia patvirtinimo dėl" arba užduotis paliečia sritis, priklausančias TIK Tomo sprendimui (žr. Decision Boundaries žemiau) — STOP, nedaryk prielaidų, aiškiai paklausk raporte.
5. Jei `KITA-UZDUOTIS.md` NĖRA repo šaknyje, o žmogus vis tiek parašė „tesk" — paprašyk jo arba įklijuoti užduotį tiesiai į pokalbį, arba nurodyti, kur ją rasti; nebandyk spėti, ko reikia.

Ši pati konvencija (tas pats žodis „tesk") galioja identiškai ir privačiame (sutarties) repo, jo paties `CLAUDE.md` faile — ten disambiguacija taip pat vyksta per sesijos repo kontekstą, ne per skirtingą žodį.

---

## Decision Boundaries (koordinatoriaus ir Code sesijų įgaliojimų ribos)

Šis skyrius apibrėžia, ką koordinatorius/Code sesija gali spręsti savarankiškai, o ką — tik Tomas. Jei užduotis liečia dešinę pusę, sustok ir palauk Tomo patvirtinimo raporto skyriuje "Reikia patvirtinimo dėl".

**Sprendžia koordinatorius/Code:**
- Implementacijos detalės, neišeinančios už esamos architektūros (3-iš-6 multisig, 14 d. timelock, joks pause/guardian mechanizmas).
- Dokumentacijos sinchronizavimas su realybe (testų skaičiai, statuso žymos, jau padaryto darbo aprašymas).
- Užduočių eiliškumas pagal patvirtintą roadmap kritinį kelią.
- Smulkūs whitepaper status-banner pataisymai, kai jie tik ištaiso faktą.

**Sprendžia tik Tomas:**
- Bet kokios išlaidos (audito firma, gas kaštai, paraiškos grants/akceleratoriams).
- Teisiniai / SAFT / token ekonomikos sprendimai.
- Bet koks testnet ar mainnet deployment paleidimas — visada Tomo rankinis veiksmas jo paties aplinkoje.
- Galutinis investuotojams skirtos komunikacijos turinys prieš siunčiant.
- LGY token / Polygon klausimo faktinis paaiškinimas — kol Tomas nepatvirtina, jokia komunikacija šia tema nesiunčiama.
- Svetainės Cloudflare deploy (rankinis "Upload assets" žingsnis).

**Raktų taisyklė:** joks deployer/private raktas niekada neprašomas ir nepatenka į jokį agento konteinerį. Deployment visada lieka Tomo rankinis veiksmas.
