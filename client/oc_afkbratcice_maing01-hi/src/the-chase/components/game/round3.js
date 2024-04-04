//@@viewOn:imports
import { createVisualComponent, useDataObject, useEffect, useState, useUpdateEffect } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config";
import Round3Calls from "../../calls/round3-calls";
import { useGame } from "../../contexts/game-context";
import { usePlayerList } from "../../contexts/player-list-context";
import Button from "../button";
import Cover from "../cover";
import Amount from "../amount";
import FastQuestions from "./fast-questions";
//@@viewOff:imports

//@@viewOn:helpers

function HuntBar({ playerCount, hunterCount }) {
  console.log(playerCount, hunterCount);
  return (
    <Uu5Elements.Grid templateColumns={`repeat(${playerCount}, minmax(40px, 1fr))`} columnGap={4}>
      {({ style }) => (
        <Uu5Elements.Box
          shape="background"
          colorScheme="building"
          borderRadius="moderate"
          className={Config.Css.css({ ...style, padding: 8 })}
        >

          {Array(playerCount)
            .fill()
            .map((_, i) => (
              <Uu5Elements.Box
                key={i}
                shape="background"
                colorScheme={i + 1 > hunterCount ? "blue" : "red"}
                significance="highlighted"
                borderRadius="moderate"
                className={Config.Css.css({
                  width: 48,
                  height: 48,
                  paddingInline: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                })}
              >
                {i === playerCount - 1 || i === hunterCount - 1 ? i + 1 : ""}
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
    const [pause, setPause] = useState(false);

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
      <Cover>
        <Uu5Elements.Text category="interface" segment="title" type="main">
          3. kolo
        </Uu5Elements.Text>
        <Uu5Elements.Text category="interface" segment="title" type="major">
          {winPlayerList.map(({ data }) => data.name).join(", ")}: <Amount value={sum} />
        </Uu5Elements.Text>
        <FastQuestions
          itemList={type != null ? data.itemList : undefined}
          onSuccess={() => (type === "hunter" ? setHunterCount(hunterCount + 1) : setPlayerCount(playerCount + 1))}
          onFailure={() => type === "hunter" && setPause(true)}
          onFinish={() => {
            if (type === "hunter") {
              onConfirm({ winner: "player", sum });
            } else {
              setType(null);
            }
          }}
          timeMs={4 * Config.minMs}
        />
        {type == null && (
          <Button
            disabled={state !== "ready"}
            onClick={() => {
              if (playerCount == null) {
                setPlayerCount(Math.ceil(sum / 5000));
                setType("player");
              } else {
                setType("hunter");
              }
            }}
            colorScheme={playerCount == null ? undefined : "red"}
          >
            Start
          </Button>
        )}
        {playerCount != null && <HuntBar playerCount={playerCount} hunterCount={hunterCount} pause={pause} />}
      </Cover>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Round3 };
export default Round3;
//@@viewOff:exports
