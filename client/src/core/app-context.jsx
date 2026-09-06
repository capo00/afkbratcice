import { createComponent, useDataObject, useMemo, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";

const { theme } = Config;

// Konfigurace, kategorie a mapa týmů — jednou při startu SPA, pak z kontextu.
//
// Tři dotazy, protože každý odpovídá na jinou otázku:
//
//  - `appConfig/get` — co redakce nastavila za běhu (proužek s upozorněním, kontakt,
//    pořadí kategorií, kde skrývat jména).
//  - `season/listCurrent` — **které kategorie klub letos má**. Nejsou nikde vyjmenované;
//    odvozují se ze sezón, protože složení mužstev se mění rok od roku (design/frontend.md,
//    2.5). Z toho se staví menu i routy.
//  - `team/list` — **mapa týmů**. `match/list` vrací jen `homeTeamId`/`guestTeamId`; týmy
//    dotahuje pouze `match/get`. Každá dlaždice a řádek zápasu přitom potřebuje název
//    a logo, takže bez sdílené mapy by si ji každá obrazovka se seznamem zápasů skládala
//    zvlášť. Týmů jsou včetně soupeřů desítky, takže je to jeden malý dotaz.
//
// Načítá se paralelně: kategorie ani mapa týmů na sobě nezávisí a sériově by se čekání
// jen sečetlo.

const [Context, useApp] = Utils.Context.create();

async function load() {
  const [appConfig, seasonList, teamList] = await Promise.all([
    UiElements.Call.cmdGet("/appConfig/get"),
    UiElements.Call.cmdGet("/season/listCurrent"),
    UiElements.Call.cmdGet("/team/list"),
  ]);

  return {
    appConfig,
    categoryList: seasonList?.itemList ?? [],
    teamList: teamList?.itemList ?? [],
  };
}

const AppProvider = createComponent({
  uu5Tag: Config.TAG + "AppProvider",

  render({ children }) {
    const dataObject = useDataObject({ handlerMap: { load } });
    const { state, data, errorData } = dataObject;

    const value = useMemo(() => {
      const { appConfig, categoryList = [], teamList = [] } = data ?? {};
      const teamMap = new Map(teamList.map((team) => [team.id, team]));

      return {
        appConfig: appConfig ?? {},
        categoryList,
        teamList,
        teamMap,
        // Tým podle id, nebo `undefined`. Volá se z každé dlaždice zápasu, takže se drží
        // v kontextu, ne aby si ho každá komponenta hledala v poli.
        getTeam: (id) => teamMap.get(id),
        // Skrývají se u téhle kategorie jména? Filtruje sice server (jména mládeže nechodí
        // v API vůbec), ale klient to musí vědět taky, aby místo prázdného jména vykreslil
        // číslo dresu a post, ne prázdno.
        isNameHidden: (age) => (appConfig?.hideNamesAgeList ?? []).includes(age),
        reload: () => dataObject.handlerMap.load(),
      };
    }, [data, dataObject]);

    if (state === "pendingNoData") {
      return (
        <div className={Config.Css.css({ display: "flex", justifyContent: "center", padding: 64 })}>
          <Uu5Elements.Pending size="xl" />
        </div>
      );
    }

    // Bez konfigurace nejde postavit menu ani routy, takže tady se opravdu nedá pokračovat.
    // Chybová obrazovka je proto celostránková, ne alert kdesi v rohu.
    if (state === "errorNoData") {
      return (
        <div className={Config.Css.css({ padding: 64, textAlign: "center", color: theme.color.mutedFg })}>
          <Uu5Elements.Text category="interface" segment="title" type="minor">
            Web se nepodařilo načíst.
          </Uu5Elements.Text>
          <div className={Config.Css.css({ marginBlockStart: 16 })}>
            <Uu5Elements.Button onClick={() => dataObject.handlerMap.load()}>Zkusit znovu</Uu5Elements.Button>
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
