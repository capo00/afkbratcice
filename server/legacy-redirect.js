// Přesměrování URL ze starého PHP webu (v0). Musí být namountované PŘED SPA fallbackem,
// jinak by cesty bez přípony spolkl index.html.
//
// Zatím jen STATICKÁ pravidla. Přesměrování s číselným id (`/novinka-<n>`,
// `/informace-o-zapase-<n>`, `/fotogalerie-<n>`) potřebují mapovací kolekci
// `migration_map`, která vznikne až s migrací -- do té doby by vedla nikam, takže se
// neregistrují vůbec (design/impl-plan-server.md, rozsah dávky).

const STATIC_REDIRECT = {
  "/home": "/",
  "/historie": "/page?code=history",
  "/hymna": "/page?code=hymn",
  "/kontakt": "/page?code=contact",
  "/vybor": "/page?code=board",
  "/treninky": "/page?code=training",
  "/tymove_fotky": "/page?code=team-photos",
  "/muzstva": "/teams",
  "/fotogalerie": "/gallery",
  "/ke-stazeni": "/files",
  "/prihlaseni": "/login.html",
  "/zapomenute-heslo": "/login.html",
};

// Stránkování novinek: /home-2, /home-69, ...
const HOME_PAGE = /^\/home-(\d+)\/?$/;

// Klubová kasa a staré JSON API jsou mimo rozsah -- 410 říká vyhledávačům, že se
// nevrátí, na rozdíl od 404.
const GONE = [/^\/pokladna/, /^\/pokuty/, /^\/moje-pokuty/, /^\/prijem/, /^\/vydaj/, /^\/api\//];

// Diskuze se ruší (poslední příspěvek 2017, zaspamovaná).
const DISCUSSION = /^\/diskuze/;

function legacyRedirect(req, res, next) {
  const path = req.path.replace(/\/+$/, "") || "/";

  if (path === "/") return next();

  const target = STATIC_REDIRECT[path];
  if (target) return res.redirect(301, target);

  const homePage = path.match(HOME_PAGE);
  if (homePage) return res.redirect(301, `/news?pageIndex=${Math.max(0, Number(homePage[1]) - 1)}`);

  if (DISCUSSION.test(path)) return res.redirect(301, "/");
  if (GONE.some((re) => re.test(path))) return res.status(410).send("410 Gone");

  return next();
}

export default legacyRedirect;
