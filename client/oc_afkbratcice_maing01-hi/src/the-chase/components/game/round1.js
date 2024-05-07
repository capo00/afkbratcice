//@@viewOn:imports
import {
  createVisualComponent,
  Environment,
  useDataObject,
  useEffect,
  useRoute,
  useState,
  useUpdateEffect,
} from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Extras from "uu5extrasg01";
import Config from "../../config/config";
import Round1Calls from "../../calls/round1-calls";
import { useGame } from "../../contexts/game-context";
import { usePlayerList } from "../../contexts/player-list-context";
import Cover from "../cover";
import Button from "../button";
import FastQuestions from "./fast-questions";
//@@viewOff:imports

//@@viewOn:helpers
function PlayersBar({ playerList, gameId }) {
  const [info, setInfo] = useState();
  const [route] = useRoute();

  return (
    <>
      <div
        className={Config.Css.css({
          display: "grid",
          gridTemplateColumns: `repeat(${playerList.length}, 1fr)`,
          gap: 16,
        })}
      >
        {playerList.map(({ id, name, amount, active }, i) => (
          <Uu5Elements.Text key={id} category="interface" segment="title" type="common">
            {({ style }) => (
              <Uu5Elements.Box
                shape="background"
                significance="highlighted"
                colorScheme={!active && amount === 0 ? "building" : "light-blue"}
                borderRadius="moderate"
                className={Config.Css.css({
                  padding: 16,
                  display: "inline-flex",
                  flexDirection: "column",
                  gap: 8,
                  alignItems: "center",
                  minWidth: 96,
                  ...style,
                })}
                disabled={!active}
                onClick={() => {
                  const url = new URL(route.uu5Route, Environment.appBaseUri);
                  url.searchParams.set("gameId", gameId);
                  url.searchParams.set("id", id);
                  setInfo({ ...playerList[i], url: url.toString() });
                }}
              >
                {active ? <b>{name}</b> : <span>{name}</span>}
                <Uu5Elements.Number value={amount ?? 0} />
              </Uu5Elements.Box>
            )}
          </Uu5Elements.Text>
        ))}
      </div>
      <Uu5Elements.Modal open={!!info} onClose={() => setInfo(null)} header={info?.name}>
        <div className={Config.Css.css({ textAlign: "center" })}>
          {info?.url && (
            <Uu5Extras.QRCode
              value={info.url}
              size="l"
              elementAttrs={{ onClick: () => window.open(info.url, "_blank") }}
            />
          )}
        </div>
      </Uu5Elements.Modal>
    </>
  );
}

//@@viewOff:helpers

const Round1 = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Round1",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { onConfirm } = props;

    const { data: game } = useGame();
    const {
      data: { playerList },
    } = usePlayerList();

    const [playerIndex, setPlayerIndex] = useState(0);
    const player = playerList[playerIndex];
    const playerData = player.data;

    const [amount, setAmount] = useState(null);

    const { state, data, handlerMap } = useDataObject({
      handlerMap: {
        load: () => Round1Calls.loadQuestions({ gameId: game.id, playerId: playerData.id }),
      },
    });

    useUpdateEffect(() => {
      handlerMap.load();
    }, [playerIndex]);

    //@@viewOn:render
    return (
      <Cover>
        <Uu5Elements.Text category="interface" segment="title" type="main">
          1. kolo
        </Uu5Elements.Text>
        <PlayersBar
          gameId={game.id}
          playerList={playerList.map(({ data }, i) => (i === playerIndex ? { ...data, amount, active: true } : data))}
        />
        <FastQuestions
          itemList={amount != null ? data.itemList : undefined}
          onSuccess={(value) => setAmount(amount + value)}
          onFinish={() => {
            player.handlerMap.set({ amount });

            if (playerIndex === playerList.length - 1) {
              onConfirm();
            } else {
              setAmount(null);
              setPlayerIndex(playerIndex + 1);
            }
          }}
          timeMs={Config.round1DurationMs}
        />
        {amount == null && (
          <Button disabled={state !== "ready"} onClick={() => setAmount(0)}>
            Start
          </Button>
        )}
      </Cover>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Round1 };
export default Round1;
//@@viewOff:exports
