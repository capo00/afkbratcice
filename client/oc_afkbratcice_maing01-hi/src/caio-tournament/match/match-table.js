import { createVisualComponent, useState, Lsi, useScreenSize } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Uu5TilesElements from "uu5tilesg02-elements";
import Config from "../components/config/config.js";
import { useParticipantList } from "../participant/participant-context.js";

const MatchTable = createVisualComponent({
  uu5Tag: Config.TAG + "MatchTable",

  render(props) {
    const { isReferee, itemList, disableRowCounter, onResultChange, ...restProps } = props;
    const [editMatch, setEditMatch] = useState(null);

    const [screenSize] = useScreenSize();
    const isSmall = screenSize === "xs";

    const participantList = useParticipantList();

    const participantMap = {};
    (participantList?.data ?? []).forEach((p) => {
      participantMap[p.data?.id] = p.data;
    });

    const getName = (id) => {
      return participantMap[id]?.name || id || "?";
    };

    return (
      <>
        {itemList?.length === 0 ? (
          <Lsi lsi={{ cs: "Žádné zápasy" }} />
        ) : (
          <Uu5TilesElements.Table
            {...restProps}
            data={itemList}
            columnList={[
              isSmall || disableRowCounter ? undefined : {
                header: "#",
                value: "id",
                cell: (_, { rowIndex }) => rowIndex + 1 + ".",
                cellComponent: <Uu5TilesElements.Table.Cell horizontalAlignment="right" />,
                minWidth: "max-content",
                maxWidth: "max-content",
              },
              {
                header: <Lsi lsi={{ cs: "Domácí" }} />,
                value: "homeParticipantId",
                cell: ({ data }) => {
                  const name = getName(data.data.homeParticipantId);
                  return data.data.score?.home > data.data.score?.away ? <b>{name}</b> : name;
                },
                cellComponent: <Uu5TilesElements.Table.Cell horizontalAlignment="right" />,
              },
              {
                header: <Lsi lsi={{ cs: "Skóre" }} />,
                value: "score",
                cell: ({ data }) => `${data.data.score?.home ?? "-"} : ${data.data.score?.away ?? "-"}`,
                cellComponent: <Uu5TilesElements.Table.Cell horizontalAlignment="center" />,
                minWidth: "max-content",
                maxWidth: "max-content",
              },
              {
                header: <Lsi lsi={{ cs: "Hosté" }} />,
                value: "awayParticipantId",
                cell: ({ data }) => {
                  const name = getName(data.data.awayParticipantId);
                  return data.data.score?.away > data.data.score?.home ? <b>{name}</b> : name;
                },
              },
            ].filter(Boolean)}
            getActionList={isReferee ? ({ data }) => {
              return [
                {
                  collapsedChildren: <Lsi lsi={{ cs: "Upravit" }} />,
                  icon: "uugds-pencil",
                  onClick: () => setEditMatch(data),
                  disabled: data.state === "pending",
                },
              ]
            } : undefined}
            hideHeader
            spacing={isReferee ? "tight" : undefined}
            verticalAlignment="center"
          />
        )}

        {editMatch && (
          <Uu5Forms.Form.Provider
            key={editMatch.data.id}
            onSubmit={async (e) => {
              const { home, away } = e.data.value;
              const match = await editMatch.handlerMap.setResult({ home: Number(home), away: Number(away) });
              onResultChange?.(match);
              setEditMatch(null);
            }}
          >
            <Uu5Elements.Modal
              open
              onClose={() => setEditMatch(null)}
              header={
                <Lsi lsi={{ cs: `${getName(editMatch.data.homeParticipantId)} vs ${getName(editMatch.data.awayParticipantId)}` }} />
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
                  label={{ cs: getName(editMatch.data.homeParticipantId) }}
                  min={0}
                  required
                  initialValue={editMatch.data.score?.home ?? undefined}
                  autoFocus
                />
                <Uu5Forms.FormNumber
                  name="away"
                  label={{ cs: getName(editMatch.data.awayParticipantId) }}
                  min={0}
                  required
                  initialValue={editMatch.data.score?.away ?? undefined}
                />
              </Uu5Forms.Form.View>
            </Uu5Elements.Modal>
          </Uu5Forms.Form.Provider>
        )}
      </>
    );
  },
});

export { MatchTable };
export default MatchTable;
