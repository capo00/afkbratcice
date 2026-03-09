# Web Scraping - fotbal.cz Match Schedule

Extracts match data from fotbal.cz and outputs SQL INSERT statements in the same format as `afk.rb`.

## Usage

### Option 1: Local HTML file (recommended)

fotbal.cz uses Cloudflare protection, so direct fetching often fails. Save the page manually:

1. Open https://www.fotbal.cz/souteze/turnaje/zapas/81576dd0-2443-4595-a2b3-41a6d933ca4f in your browser
2. Complete any verification if prompted
3. Save the page as `schedule.html` (Ctrl+S, "Web page, complete")
4. Run:

```bash
npm run scrape -- schedule.html
```

### Option 2: Direct URL (requires Chrome)

If you have Chrome installed, the script will try to fetch the page directly:

```bash
npm run scrape
```

Or with a custom URL:

```bash
node scrape.js "https://www.fotbal.cz/souteze/turnaje/zapas/YOUR-MATCH-ID"
```

## Output

Same format as `afk.rb`:

```sql
INSERT INTO `d27814_afk`.`zapas` (`kolo`, `datum`, `idD`, `idH`) VALUES ('1', '2025-03-15 14:00:00', 1, 47);
```

## Team IDs

The `TEAMS` mapping in `scrape.js` matches `afk.rb`. Edit it to add or change team IDs.
