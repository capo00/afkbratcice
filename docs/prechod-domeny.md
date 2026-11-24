# Přechod afkbratcice.cz z WEDOS na App Engine

> **Hotovo 2026-11-24 (Caio):** doména vede na App Engine. Ověřeno: `https://afkbratcice.cz/sys/health`
> odpovídá z produkce (`canonicalHost: afkbratcice.cz`), `www.afkbratcice.cz/historie` → 301 na
> `afkbratcice.cz/historie`. Vydává se bez `--url` (krok 7). Zbývá podle potřeby: Search Console (krok 8),
> pošta (krok 9) a zrušení WEDOS (krok 10). Níže je původní postup.

Stav k 2026-11-20:

- **Doména** je registrovaná u WEDOS do 24. 8. 2027 a má zapnutý DNSSEC.
- **DNS** běží na WEDOS (`ns.wedos.*`):
  - `@` i `www` jsou záznamy A `185.8.237.11` a AAAA `2a0e:acc0::c11`, tedy hosting s webem v0;
  - MX `wes1-mx1/2.wedos.net` (schránka `admin@afkbratcice.cz`);
  - záznamy TXT (SPF, DMARC) ani CAA nejsou.
- **App Engine:** projekt `afkbratcice`, region `europe-west6`, adresa `afkbratcice.oa.r.appspot.com`, zatím bez mapování domény.

**Princip.** Registrace domény a DNS zůstanou u WEDOS: DNS je u domén registrovaných u WEDOS
zdarma a o DNSSEC se WEDOS stará sám. Zruší se jen **webhosting a pošta**. Doménu je potřeba
dál prodlužovat (další platba před 24. 8. 2027).

---

## 0. Den předem

1. **Rozhodni, kam půjde pošta `admin@afkbratcice.cz`** (krok 9). Adresa je dnes na webu jako
   kontakt na sekretáře.
2. **Záloha hostingu WEDOS**, než se cokoli zruší:
   - celý web přes FTP, včetně `/covid`, `/ppp`, `/2.0.0` a matematiky (se zrušením hostingu zmizí);
   - export databáze z phpMyAdmin (dump `clanek` už máme, ale celá DB se hodí).
3. **Záloha schránky:** přes IMAP do Thunderbirdu, nebo v Gmailu *Nastavení → Účty a import →
   Importovat poštu*.
4. **Snížit TTL.** V DNS WEDOS dej záznamům A/AAAA pro `@` a `www` TTL **300**. Přepnutí se pak
   projeví do 5 minut, ne do hodiny. Změny ve WEDOS DNS se potvrzují tlačítkem **Aplikovat změny**.

## 1. Ověření domény v Search Console

Stejný Google účet, který je vlastníkem projektu `afkbratcice` v Google Cloud.

1. Otevři <https://search.google.com/search-console> → *Přidat službu* → typ **Doména**
   (ne „Předpona adresy URL“) → `afkbratcice.cz`.
2. Google ukáže TXT záznam `google-site-verification=…`.
3. Ve WEDOS DNS přidej záznam: název prázdný (`@`), typ **TXT**, hodnota přesně ta z Googlu,
   TTL 300. Pak *Aplikovat změny*.
4. Po pár minutách v Search Console klikni na **Ověřit**. TXT záznam už nemaž, ověření by
   časem zaniklo.

Tahle služba se pak hodí i na SEO (krok 8).

## 2. Mapování domény v App Engine

Google Cloud Console → projekt `afkbratcice` → **App Engine → Nastavení → Vlastní domény**
(Settings → Custom domains) → **Přidat vlastní doménu**.

1. Vyber ověřenou `afkbratcice.cz`.
2. Nech zaškrtnuté obě adresy: `afkbratcice.cz` **i** `www.afkbratcice.cz` → *Uložit mapování*.
3. Console ukáže DNS záznamy, které má doména mít. Mají být tyto (kdyby se lišily, platí ty z Console):

| Název | Typ | Hodnota |
| --- | --- | --- |
| `@` | A | `216.239.32.21` |
| `@` | A | `216.239.34.21` |
| `@` | A | `216.239.36.21` |
| `@` | A | `216.239.38.21` |
| `@` | AAAA | `2001:4860:4802:32::15` |
| `@` | AAAA | `2001:4860:4802:34::15` |
| `@` | AAAA | `2001:4860:4802:36::15` |
| `@` | AAAA | `2001:4860:4802:38::15` |
| `www` | CNAME | `ghs.googlehosted.com.` |

Totéž jde z příkazové řádky:

```powershell
gcloud app domain-mappings create afkbratcice.cz --certificate-management=AUTOMATIC
gcloud app domain-mappings create www.afkbratcice.cz --certificate-management=AUTOMATIC
```

Certifikát HTTPS vydá a obnovuje Google sám, ale až když DNS vede na Google (krok 4).

## 3. Přihlášení Google a Facebook na nové doméně

Udělej to **před** přepnutím DNS, ať přihlášení funguje hned. Adresy pro appspot nech, jak jsou.

**Google:** Cloud Console → *APIs & Services*:

1. *Credentials* → OAuth klient appky → **Authorized redirect URIs** → přidat
   `https://afkbratcice.cz/auth/google/callback`.
2. *OAuth consent screen* (Branding) → **Authorized domains** → přidat `afkbratcice.cz`.

**Facebook:** <https://developers.facebook.com> → appka:

1. *Facebook Login → Settings* → **Valid OAuth Redirect URIs** → přidat
   `https://afkbratcice.cz/auth/facebook/callback`.
2. *App settings → Basic* → **App Domains** → přidat `afkbratcice.cz`.

## 4. Přepnutí DNS ve WEDOS

Nejlépe večer: do vydání certifikátu hlásí `https://afkbratcice.cz` chybu certifikátu. Obvykle to
trvá desítky minut, výjimečně až 24 h.

1. **Smaž** A `185.8.237.11` a AAAA `2a0e:acc0::c11` u `@` i u `www`. `www` nesmí mít A/AAAA
   současně s CNAME.
2. Je-li v zóně zástupný záznam `*` vedoucí na hosting, smaž ho taky. Ostatní subdomény
   hostingu (`ftp`, `webmail`, `mail`, `autoconfig`, …) zatím nech, odejdou s hostingem (krok 10).
3. **Přidej** 4× A, 4× AAAA pro `@` a CNAME `www` z tabulky v kroku 2, TTL 300.
4. **MX zatím nech**, pošta jede dál přes WEDOS až do kroku 9.
5. *Aplikovat změny*.

Stav certifikátu:

```powershell
gcloud app domain-mappings describe afkbratcice.cz
```

Dokud je v `sslSettings` jen `pendingManagedCertificateId`, certifikát se vydává. Jakmile je
tam `certificateId`, je hotovo. Totéž ukazuje Console u vlastních domén.

## 5. `CANONICAL_HOST` a nasazení

V produkčním `.env` doplnit:

```env
CANONICAL_HOST=afkbratcice.cz
```

`APP_URL=https://afkbratcice.cz` už tam je. Pak nasadit (`npm run deploy`, nebo vydání). Od té
chvíle server přesměruje `www.afkbratcice.cz` → `afkbratcice.cz` (301). `http://` na `https://`
přesměrovává App Engine sám (`app.yaml`, `secure: always`).

## 6. Kontrola

- `https://afkbratcice.cz/sys/health`: verze 0.12.0 a platný certifikát.
- `http://afkbratcice.cz/` → 301 na `https://afkbratcice.cz/`.
- `https://www.afkbratcice.cz/historie` → 301 na `https://afkbratcice.cz/historie`.
- Staré adresy:
  - `/vsechny-zapasy-muzi` a `/infoZapasu.php?zapas=2000` → stránka mužstva / zápasu;
  - `/profil` → 410.
- `https://afkbratcice.cz/robots.txt` a `/sitemap.xml`: adresy na `https://afkbratcice.cz/…`.
- Přihlášení přes Google i Facebook na `afkbratcice.cz`.
- Sdílený odkaz na Facebooku (<https://developers.facebook.com/tools/debug/>): náhled s obrázkem.

## 7. Vydávání od teď

Release kontroluje `/sys/health` přímo na `APP_URL`, takže `--url` není potřeba
(potvrzeno 2026-11-24, README §7).

## 8. Search Console po přepnutí

1. *Soubory Sitemap* → odeslat `https://afkbratcice.cz/sitemap.xml`.
2. *Kontrola URL* → `https://afkbratcice.cz/` → *Požádat o indexování*.
3. Pár týdnů sledovat *Stránky* (Indexování). Staré adresy v0 mají do pár týdnů vypadnout
   (301/410), administrace se indexovat nesmí (`noindex`).

## 9. Pošta – vyber jednu možnost

Pořadí je důležité: **nejdřív nová pošta, pak zrušení té na WEDOS.** Jinak se e-maily mezitím
vracejí odesílatelům.

**A) Přeposílání zdarma (doporučeno, pokud adresu někdo používá).** Například ImprovMX
(<https://improvmx.com>, zdarma pro 1 doménu):

1. Zaregistruj doménu a nastav alias `admin` → osobní e-mail.
2. Ve WEDOS DNS:
   - smaž MX `wes1-mx1/2.wedos.net`;
   - přidej MX `mx1.improvmx.com` (priorita 10) a `mx2.improvmx.com` (priorita 20);
   - přidej TXT `@` `v=spf1 include:spf.improvmx.com ~all`.
3. Pošli si zkušební e-mail na `admin@afkbratcice.cz`.

Funguje jen příjem. Odpovídá se z osobní adresy.

**B) Žádná pošta na doméně.** Vhodné, pokud adresu nikdo nepotřebuje.

1. V administraci → *Trenéři a výbor* změň e-mail sekretáře z `admin@afkbratcice.cz` na jinou
   adresu (je vidět na `/vybor` a v kontaktu).
2. Ve WEDOS DNS:
   - smaž oba MX;
   - přidej TXT `@` `v=spf1 -all`;
   - přidej TXT `_dmarc` `v=DMARC1; p=reject`.

   Tím za klub nikdo nebude moci podvrhnout e-mail.

**C) Plnohodnotná schránka** (Google Workspace, Seznam Email Profi, …): placené. MX a SPF podle
návodu poskytovatele.

Reset hesla e-mailem appka dnes nenabízí, protože produkce nemá SMTP. Kdyby ho chtěl, potřebuje
SMTP odjinud (Gmail s heslem aplikace, Brevo zdarma, …), nastavuje se v administraci →
*Nastavení → Pošta*. To s žádnou z možností výše nesouvisí.

## 10. Zrušení WEDOS

Až web aspoň 1–2 týdny běží z App Engine a pošta funguje podle kroku 9:

1. WEDOS administrace → *Služby* → **webhosting** → zrušit / neprodlužovat. Je-li pošta
   samostatná služba (WEDOS Mail), totéž s ní.
2. **Doménu `afkbratcice.cz` nerušit a nepřevádět.** Zkontroluj, že se prodlužuje: platba
   před 24. 8. 2027, ideálně automaticky.
3. Po zrušení otevři DNS zónu a ověř, že v ní zůstaly záznamy Googlu (A/AAAA/CNAME, TXT
   Search Console) a nové MX. Smaž zbylé záznamy, které vedou na hosting (`ftp`, `webmail`,
   `mail`, `autoconfig`, `autodiscover`, …).
4. Nakonec vrať TTL záznamů na 3600.

DNSSEC dál podepisuje WEDOS, nic se nemění. **Pokud bys někdy DNS stěhoval jinam, nejdřív
vypni DNSSEC u WEDOS**, jinak doména přestane fungovat.
