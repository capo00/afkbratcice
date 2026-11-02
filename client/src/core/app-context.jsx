import { createComponent, useDataObject, useMemo, useRef, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiApp, UiElements } from "caio-ui";
import Config from "../config/config.js";

const { theme } = Config;

// Nastavení klubu, kategorie a mapa týmů — jednou při startu SPA, pak z kontextu.
//
// Čtyři dotazy, protože každý odpovídá na jinou otázku:
//
//  - `sys/settings/get` (caio-ui `UiApp.useSettings()`, sdílené pod `SpaProvider`) — co správce
//    nastavil za běhu v Nastavení (proužek s upozorněním, kontakt, sítě, rok založení, kde
//    skrývat jména); veřejná část `sys_settings.app`. Po uložení v Nastavení se obnoví sama.
//  - `season/listCurrent` — **které kategorie klub letos má**. Nejsou nikde vyjmenované;
//    odvozují se ze sezón, protože složení mužstev se mění rok od roku (design/frontend.md,
//    2.5). Z toho se staví menu i routy.
//  - `team/list` — **mapa týmů**. `match/list` vrací jen `homeTeamId`/`guestTeamId`; týmy
//    dotahuje pouze `match/get`. Každá dlaždice a řádek zápasu přitom potřebuje název
//    a logo, takže bez sdílené mapy by si ji každá obrazovka se seznamem zápasů skládala
//    zvlášť. Týmů jsou včetně soupeřů desítky, takže je to jeden malý dotaz.
//
// Načítá se paralelně: kategorie ani mapa týmů na sobě nezávisí a sériově by se čekání
// jen sečetlo. Pořadí kategorií z nastavení aplikuje server (`season/listCurrent`).

const [Context, useApp] = Utils.Context.create();

async function load() {
  const [seasonList, teamList, teamCategoryList] = await Promise.all([
    UiElements.Call.cmdGet("/season/listCurrent"),
    UiElements.Call.cmdGet("/team/list"),
    UiElements.Call.cmdGet("/category/list"),
  ]);

  return {
    categoryList: seasonList?.itemList ?? [],
    teamList: teamList?.itemList ?? [],
    teamCategoryList: teamCategoryList?.itemList ?? [],
  };
}

const AppProvider = createComponent({
  uu5Tag: Config.TAG + "AppProvider",

  render({ children }) {
    const dataObject = useDataObject({ handlerMap: { load } });
    const settings = UiApp.useSettings();
    // Doplněné o výchozí hodnoty z caio.config.js, stejně jako na serveru (app-settings/).
    const storedPublic = settings.app.public;
    const appSettings = useMemo(() => ({ ...Config.SETTINGS_DEFAULTS.public, ...storedPublic }), [storedPublic]);
    // Jednou načtené nastavení se už nečeká: `state` je pak "pending" jen při obnově a hodnoty
    // zůstávají.
    const settingsLoadedRef = useRef(false);
    if (settings.state === "ready") settingsLoadedRef.current = true;
    const settingsLoaded = settingsLoadedRef.current;

    const state =
      dataObject.state === "errorNoData" || (!settingsLoaded && settings.state === "error")
        ? "errorNoData"
        : dataObject.state === "pendingNoData" || !settingsLoaded
          ? "pendingNoData"
          : dataObject.state;
    // `useSettings` dává chybu samotnou, `useDataObject` ji balí do `{ error }`.
    const settingsError = !settingsLoaded && settings.errorData ? { error: settings.errorData } : undefined;
    const errorData = dataObject.errorData ?? settingsError;
    const { data } = dataObject;

    function retry() {
      if (dataObject.state === "errorNoData") dataObject.handlerMap.load();
      if (settings.state === "error") settings.reload().catch(() => {});
    }

    const value = useMemo(() => {
      const { categoryList = [], teamList = [], teamCategoryList = [] } = data ?? {};
      const teamMap = new Map(teamList.map((team) => [team.id, team]));
      const teamCategoryMap = new Map(teamCategoryList.map((category) => [category.code, category]));

      return {
        // Veřejná část nastavení klubu (`sys_settings.app.public`): `notice`, `contact`,
        // `socialList`, `founded`, `categoryOrder`, `hideNamesAgeList`, `fileCategoryList`.
        appSettings,
        categoryList,
        teamList,
        teamMap,
        // Tým podle id, nebo `undefined`. Volá se z každé dlaždice zápasu, takže se drží
        // v kontextu, ne aby si ho každá komponenta hledala v poli.
        getTeam: (id) => teamMap.get(id),
        // Kategorie týmu (`afk_category`) podle kódu. Pozor na jména: `categoryList` výš jsou
        // mužstva klubu v aktuálním ročníku (season/listCurrent), ne číselník kategorií.
        teamCategoryList,
        getCategory: (code) => teamCategoryMap.get(code),
        // Skrývají se u téhle kategorie jména? Filtruje sice server (jména mládeže nechodí
        // v API vůbec), ale klient to musí vědět taky, aby místo prázdného jména vykreslil
        // číslo dresu a post, ne prázdno.
        isNameHidden: (age) => (appSettings.hideNamesAgeList ?? []).includes(age),
        reload: () => dataObject.handlerMap.load(),
      };
    }, [data, dataObject, appSettings]);

    if (state === "pendingNoData") {
      return (
        <div className={Config.Css.css({ display: "flex", justifyContent: "center", padding: 64 })}>
          <Uu5Elements.Pending size="xl" />
        </div>
      );
    }

    // Bez nastavení a sezón nejde postavit menu ani routy, takže tady se opravdu nedá pokračovat.
    // Chybová obrazovka je proto celostránková, ne alert kdesi v rohu.
    if (state === "errorNoData") {
      return (
        <div className={Config.Css.css({ padding: 64, textAlign: "center", color: theme.color.mutedFg })}>
          <Uu5Elements.Text category="interface" segment="title" type="minor">
            Web se nepodařilo načíst.
          </Uu5Elements.Text>
          <div className={Config.Css.css({ marginBlockStart: 16 })}>
            <Uu5Elements.Button onClick={retry}>Zkusit znovu</Uu5Elements.Button>
          </div>
          {errorData ? (
            <pre className={Config.Css.css({ marginBlockStart: 24, fontSize: 12, opacity: 0.6 })}>
              {String(errorData.error?.message ?? errorData.error ?? "")}
            </pre>
          ) : null}
        </div>
      );
    }

    return <Context.Provider value={value}>{children}</Context.Provider>;
  },
});

export { AppProvider, useApp };
export default AppProvider;
