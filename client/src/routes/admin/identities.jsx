import { createVisualComponent, useDataObject, useLsi, useMemo } from "uu5g05";
import { UiAuth, UiElements } from "caio-ui";
import Config from "../../config/config.js";
import importLsi, { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../../admin/screen.jsx";
import { teamLabel } from "../../admin/fields.jsx";

// Identity a jejich role.
//
// Samotnou obrazovku dělá `UiAuth.IdentityList` z caio-ui: `authorities` je role
// **celého stacku** (caio-server ji má natvrdo u `identity/*` a `member/*`), takže správa
// rolí vypadá ve všech appkách stejně a nemá smysl ji psát v každé zvlášť. Tady zůstává
// jen to, co je vlastní klubu — **které role se dají přidělit**.
//
// Rozsahová role `teamEditor:<teamId>` se proto knihovně podává jako `scopeItemList`
// s názvy mužstev: id v seznamu rolí nikdo nepřečte a překlep v něm znamená tiše
// nefunkční oprávnění.

const ROLE_CODE_LIST = [
  Config.ROLE.OPERATIVES,
  Config.ROLE.MATCH_EDITOR,
  Config.ROLE.NEWS_EDITOR,
  Config.ROLE.GALLERY_EDITOR,
  Config.ROLE.CONTENT_EDITOR,
  Config.ROLE.MEMBERS,
];

const AdminIdentities = createVisualComponent({
  uu5Tag: Config.TAG + "AdminIdentities",

  render() {
    const roleLsi = useLsi(importLsi, ["enum", "role"]);

    // Mužstva jsou tu jen kvůli popiskům rozsahové role, takže chybějící seznam obrazovku
    // neblokuje -- role se pak zadá jako u kteréhokoli jiného kódu.
    const { data: teamData } = useDataObject(
      { handlerMap: { load: () => UiElements.Call.cmdGet("/team/list", {}) } },
      [],
    );

    const roleList = useMemo(() => {
      const list = ROLE_CODE_LIST.map((code) => ({ code, name: roleLsi[code] ?? code }));

      list.push({
        code: Config.ROLE.TEAM_EDITOR,
        name: roleLsi[Config.ROLE.TEAM_EDITOR] ?? Config.ROLE.TEAM_EDITOR,
        scopeItemList: (teamData?.itemList ?? []).map((team) => ({ value: team.id, children: teamLabel(team) })),
      });

      // `authorities` se nepřidává: doplní ji caio-ui sama.
      return list;
    }, [roleLsi, teamData]);

    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "identities", "header")}>
        <UiAuth.IdentityList roleList={roleList} header={null} nestingLevel="area" />
      </AdminScreen>
    );
  },
});

export default AdminIdentities;
