import { createVisualComponent, useDataList, useDataObject, useLsi, useMemo, useState, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import importLsi, { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../../admin/screen.jsx";
import { teamLabel } from "../../admin/fields.jsx";

const { theme } = Config;

// Identity a jejich role.
//
// Identity se **nezakládají ani nemažou** z administrace: vznikají přihlášením (Google,
// Facebook, e-mail) a mazání účtu je věc člověka, ne správce. Jediné, co se tu dělá, je
// **přiřazení rolí** — proto vlastní tabulka místo `UiElements.Crud`, který je stavěný na
// plný CRUD.
//
// Rozsahová role `teamEditor:<teamId>` se ukazuje jako **název týmu**, ne holé id: id
// v seznamu rolí nikdo nepřečte a překlep v něm znamená tiše nefunkční oprávnění.

const ROLE_LIST = [
  Config.ROLE.AUTHORITIES,
  Config.ROLE.OPERATIVES,
  Config.ROLE.MATCH_EDITOR,
  Config.ROLE.NEWS_EDITOR,
  Config.ROLE.GALLERY_EDITOR,
  Config.ROLE.CONTENT_EDITOR,
  Config.ROLE.MEMBERS,
];

const TEAM_PREFIX = Config.ROLE.TEAM_EDITOR + ":";

function RoleModal({ item, teamMap, onClose, onSave }) {
  const plain = (item.profileList ?? []).filter((p) => !p.startsWith(TEAM_PREFIX));
  const teams = (item.profileList ?? []).filter((p) => p.startsWith(TEAM_PREFIX)).map((p) => p.slice(TEAM_PREFIX.length));

  const [profileList, setProfileList] = useState(plain);
  const [teamIdList, setTeamIdList] = useState(teams);
  const [pending, setPending] = useState(false);

  const roleItemList = ROLE_LIST.map((role) => ({
    value: role,
    children: <Lsi import={importLsi} path={["enum", "role", role]} />,
  }));

  const teamItemList = useMemo(
    () => [...teamMap.values()].map((team) => ({ value: team.id, children: teamLabel(team) })),
    [teamMap],
  );

  async function save() {
    setPending(true);
    try {
      await onSave([...profileList, ...teamIdList.map((id) => TEAM_PREFIX + id)]);
      onClose();
    } finally {
      setPending(false);
    }
  }

  return (
    <Uu5Elements.Modal
      open
      onClose={onClose}
      header={<Lsi import={importLsi} path={["admin", "identities", "roleHeader"]} params={{ name: item.name ?? item.email }} />}
      footer={
        <div className={Config.Css.css({ display: "flex", gap: 8, justifyContent: "end" })}>
          <Uu5Elements.Button onClick={onClose} disabled={pending}>
            <Lsi import={importLsi} path={["admin", "identities", "cancel"]} />
          </Uu5Elements.Button>
          <Uu5Elements.Button colorScheme="primary" significance="highlighted" onClick={save} disabled={pending}>
            <Lsi import={importLsi} path={["admin", "identities", "save"]} />
          </Uu5Elements.Button>
        </div>
      }
    >
      <Uu5Elements.Grid rowGap={16}>
        <Uu5Forms.Checkboxes
          label={<Lsi import={importLsi} path={["admin", "field", "profileList"]} />}
          value={profileList}
          itemList={roleItemList}
          onChange={(e) => setProfileList(e.data.value)}
        />

        <Uu5Forms.Select
          label={<Lsi import={importLsi} path={["admin", "identities", "teamEditor"]} />}
          value={teamIdList}
          itemList={teamItemList}
          multiple
          onChange={(e) => setTeamIdList(e.data.value ?? [])}
        />

        <Uu5Elements.Text
          category="interface"
          segment="content"
          type="medium"
          className={Config.Css.css({ color: theme.color.mutedFg })}
        >
          <Lsi import={importLsi} path={["admin", "identities", "hint"]} />
        </Uu5Elements.Text>
      </Uu5Elements.Grid>
    </Uu5Elements.Modal>
  );
}

const AdminIdentities = createVisualComponent({
  uu5Tag: Config.TAG + "AdminIdentities",

  render() {
    const [editItem, setEditItem] = useState();

    const identityList = useDataList({
      handlerMap: { load: () => UiElements.Call.cmdGet("/identity/adminList", {}) },
      itemHandlerMap: { update: (dtoIn) => UiElements.Call.cmdPost("/identity/update", dtoIn) },
    });

    const { data: teamData } = useDataObject({ handlerMap: { load: () => UiElements.Call.cmdGet("/team/list", {}) } }, []);
    const teamMap = useMemo(
      () => new Map((teamData?.itemList ?? []).map((team) => [team.id, team])),
      [teamData],
    );

    const rows = (identityList.data ?? []).filter(Boolean);
    const roleLsi = useLsi(importLsi, ["enum", "role"]);

    // Role se ukazuje česky, a rozsahová i s **názvem týmu**: `teamEditor:6a9d…` nikdo
    // nepřečte. Neznámý kód (role, kterou zavedl někdo v databázi) se vypíše, jak je —
    // schovat ho by znamenalo tvrdit, že tam není.
    function roleLabel(profile) {
      if (!profile.startsWith(TEAM_PREFIX)) return roleLsi[profile] ?? profile;
      const team = teamMap.get(profile.slice(TEAM_PREFIX.length));
      return `${roleLsi.teamEditor ?? Config.ROLE.TEAM_EDITOR}: ${team ? teamLabel(team) : profile.slice(TEAM_PREFIX.length)}`;
    }

    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "identities", "header")}>
        {identityList.state === "pendingNoData" ? (
          <Uu5Elements.Skeleton height={240} />
        ) : (
          <Uu5Elements.Grid rowGap={8}>
            {rows.map((row) => (
              // Řádek seznamu je `Box`, ne vlastní rámeček: `significance="subdued"` je
              // z GDS plocha s linkou a bez stínu, tedy totéž, co dělá `Card` o úroveň výš.
              <Uu5Elements.Box
                key={row.data.id}
                significance="subdued"
                borderRadius="moderate"
                className={Config.Css.css({
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                  padding: 12,
                })}
              >
                <div className={Config.Css.css({ minInlineSize: 200, flexGrow: 1 })}>
                  <div className={Config.Css.css({ ...theme.typography.display, fontSize: 16 })}>
                    {row.data.name || row.data.email}
                  </div>
                  <Uu5Elements.Text
                    category="interface"
                    segment="content"
                    type="medium"
                    className={Config.Css.css({ color: theme.color.mutedFg })}
                  >
                    {row.data.email} · {row.data.identity}
                  </Uu5Elements.Text>
                </div>

                <div className={Config.Css.css({ display: "flex", gap: 6, flexWrap: "wrap" })}>
                  {(row.data.profileList ?? []).map((profile) => (
                    <Uu5Elements.Tag key={profile} colorScheme="primary" significance="distinct" size="s">
                      {roleLabel(profile)}
                    </Uu5Elements.Tag>
                  ))}
                </div>

                <Uu5Elements.Button
                  icon="uugds-pencil"
                  significance="subdued"
                  colorScheme="building"
                  disabled={row.state === "pending"}
                  onClick={() => setEditItem(row)}
                />
              </Uu5Elements.Box>
            ))}
          </Uu5Elements.Grid>
        )}

        {editItem ? (
          <RoleModal
            item={editItem.data}
            teamMap={teamMap}
            onClose={() => setEditItem()}
            onSave={(profileList) => editItem.handlerMap.update({ id: editItem.data.id, profileList })}
          />
        ) : null}
      </AdminScreen>
    );
  },
});

export default AdminIdentities;
