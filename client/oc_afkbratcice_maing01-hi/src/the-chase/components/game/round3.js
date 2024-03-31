//@@viewOn:imports
import { BackgroundProvider, createVisualComponent, useDataObject, useEffect, useState, useUpdateEffect } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config";
import Round3Calls from "../../calls/round3-calls";
import { useGame } from "../../contexts/game-context";
import { usePlayerList } from "../../contexts/player-list-context";
import speech from "../../utils/speech";
import Progress from "../progress";
//@@viewOff:imports

//@@viewOn:helpers
function PlayersBar({ playerList }) {
  return (
    <div className={Config.Css.css({ display: "flex", justifyItems: "start", gap: 16 })}>
      {playerList.map(({ id, name, amount }) => (
        <Uu5Elements.Box
          key={id}
          shape="background"
          colorScheme="blue"
          borderRadius="moderate"
          className={Config.Css.css({ padding: 16, display: "inline-block" })}
          disabled={amount === 0}
        >
          {name}
          <br />
          {amount != null && <Uu5Elements.Number value={amount} />}
        </Uu5Elements.Box>
      ))}
    </div>
  );
}

function Questions({ itemList, onSuccess, onFinish }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (itemList) {
      const msg = itemList[index];
      speech.speak(msg.question, { rate: 2 });
    }
  }, [itemList, index]);

  // TODO 4min
  return itemList ? (
    <div>
      <Progress timeMs={0.25 * Config.minMs} onFinish={onFinish} />
      <h3>{itemList[index].answer}</h3>

      <Uu5Elements.Button
        colorScheme="positive"
        significance="highlighted"
        onClick={() => {
          speech.stop();
          setIndex(index + 1);
          onSuccess(1000);
        }}
      >
        Ano
      </Uu5Elements.Button>
      <Uu5Elements.Button
        colorScheme="negative"
        significance="highlighted"
        onClick={() => {
          speech.stop();
          setIndex(index + 1);
        }}
      >
        Ne
      </Uu5Elements.Button>
    </div>
  ) : null;
}

function HuntBar({ playerCount, hunterCount }) {
  return (
    <Uu5Elements.Grid templateColumns={`repeat(${playerCount + 1}, minmax(40px, 1fr))`}>
      {({ style }) => (
        <Uu5Elements.Box
          shape="background"
          colorScheme="building"
          significance="highlighted"
          className={Config.Css.css(style)}
        >
          {Array(playerCount + 1)
            .fill()
            .map((_, i) => (
              <Uu5Elements.Box
                key={i}
                shape="background"
                colorScheme={i === 0 ? "orange" : hunterCount == null || i > hunterCount ? "blue" : "red"}
                significance="highlighted"
                className={Config.Css.css(style)}
              >
                {i}
              </Uu5Elements.Box>
            ))}
        </Uu5Elements.Box>
      )}
    </Uu5Elements.Grid>
  );
}
//@@viewOff:helpers

const Round3 = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Round3",
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

    const winPlayerList = playerList.filter(({ data }) => data.amount > 0);
    const sum = winPlayerList.reduce((counter, { data }) => counter + data.amount, 0);

    const [type, setType] = useState();
    const [playerCount, setPlayerCount] = useState();
    const [hunterCount, setHunterCount] = useState(0);

    const { state, data, handlerMap } = useDataObject({
      handlerMap: {
        load: () => Round3Calls.loadQuestions({ gameId: game.id }),
      },
    });

    useUpdateEffect(() => {
      if (type === "hunter") {
        handlerMap.load();
      }
    }, [type]);

    useEffect(() => {
      if (playerCount === hunterCount) {
        onConfirm({ winner: "hunter" });
      }
    }, [playerCount, hunterCount]);

    //@@viewOn:render
    return (
      <div>
        <h1>3. kolo</h1>
        <h2>
          {winPlayerList.map(({ data }) => data.name).join(", ")}: <Uu5Elements.Number value={sum} currency="CZK" />
        </h2>
        <Questions
          itemList={type != null ? data.itemList : undefined}
          onSuccess={() => (type === "hunter" ? setHunterCount(hunterCount + 1) : setPlayerCount(playerCount + 1))}
          onFinish={() => {
            if (type === "hunter") {
              onConfirm({ winner: "player", sum });
            } else {
              setType(null);
            }
          }}
        />
        {type == null && (
          <Uu5Elements.Button
            disabled={state !== "ready"}
            onClick={() => {
              if (playerCount == null) {
                setPlayerCount(Math.round(sum / 5000));
                setType("player");
              } else {
                setType("hunter");
              }
            }}
            colorScheme={playerCount == null ? "blue" : "red"}
            significance="highlighted"
          >
            Start
          </Uu5Elements.Button>
        )}
        {playerCount != null && <HuntBar playerCount={playerCount} hunterCount={hunterCount} />}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Round3 };
export default Round3;
//@@viewOff:exports
