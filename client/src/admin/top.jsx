import { useLsi } from "uu5g05";
import { UiAuth } from "caio-ui";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";
import ClubName from "../components/layout/club-name.jsx";
import { ADMIN_MENU } from "../config/admin-menu.js";
import { useColorModeItem } from "../tools/color-mode.js";

const { theme } = Config;

/**
 * Konfigurace horní lišty administrace.
 *
 * Erb a název klubu jako na webu, ať je vidět, že je to tentýž klub; druhý řádek názvu říká,
 * že jde o administraci. Logo vede na rozcestník adminu, na web vede položka „Web“ (`href`
 * mimo app base `/admin/`, takže z ní `Top` udělá obyčejný odkaz a stránka se načte znovu).
 *
 * Obrazovky jsou v rozbalovací položce, a **jen ty, na které přihlášený má** — zašedlé
 * položky se v tomhle webu nepoužívají (design/frontend.md, 2.2). Nepřihlášený nevidí žádnou,
 * guard na routě mu ukáže přihlášení.
 *
 * Přihlášeného uživatele, odhlášení i správu identit dodává `Top` sám přes `displayIdentity`
 * (caio-ui README, *Identita v liště*). Role klubu se přidělují na obrazovce
 * `screens/identities.jsx`, protože rozsahová `teamEditor:<id>` potřebuje seznam mužstev.
 */
export function useAdminTop() {
  const session = UiAuth.useSession();
  const adminLabel = useLsi(importLsi, ["header", "nav", "admin"]);
  const webLabel = useLsi(importLsi, ["header", "nav", "web"]);
  const menuLsi = useLsi(importLsi, ["admin", "menu"]);
  // Režim je společný s webem (tools/color-mode.js), přepínač je proto i tady.
  const colorModeItem = useColorModeItem(useLsi(importLsi, ["header", "colorMode"]));

  const itemList = ADMIN_MENU.filter((item) => UiAuth.hasProfile(session.identity, item.profileList)).map(
    (item) => ({
      href: item.route,
      icon: item.icon,
      children: menuLsi[item.code]?.header ?? item.code,
    }),
  );

  return {
    logo: { imageSrc: Config.asset.logoTransparent, href: "/admin/", significance: "subdued", tooltip: adminLabel },
    children: <ClubName subtitle={adminLabel} />,
    // Stejná lišta jako na webu (app.jsx): tmavá v obou režimech, barvy jako hex tmavé palety,
    // aby `Top` uu5 položkám nastavil tmavý podklad.
    cssBackground: theme.palette.dark.bg,
    cssColor: theme.palette.dark.fg,
    menu: {
      itemList: [
        itemList.length
          ? {
              children: adminLabel.toUpperCase(),
              significance: "subdued",
              colorScheme: "building",
              itemList,
            }
          : undefined,
        {
          href: "/",
          children: webLabel.toUpperCase(),
          significance: "subdued",
          colorScheme: "building",
        },
        colorModeItem,
      ].filter(Boolean),
    },
    displayIdentity: true,
  };
}

export default useAdminTop;
