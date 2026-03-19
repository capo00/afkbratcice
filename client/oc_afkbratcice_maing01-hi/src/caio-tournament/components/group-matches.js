import { createVisualComponent, useDataList, useState, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "./config/config.js";
import { Call } from "../../libs/oc_cli-elements/call.js";

const GroupMatches = createVisualComponent({
  uu5Tag: Config.TAG + "GroupMatches",

  render(props) {
    const { tournamentId, group, participants, canSetResult, showStandings } = props;
    const [editMatch, setEditMatch] = useState(null);

    const matchList = useDataList({
      handlerMap: {
        load: () => Call.cmdGet("caio-tournament/match/list", { tournamentId, group, phase: "group" }),
      },
      itemIdentifier: "id",
    });

    const standingsDto = useDataList({
      handlerMap: {
        load: showStandings
          ? () => Call.cmdGet("caio-tournament/tournament/listStandings", { tournamentId, group })
          : async () => ({ itemList: [] }),
      },
      itemIdentifier: "id",
    });

    const participantMap = {};
    (participants || []).forEach((p) => {
      participantMap[p.data?.id || p.id || p._id] = p.data || p;
    });

    const getName = (id) => {
      const idStr = id?.toString?.() || id;
      return participantMap[idStr]?.name || idStr || "?";
    };

    if (matchList.state === "pendingNoData") {
      return <Uu5Elements.Pending size="l" />;
    }

    const matches = (matchList.data || []).map((d) => d.data || d);

    return (
      <div>
        {showStandings && standingsDto.data?.length > 0 && (
          <Uu5Elements.Block
            headerType="title"
            header={<Lsi lsi={{ cs: `Pořadí – skupina ${group}` }} />}
            className={Config.Css.css({ marginBlockEnd: 16 })}
          >
            <table className={Config.Css.css({ width: "100%", borderCollapse: "collapse", "& th, & td": { padding: "4px 8px", borderBottom: "1px solid #ddd", textAlign: "left" } })}>
              <thead>
                <tr>
                  <th>#</th>
                  <th><Lsi lsi={{ cs: "Název" }} /></th>
                  <th>Z</th>
                  <th>V</th>
                  <th>R</th>
                  <th>P</th>
                  <th><Lsi lsi={{ cs: "Skóre" }} /></th>
                  <th>+/-</th>
                  <th><Lsi lsi={{ cs: "Body" }} /></th>
                </tr>
              </thead>
              <tbody>
                {standingsDto.data.map((item, idx) => {
                  const s = (item.data || item).stats || {};
                  return (
                    <tr key={(item.data || item).id}>
                      <td>{idx + 1}</td>
                      <td>{(item.data || item).name}</td>
                      <td>{s.played || 0}</td>
                      <td>{s.wins || 0}</td>
                      <td>{s.draws || 0}</td>
                      <td>{s.losses || 0}</td>
                      <td>{`${s.scored || 0}:${s.conceded || 0}`}</td>
                      <td>{(s.scored || 0) - (s.conceded || 0)}</td>
                      <td><strong>{s.points || 0}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Uu5Elements.Block>
        )}

        <Uu5Elements.Block
          headerType="title"
          header={<Lsi lsi={{ cs: `Zápasy – skupina ${group}` }} />}
        >
          {matches.length === 0 ? (
            <Uu5Elements.Text><Lsi lsi={{ cs: "Žádné zápasy" }} /></Uu5Elements.Text>
          ) : (
            <table className={Config.Css.css({ width: "100%", borderCollapse: "collapse", "& th, & td": { padding: "6px 10px", borderBottom: "1px solid #ddd", textAlign: "center" } })}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}><Lsi lsi={{ cs: "Domácí" }} /></th>
                  <th><Lsi lsi={{ cs: "Skóre" }} /></th>
                  <th style={{ textAlign: "right" }}><Lsi lsi={{ cs: "Hosté" }} /></th>
                  <th><Lsi lsi={{ cs: "Stav" }} /></th>
                  {canSetResult && <th />}
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={m.id}>
                    <td style={{ textAlign: "left" }}>{getName(m.homeParticipantId)}</td>
                    <td>
                      {m.status === "played"
                        ? `${m.score?.home ?? "-"}:${m.score?.away ?? "-"}`
                        : "-:-"
                      }
                    </td>
                    <td style={{ textAlign: "right" }}>{getName(m.awayParticipantId)}</td>
                    <td>{m.status === "played" ? <Lsi lsi={{ cs: "Odehráno" }} /> : <Lsi lsi={{ cs: "Plánováno" }} />}</td>
                    {canSetResult && (
                      <td>
                        <Uu5Elements.Button
                          icon="uugds-pencil"
                          size="s"
                          onClick={() => setEditMatch(m)}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Uu5Elements.Block>

        {editMatch && (
          <Uu5Forms.Form.Provider
            key={editMatch.id}
            onSubmit={async (e) => {
              const { home, away } = e.data.value;
              await Call.cmdPost("caio-tournament/match/setResult", { id: editMatch.id, home: Number(home), away: Number(away) });
              setEditMatch(null);
              matchList.handlerMap.load();
              if (standingsDto.handlerMap?.load) standingsDto.handlerMap.load();
            }}
          >
            <Uu5Elements.Modal
              open
              onClose={() => setEditMatch(null)}
              header={
                <Lsi lsi={{ cs: `${getName(editMatch.homeParticipantId)} vs ${getName(editMatch.awayParticipantId)}` }} />
              }
              footer={
                <Uu5Elements.Grid
                  templateColumns={{ xs: "1fr 1fr", s: "auto auto" }}
                  columnGap={8}
                  justifyContent={{ s: "end" }}
                >
                  <Uu5Forms.CancelButton onClick={() => setEditMatch(null)} />
                  <Uu5Forms.SubmitButton icon="uugds-check" />
                </Uu5Elements.Grid>
              }
            >
              <Uu5Forms.Form.View gridLayout={{ xs: "home, away", s: "home away" }}>
                <Uu5Forms.FormNumber
                  name="home"
                  label={{ cs: getName(editMatch.homeParticipantId) }}
                  min={0}
                  required
                  initialValue={editMatch.score?.home}
                />
                <Uu5Forms.FormNumber
                  name="away"
                  label={{ cs: getName(editMatch.awayParticipantId) }}
                  min={0}
                  required
                  initialValue={editMatch.score?.away}
                />
              </Uu5Forms.Form.View>
            </Uu5Elements.Modal>
          </Uu5Forms.Form.Provider>
        )}
      </div>
    );
  },
});

export { GroupMatches };
export default GroupMatches;
