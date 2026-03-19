import { createVisualComponent, useState, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "./config/config.js";
import OcAuth from "../../libs/oc_cli-auth";
import FormIdentitySelect from "../components/form-identity-select.js";
import ParticipantSection from "../participant/participant-section.js";
import GroupMatches from "../components/group-matches.js";
import PlayoffSection from "../components/playoff-section.js";
import { useTournamentDetail } from "./tournament-detail-context.js";
import { useParticipantList } from "../participant/participant-context.js";

const TYPE_MAP = {
  football: "Fotbal",
  "ping-pong": "Ping-pong",
  darts: "Šipky",
  nohejbal: "Nohejbal",
};

const TYPE_ITEM_LIST = Object.entries(TYPE_MAP).map(([value, children]) => ({ value, children }));

function isAuthoritiesProfile(identity) {
  return identity?.profileList?.includes("authorities");
}

function isOperator(data, identity) {
  if (!identity) return false;
  if (isAuthoritiesProfile(identity)) return true;
  return data?.operativeList?.includes(identity.identity) || data?.createdBy === identity.identity;
}

function isReferee(data, identity) {
  if (!identity) return false;
  if (isOperator(data, identity)) return true;
  return data?.refereeList?.includes(identity.identity);
}

function getGroupList(groupCount) {
  const list = [];
  for (let i = 0; i < (groupCount || 1); i++) {
    list.push(String.fromCharCode(65 + i));
  }
  return list;
}

const TournamentDetailView = createVisualComponent({
  uu5Tag: Config.TAG + "TournamentDetailView",

  render(props) {
    const { id } = props;
    const session = OcAuth.useSession();
    const [editOpen, setEditOpen] = useState(false);
    const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

    const dto = useTournamentDetail();
    const participantList = useParticipantList();

    if (dto.state === "pendingNoData") {
      return <Uu5Elements.Pending size="xl" />;
    }

    if (dto.state === "errorNoData") {
      return (
        <Uu5Elements.PlaceholderBox
          code="error"
          header={<Lsi lsi={{ cs: "Turnaj nenalezen" }} />}
          info={<Lsi lsi={{ cs: "Turnaj s tímto ID nebyl nalezen." }} />}
        />
      );
    }

    const { data } = dto;
    const isAuth = isAuthoritiesProfile(session.identity);
    const canManage = isOperator(data, session.identity);
    const canRef = isReferee(data, session.identity);
    const isCreated = data.state === "created";
    const isRun = data.state === "run";
    const isPlayOff = data.state === "playOff";
    const isCompleted = data.state === "completed";
    const isFinal = data.state === "final";
    const showGroups = isRun || isPlayOff || isCompleted || isFinal;
    const showPlayoff = isPlayOff || isCompleted || isFinal;
    const showFinalStandings = isCompleted || isFinal;

    const participants = (participantList?.data || []).map((d) => d.data || d);
    const allAssigned = participants.length > 0 && participants.every((p) => p.group && p.seed != null && p.seed > 0);

    const actionList = [];
    if (canManage && isCreated) {
      actionList.push({
        icon: "uugds-pencil",
        children: <Lsi lsi={{ cs: "Upravit turnaj" }} />,
        onClick: () => setEditOpen(true),
      });
    }

    if (canManage && isCreated && allAssigned) {
      actionList.push({
        icon: "uugds-calendar",
        children: <Lsi lsi={{ cs: "Generovat zápasy" }} />,
        colorScheme: "positive",
        onClick: async () => {
          await dto.handlerMap.generateMatches();
          dto.handlerMap.load();
          if (participantList?.handlerMap?.load) participantList.handlerMap.load();
        },
      });
    }

    if (canManage && isRun) {
      actionList.push({
        icon: "uugds-plus-circle",
        children: <Lsi lsi={{ cs: "Generovat play-off" }} />,
        colorScheme: "positive",
        onClick: async () => {
          await dto.handlerMap.generatePlayoff();
          dto.handlerMap.load();
        },
      });
    }

    if (canManage && isPlayOff) {
      actionList.push({
        icon: "uugds-check",
        children: <Lsi lsi={{ cs: "Vyhodnocení" }} />,
        colorScheme: "positive",
        onClick: async () => {
          await dto.handlerMap.evaluate();
          dto.handlerMap.load();
        },
      });
    }

    if (isAuth && isCompleted) {
      actionList.push({
        icon: "uugds-lock-closed",
        children: <Lsi lsi={{ cs: "Uzavřít" }} />,
        colorScheme: "negative",
        onClick: () => setCloseConfirmOpen(true),
      });
    }

    const groupList = getGroupList(data.groupCount);

    return (
      <>
        <Uu5Elements.Block
          headerType="heading"
          header={data.name}
          actionList={actionList.length > 0 ? actionList : undefined}
        >
          <Uu5Elements.InfoGroup
            itemList={[
              { icon: "uugdsstencil-commerce-tag", title: data.type ? TYPE_MAP[data.type] || data.type : "-", subtitle: "Typ" },
              data.date
                ? { icon: "uugds-calendar", title: <Uu5Elements.DateTime value={data.date} timeFormat="none" />, subtitle: "Datum" }
                : null,
              data.place
                ? { icon: "uugds-mapmarker", title: data.place, subtitle: "Místo" }
                : null,
              { icon: "uugds-info", title: data.state || "created", subtitle: "Stav" },
            ].filter(Boolean)}
          />

          {data.desc && (
            <>
              <Uu5Elements.Line significance="subdued" margin={{ top: 8, bottom: 8 }} />
              <Uu5Elements.Text>{data.desc}</Uu5Elements.Text>
            </>
          )}
        </Uu5Elements.Block>

        {(canManage || isCreated) && (
          <div className={Config.Css.css({ marginBlockStart: 24 })}>
            <ParticipantSection
              groupCount={data.groupCount}
              readOnly={!canManage || !isCreated}
            />
          </div>
        )}

        {showGroups && groupList.length > 0 && (
          <div className={Config.Css.css({ marginBlockStart: 24 })}>
            <Uu5Elements.Tabs
              itemList={groupList.map((g) => ({
                label: <Lsi lsi={{ cs: `Skupina ${g}` }} />,
                children: (
                  <GroupMatches
                    tournamentId={id}
                    group={g}
                    participants={participants}
                    canSetResult={canRef && isRun}
                    showStandings={isPlayOff || isCompleted || isFinal}
                  />
                ),
              }))}
            />
          </div>
        )}

        {showPlayoff && (
          <div className={Config.Css.css({ marginBlockStart: 24 })}>
            <PlayoffSection
              tournamentId={id}
              participants={participants}
              canSetResult={canRef && isPlayOff}
            />
          </div>
        )}

        {showFinalStandings && data.finalStandings?.length > 0 && (
          <div className={Config.Css.css({ marginBlockStart: 24 })}>
            <Uu5Elements.Block headerType="heading" header={<Lsi lsi={{ cs: "Celkové umístění" }} />}>
              <table className={Config.Css.css({ width: "100%", borderCollapse: "collapse", "& th, & td": { padding: "6px 10px", borderBottom: "1px solid #ddd", textAlign: "left" } })}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th><Lsi lsi={{ cs: "Název" }} /></th>
                  </tr>
                </thead>
                <tbody>
                  {data.finalStandings.map((s, idx) => (
                    <tr key={s.participantId || idx}>
                      <td>{s.shared ? `${s.position}.–` : `${s.position}.`}</td>
                      <td>{s.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Uu5Elements.Block>
          </div>
        )}

        {editOpen && (
          <Uu5Forms.Form.Provider
            key="edit"
            onSubmit={async (e) => {
              const { sys, ...submitData } = e.data.value;
              const update = {};
              for (const k in submitData) {
                if (submitData[k] !== data[k]) update[k] = submitData[k];
              }
              if (Object.keys(update).length > 0) {
                await dto.handlerMap.update(update);
              }
              setEditOpen(false);
            }}
            initialValue={{
              name: data.name,
              type: data.type,
              date: data.date,
              place: data.place,
              desc: data.desc,
              groupCount: data.groupCount,
              advanceFromGroup: data.advanceFromGroup,
              operativeList: data.operativeList || [],
              refereeList: data.refereeList || [],
            }}
          >
            <Uu5Elements.Modal
              open
              onClose={() => setEditOpen(false)}
              header={<Lsi lsi={{ cs: "Upravit turnaj" }} />}
              footer={
                <Uu5Elements.Grid
                  templateColumns={{ xs: "1fr 1fr", s: "auto auto" }}
                  columnGap={8}
                  justifyContent={{ s: "end" }}
                >
                  <Uu5Forms.CancelButton onClick={() => setEditOpen(false)} />
                  <Uu5Forms.SubmitButton icon="uugds-check" />
                </Uu5Elements.Grid>
              }
            >
              <Uu5Forms.Form.View
                gridLayout={{
                  xs: "name, type, date, place, desc, groupCount, advanceFromGroup, operativeList, refereeList",
                  s: "name type, date place, desc desc, groupCount advanceFromGroup, operativeList operativeList, refereeList refereeList",
                }}
              >
                <Uu5Forms.FormText name="name" label={{ cs: "Název" }} required />
                <Uu5Forms.FormSelect name="type" label={{ cs: "Typ" }} itemList={TYPE_ITEM_LIST} required />
                <Uu5Forms.FormDate name="date" label={{ cs: "Datum" }} />
                <Uu5Forms.FormText name="place" label={{ cs: "Místo" }} />
                <Uu5Forms.FormTextArea name="desc" label={{ cs: "Popis" }} />
                <Uu5Forms.FormNumber name="groupCount" label={{ cs: "Počet skupin" }} min={1} />
                <Uu5Forms.FormNumber name="advanceFromGroup" label={{ cs: "Postup ze skupiny" }} min={1} />
                <FormIdentitySelect name="operativeList" label={{ cs: "Operátoři" }} />
                <FormIdentitySelect name="refereeList" label={{ cs: "Rozhodčí" }} />
              </Uu5Forms.Form.View>
            </Uu5Elements.Modal>
          </Uu5Forms.Form.Provider>
        )}

        <Uu5Elements.Dialog
          open={closeConfirmOpen}
          onClose={() => setCloseConfirmOpen(false)}
          header={<Lsi lsi={{ cs: "Uzavřít turnaj" }} />}
          icon={<Uu5Elements.Svg code="uugdssvg-svg-document-check" />}
          info={<Lsi lsi={{ cs: "Opravdu chcete uzavřít turnaj? Tato akce je nevratná a žádné další úpravy nebudou možné." }} />}
          actionDirection="horizontal"
          actionList={[
            {
              children: <Lsi lsi={{ cs: "Zrušit" }} />,
              onClick: () => setCloseConfirmOpen(false),
            },
            {
              children: <Lsi lsi={{ cs: "Uzavřít" }} />,
              colorScheme: "negative",
              significance: "highlighted",
              onClick: async () => {
                setCloseConfirmOpen(false);
                await dto.handlerMap.close();
                dto.handlerMap.load();
              },
            },
          ]}
        />
      </>
    );
  },
});

export { TournamentDetailView };
export default TournamentDetailView;
