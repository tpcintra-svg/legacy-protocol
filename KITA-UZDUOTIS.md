# KITA-UŽDUOTIS — Website (legacy-protocol)
**Kontekstas:** Tomas nustatė 3 problemas pagrindiniame puslapyje:
1. Hero sekcijoje „Request the deck" (mailto) — laiškas išsiunčiamas, bet nepasiekia `ceo@legacyprotocol.io`.
2. „Built on what's real" sekcijoje „Email us" (mailto) mygtukas kartais negali būti paspaustas (priklauso nuo įrenginio pašto kliento).
3. Toje pačioje sekcijoje „Download White Paper" mygtuką reikia PAŠALINTI ir jo vietoje įdėti veikiantį el. pašto lauką + „Email us" mygtuką.
**PATVIRTINTA (Tomas, per Mailchimp panelę):** sukurta nauja grupė `Signup Source` (Group ID **95220**) su trimis paslėptomis (dabar checkbox tipo, bus paslėptos kode) opcijomis:
- `Updates` = value **1**
- `Investor Inquiry` = value **2**
- `Deck Request` = value **4**
Naudojamas tas pats, jau veikiantis Mailchimp endpoint'as visoms trims formoms:
`https://legacyprotocol.us2.list-manage.com/subscribe/post?u=8f82f281ad1691546011598f0&id=004f6fd32d&f_id=00e596e3f0`
su tuo pačiu bot-protection honeypot lauku: `name="b_8f82f281ad1691546011598f0_004f6fd32d"`.
---
## Apimtis: 3 pakeitimai, 7 failai
Failai: `index.html`, `legacy-protocol-website.html`, `es/index.html`, `fr/index.html`, `ru/index.html`, `zh/index.html`, `ar/index.html`.
### 1. „Get Updates" forma (jau egzistuoja) — pridėti paslėptą grupės lauką
Rasti esamą formą (`id="mc-embedded-subscribe-form"`, apačioje, „Stay updated on our progress" sekcijoje). Prieš `<button type="submit" name="subscribe"...>Get Updates</button>` įterpti:
```html
<input type="hidden" name="group[95220][1]" value="1">
```
### 2. Hero sekcija — „Request the deck" mailto → veikianti forma
Rasti (maždaug 15-oje eilutėje po `<header class="hero">`):
```html
<a href="mailto:ceo@legacyprotocol.io?subject=Request%3A%20Legacy%20Protocol%20Pitch%20Deck&body=Hi%20Tomas%2C%0A%0AI%20came%20across%20Legacy%20Protocol%20and%20would%20like%20to%20learn%20more.%20Could%20you%20share%20the%20pitch%20deck%3F%0A%0A" class="btn btn-primary">Request the deck</a>
```
Pakeisti į:
```html
<form action="https://legacyprotocol.us2.list-manage.com/subscribe/post?u=8f82f281ad1691546011598f0&amp;id=004f6fd32d&amp;f_id=00e596e3f0" method="post" id="mc-embedded-subscribe-form-deck" name="mc-embedded-subscribe-form-deck" class="validate" target="_blank" style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
  <input type="email" name="EMAIL" placeholder="your@email.com" required style="padding:10px 16px; background:rgba(232,227,216,0.08); border:1px solid var(--line-bright); border-radius:6px; color:var(--parchment); font-family:var(--body); font-size:14px; outline:none; min-width:200px;">
  <input type="hidden" name="group[95220][4]" value="1">
  <div style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;" aria-hidden="true">
    <input type="text" name="b_8f82f281ad1691546011598f0_004f6fd32d" tabindex="-1" value="">
  </div>
  <button type="submit" name="subscribe" class="btn btn-primary">Request the deck</button>
</form>
```
`<a href="#architecture" class="btn btn-ghost">See what's built</a>` (šalia esantis mygtukas) — palikti nepakeistą.
### 3. „Built on what's real" sekcija — pašalinti whitepaper mygtuką, „Email us" paversti realia forma
Rasti (`<div class="hero-actions">` viduje, prie `<h2>Built on what's real...`):
```html
<a href="mailto:ceo@legacyprotocol.io?subject=Legacy%20Protocol%20%E2%80%94%20Investor%20Inquiry" class="btn btn-primary">Email us</a>
<a href="LGY_Whitepaper_Rev2026_3.pdf" class="btn" target="_blank" style="border:1px solid var(--line-bright); background:transparent; color:var(--parchment);">Download White Paper</a>
```
Pakeisti abi eilutes į:
```html
<form action="https://legacyprotocol.us2.list-manage.com/subscribe/post?u=8f82f281ad1691546011598f0&amp;id=004f6fd32d&amp;f_id=00e596e3f0" method="post" id="mc-embedded-subscribe-form-investor" name="mc-embedded-subscribe-form-investor" class="validate" target="_blank" style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
  <input type="email" name="EMAIL" placeholder="your@email.com" required style="flex:1; min-width:220px; padding:12px 16px; background:rgba(232,227,216,0.08); border:1px solid var(--line-bright); border-radius:6px; color:var(--parchment); font-family:var(--body); font-size:0.95rem; outline:none;">
  <input type="hidden" name="group[95220][2]" value="1">
  <div style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;" aria-hidden="true">
    <input type="text" name="b_8f82f281ad1691546011598f0_004f6fd32d" tabindex="-1" value="">
  </div>
  <button type="submit" name="subscribe" class="btn btn-primary">Email us</button>
</form>
```
**PALIKTI nepakeistą:** eilutę žemiau — `<p>...or write directly: <a href="mailto:ceo@legacyprotocol.io">...`. (Pastaba: ši nuoroda vis tiek priklausys nuo `ceo@legacyprotocol.io` pašto dėžutės veikimo — žr. §5 žemiau, tai atskira, ne šios užduoties problema.)
`LGY_Whitepaper_Rev2026_3.pdf` failo iš `web site/` katalogo NETRINTI (whitepaper tebėra pasiekiamas per whitepaper juodraštį/kitus kanalus, tiesiog nebėra šios nuorodos į jį šiame puslapyje).
---
## Vertimai (5 kalbos)
Kiekvienoje kalboje pakartoti tą pačią struktūrą (formos, laukai, hidden group reikšmės — nesikeičia), tik mygtukų tekstą išversti. Juodraštiniai vertimai (**REKOMENDUOJAMA: gimtakalbio peržiūra prieš publikavimą**):
| Kalba | „Request the deck" | „Email us" |
|---|---|---|
| ES | Solicitar la presentación | Escríbenos |
| FR | Demander la présentation | Écrivez-nous |
| RU | Запросить презентацию | Напишите нам |
| ZH | 索取演示文稿 | 联系我们 |
| AR | اطلب العرض التقديمي | راسلنا |
`placeholder="your@email.com"` palikti tokį patį visose kalbose (įprasta praktika).
`ar/index.html` atkreipti dėmesį į RTL (`dir="rtl"`) — patikrinti, kad forma neišsikreiptų.
---
## Testavimas prieš laikant baigta
- [ ] Kiekvienoje iš 7 formų (3 naujos × ne, tiksliau: 1 atnaujinta „Get Updates" + 2 naujos, × 7 failai = 21 formos vieta) patikrinti, kad `group[95220][N]` reikšmė teisinga (1/2/4).
- [ ] Realiai išbandyti BENT vieną submit su testiniu el. paštu (pvz. savo) kiekvienai iš 3 formų POST'inimo mechanikų (Get Updates / Email us / Request the deck) — patikrinti Mailchimp Audience, kad naujas prenumeratorius atsirado su teisinga „Signup Source" žyme.
- [ ] `index.html` ir `legacy-protocol-website.html` identiški.
- [ ] Visų 5 vertimų puslapiuose pakeitimas atliktas, `ar/index.html` layout nesulūžęs.
- [ ] Po commit+push — priminti Tomui apie privalomą rankinį Cloudflare "Upload assets" deploy žingsnį (be jo pakeitimai nepasiekia gyvos svetainės).
## NE ŠIOS UŽDUOTIES APIMTYJE
- `ceo@legacyprotocol.io` MX/pašto dėžutės DNS konfigūracija Cloudflare panelėje — atskira, nebaigta problema (žr. žemiau §5), nesusijusi su šiuo kodo pakeitimu, ir tai — Tomo veiksmas, ne Code sesijos.
- Automatinis deck'o (PDF/pptx) siuntimas užpildžius „Request the deck" formą — šiuo metu tik užfiksuojamas el. paštas su žyme, siuntimas lieka rankinis (Tomas peržiūri Mailchimp Audience pagal „Deck Request" žymę ir siunčia asmeniškai). Jei norima automatizuoti — tai atskiras Mailchimp Automation užduoties punktas, reikalaujantis Tomo sprendimo/prieigos.
---
## §5. Atskiras, nesusijęs veiksmas Tomui (ne Code sesijos apimtyje)
„Request the deck" laiško negavimas per mailto rodo, kad `ceo@legacyprotocol.io` pašto dėžutė, tikėtina, neveikia — greičiausiai MX įrašai neperkelti, kai domenas 2026-07-01 persikėlė į Cloudflare. Rekomendacija: Cloudflare dashboard → `legacyprotocol.io` → **Email** → **Email Routing** (arba **DNS** → patikrinti MX įrašus). Tai paveiks ir „or write directly: ceo@legacyprotocol.io" nuorodą, kuri lieka puslapyje.
