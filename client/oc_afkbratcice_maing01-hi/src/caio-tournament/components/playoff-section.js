import { createVisualComponent, useDataList, useState, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "./config/config.js";
import { Call } from "../../libs/oc_cli-elements/call.js";

const PHASE_LABELS = {
  quarter: { cs: "Čtvrtfinále" },
  semi: { cs: "Semifinále" },
  thirdPlace: { cs: "O 3. místo" },
  final: { cs: "Finále" },
};

const PlayoffSection = createVisualComponent({
  uu5Tag: Config.TAG + "PlayoffSection",

  render(props) {
    const { tournamentId, participants, canSetResult } = props;
    const [editMatch, setEditMatch] = useState(null);

    const matchList = useDataList({
      handlerMap: {
        load: () => Call.cmdGet("caio-tournament/tournament/playoff", { tournamentId }),
      },
      itemIdentifier: "id",
    });

    const participantMap = {};
    (participants || []).forEach((p) => {
      const item = p.data || p;
      participantMap[item.id || item._id] = item;
    });

    const getName = (id) => {
      if (!id) return "?";
      const idStr = id?.toString?.() || id;
      return participantMap[idStr]?.name || idStr;
    };

    if (matchList.state === "pendingNoData") {
      return <Uu5Elements.Pending size="l" />;
    }

    const matches = (matchList.data || []).map((d) => d.data || d);
    const byPhase = {};
    matches.forEach((m) => {
      byPhase[m.phase] = byPhase[m.phase] || [];
      byPhase[m.phase].push(m);
    });

    const phaseOrder = ["quarter", "semi", "thirdPlace", "final"];

    return (
      <Uu5Elements.Block headerType="heading" header={<Lsi lsi={{ cs: "Play-off" }} />}>
        {phaseOrder.map((phase) => {
          const phaseMatches = byPhase[phase];
          if (!phaseMatches || phaseMatches.length === 0) return null;
          return (
            <Uu5Elements.Block
              key={phase}
              headerType="title"
              header={<Lsi lsi={PHASE_LABELS[phase] || { cs: phase }} />}
              className={Config.Css.css({ marginBlockEnd: 16 })}
            >
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
                  {phaseMatches.map((m) => {
                    return (
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
                    );
                  })}
                </tbody>
              </table>
            </Uu5Elements.Block>
          );
        })}

        {editMatch && (
          <Uu5Forms.Form.Provider
            key={editMatch.id}
            onSubmit={async (e) => {
              const { home, away } = e.data.value;
              await Call.cmdPost("caio-tournament/match/setResult", { id: editMatch.id, home: Number(home), away: Number(away) });
              setEditMatch(null);
              matchList.handlerMap.load();
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
      </Uu5Elements.Block>
    );
  },
});

export { PlayoffSection };
export default PlayoffSection;
