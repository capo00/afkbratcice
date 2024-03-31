//@@viewOn:imports
import { createVisualComponent, useEffect, useState, useUveVisibility } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import { usePlayerList } from "../../contexts/player-list-context";
import { useRound2 } from "../../contexts/round2-context";
import Progress from "../progress";
import speech from "../../utils/speech";

//@@viewOff:imports

function WaitingForOffer({ onConfirm }) {
  const visible = useUveVisibility();
  const { state, data: round2, handlerMap } = useRound2();

  useEffect(() => {
    console.log("WaitingForOffer useEffect", state, round2);
    if (!round2?.offer && state !== "readyNoData") {
      const interval = setInterval(() => visible && handlerMap.get(), 1000);
      return () => clearInterval(interval);
    } else if (round2?.offer) {
      onConfirm();
    }
  }, [round2?.offer, state, visible]);

  return <p>Čekejte na nabídku lovce</p>;
}

function QuestionVoice({ question, answerList, onEnd }) {
  useEffect(() => {
    speech.speak(question, {
      onEnd: () => {
        speech.speak(answerList.map(({ answer }, i) => `Za ${Config.answerList[i]}) ${answer}.`).join("\n"), { onEnd });
      },
    });
  }, []);

  return <Uu5Elements.Text>{question}</Uu5Elements.Text>;
}

function ProgressLoader(props) {
  const { data: round2, handlerMap } = useRound2();

  useEffect(() => {
    const timeout = setTimeout(() => handlerMap.get(), 2000);
    return () => clearTimeout(timeout);
  }, [handlerMap]);

  useEffect(() => {
    if (round2.question.hunterAnswer != null && round2.question.playerAnswer != null) {
      props.onFinish();
    }
  }, [round2.question.hunterAnswer, round2.question.playerAnswer]);

  return <Progress {...props} />;
}

function Question({ onConfirm }) {
  const { data: round2, handlerMap } = useRound2();
  const [type, setType] = useState();
  const [playerAnswer, setPlayerAnswer] = useState();
  const [correctAnswer, setCorrectAnswer] = useState();
  const [hunterAnswer, setHunterAnswer] = useState();

  useEffect(() => {
    handlerMap.loadQuestion();
  }, []);

  useEffect(() => {
    if (type === "answer") {
      const timeout = setTimeout(() => handlerMap.get(), 2000);
      return () => clearTimeout(timeout);
    }
  }, [type, handlerMap]);

  console.log("Question", JSON.parse(JSON.stringify({ type, round2, playerAnswer, correctAnswer, hunterAnswer })));

  let result;
  if (round2.question) {
    let answerBar;
    if (type === "answer") {
      if (hunterAnswer != null) {
        answerBar = <Uu5Elements.Button onClick={() => onConfirm()}>Zobraz stav</Uu5Elements.Button>;
      } else if (correctAnswer != null) {
        answerBar = (
          <Uu5Elements.Button onClick={() => setHunterAnswer(round2.question.hunterAnswer)}>
            Zobraz odpověď lovce
          </Uu5Elements.Button>
        );
      } else if (playerAnswer != null) {
        answerBar = (
          <Uu5Elements.Button onClick={() => setCorrectAnswer(round2.question.correctAnswer)}>
            Zobraz správnou odpověď
          </Uu5Elements.Button>
        );
      } else if (round2.question.playerAnswer != null) {
        answerBar = (
          <Uu5Elements.Button onClick={() => setPlayerAnswer(round2.question.playerAnswer)}>
            Zobraz odpověď hráče
          </Uu5Elements.Button>
        );
      }
    }

    result = (
      <div>
        <QuestionVoice
          question={round2.question.question}
          answerList={round2.question.answerList}
          onEnd={() => setType("question")}
        />
        <Uu5Elements.Grid templateColumns="1fr 1fr 1fr">
          {round2.question.answerList.map(({ answer }, i) => {
            let colorScheme,
              significance = "distinct";
            if (playerAnswer === i) {
              if (correctAnswer == null) {
                colorScheme = "cyan";
              } else if (correctAnswer !== i) {
                colorScheme = "red";
              }
            }

            if (correctAnswer === i) {
              colorScheme = "green";
              significance = "distinct";
            }

            if (hunterAnswer === i) {
              if (correctAnswer === i) {
                significance = "highlighted";
              } else {
                colorScheme = "red";
                significance = "distinct";
              }
            }

            return (
              <Uu5Elements.MenuItem
                key={i}
                colorScheme={colorScheme}
                significance={significance}
                borderRadius="moderate"
              >
                {Config.answerList[i]}) {answer}
              </Uu5Elements.MenuItem>
            );
          })}
        </Uu5Elements.Grid>
        {answerBar}
        {type === "question" && <ProgressLoader timeMs={Config.minMs} onFinish={() => setType("answer")} />}
      </div>
    );
  } else {
    result = <Uu5Elements.Pending size="max" />;
  }

  return result;
}

const Round2 = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Round2",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { onConfirm } = props;

    const {
      data: { playerList, hunter },
    } = usePlayerList();

    const [playerIndex, setPlayerIndex] = useState(0);
    const player = playerList[playerIndex];
    const playerData = player.data;

    const { data: round2, handlerMap } = useRound2();

    const [type, setType] = useState("waitForOffer");

    useEffect(() => {
      if (round2?.playerId !== playerData.id || round2?.hunterId !== hunter.data.id) {
        handlerMap.init({ playerId: playerData.id, hunterId: hunter.data.id });
      }
    }, [playerData.id, hunter.data.id, round2?.playerId, round2?.hunterId]);

    let result;

    switch (type) {
      case "waitForOffer":
        result = <WaitingForOffer onConfirm={() => setType("confirmOffer")} />;
        break;
      case "confirmOffer":
        result = (
          <Uu5Elements.MenuList
            itemList={[round2.offer[0], playerData.amount, round2.offer[1]].map((value) => ({
              children: value,
              onClick: () => {
                handlerMap.confirmOffer(value);
                setType("canPlay");
              },
            }))}
          />
        );
        break;
      case "canPlay":
        const length = 7;
        const playerStepI = length - round2.playerStep;
        const hunterStepI = length - round2.hunterStep;

        result = (
          <div>
            <Uu5Elements.MenuList
              itemList={Array(length)
                .fill()
                .map((_, i) => ({
                  children:
                    i === playerStepI ? (
                      <Uu5Elements.Number value={round2.amount} currency="CZK" />
                    ) : i === hunterStepI ? (
                      "Lovec"
                    ) : (
                      ""
                    ),
                  colorScheme: i <= hunterStepI ? "negative" : "primary",
                  significance: i <= hunterStepI || i === playerStepI ? "highlighted" : "distinct",
                }))}
            />
            {round2.playerStep === 0 || round2.playerStep === round2.hunterStep ? (
              <Uu5Elements.Button
                onClick={() => {
                  player.handlerMap.set({ amount: round2.playerStep === 0 ? round2.amount : 0 });
                  if (playerIndex === playerList.length - 1) onConfirm();
                  else setPlayerIndex(playerIndex + 1);
                }}
              >
                Další hráč
              </Uu5Elements.Button>
            ) : (
              <Uu5Elements.Button onClick={() => setType("question")}>Otázka</Uu5Elements.Button>
            )}
          </div>
        );
        break;
      case "question":
        result = <Question onConfirm={() => setType("canPlay")} />;
        break;
      default:
        result = <h2>Neznámý typ: {type}</h2>;
    }

    //@@viewOn:render
    return (
      <div>
        <h2>{playerData.name}</h2>
        {result}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Round2 };
export default Round2;
//@@viewOff:exports
