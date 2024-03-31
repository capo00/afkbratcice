//@@viewOn:imports
import { createVisualComponent, useDataObject, useEffect, useState, useUpdateEffect } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config";
import Round1Calls from "../../calls/round1-calls";
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

  // TODO 2min
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
      <div>
        <PlayersBar playerList={playerList.map(({ data }, i) => (i === playerIndex ? { ...data, amount } : data))} />
        <h1>1. kolo</h1>
        <h2>
          {playerData.name} {playerData.amount}
        </h2>
        <Questions
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
        />
        {amount == null && (
          <Uu5Elements.Button
            disabled={state !== "ready"}
            onClick={() => setAmount(0)}
            colorScheme="primary"
            significance="highlighted"
          >
            Start
          </Uu5Elements.Button>
        )}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Round1 };
export default Round1;
//@@viewOff:exports
