//@@viewOn:imports
import { createVisualComponent, useEffect, useState, useUveVisibility } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import { usePlayerList } from "../../contexts/player-list-context";
import { useRound2 } from "../../contexts/round2-context";
import Progress from "./progress";
import speech from "../../utils/speech";
import Cover from "../cover";
import Table from "../table";
import Amount from "../amount";
import Button from "../button";

//@@viewOff:imports

function WaitingForOffer() {
  const visible = useUveVisibility();
  const { handlerMap } = useRound2();

  useEffect(() => {
    const interval = setInterval(() => visible && handlerMap.get(), 1000);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <Uu5Elements.Text category="interface" segment="title" type="common">
      Čekejte na nabídku lovce!
    </Uu5Elements.Text>
  );
}

function QuestionVoice({ question, answerList, onEnd }) {
  useEffect(() => {
    speech.speak(question, {
      onEnd: () => {
        speech.speak(
          answerList.map(({ answer }, i) => `Za ${i === 0 ? "á" : Config.answerList[i] + "é"}) ${answer}`).join("\n"),
          { onEnd, rate: Config.round2Rate },
        );
      },
      rate: Config.round2Rate,
    });
    return () => speech.stop();
  }, [question]);

  return (
    <Uu5Elements.Text category="interface" segment="title" type="common">
      {question}
    </Uu5Elements.Text>
  );
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

  return <Progress type="horizontal" size="xl" colorScheme="building" width="100%" text={null} {...props} />;
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

  let result;
  if (round2.question) {
    let answerBar;
    if (type === "answer") {
      if (hunterAnswer != null) {
        answerBar = <Button onClick={() => onConfirm()}>Zobraz stav</Button>;
      } else if (correctAnswer != null) {
        answerBar = <Button onClick={() => setHunterAnswer(round2.question.hunterAnswer)}>Zobraz odpověď lovce</Button>;
      } else if (playerAnswer != null) {
        answerBar = (
          <Button onClick={() => setCorrectAnswer(round2.question.correctAnswer)}>Zobraz správnou odpověď</Button>
        );
      } else if (round2.question.playerAnswer != null) {
        answerBar = <Button onClick={() => setPlayerAnswer(round2.question.playerAnswer)}>Zobraz odpověď hráče</Button>;
      }
    }

    result = (
      <div className={Config.Css.css({ textAlign: "center", width: 640, maxWidth: "100%", marginTop: 64 })}>
        <QuestionVoice
          key={round2.question.id}
          question={round2.question.question}
          answerList={round2.question.answerList}
          onEnd={() => setType("question")}
        />

        <Uu5Elements.Grid templateColumns="1fr 1fr 1fr" className={Config.Css.css({ marginTop: 16, marginBottom: 16 })}>
          {round2.question.answerList.map(({ answer }, i) => {
            let colorScheme, significance;

            if (playerAnswer === i) {
              if (correctAnswer == null) {
                colorScheme = "blue";
              } else if (correctAnswer !== i) {
                colorScheme = "red";
              }
            }

            if (correctAnswer === i) {
              colorScheme = "green";
            }

            if (hunterAnswer === i) {
              significance = "highlighted";
              if (correctAnswer !== i) {
                colorScheme = "red";
              }
            }

            return (
              <Uu5Elements.Button
                key={i}
                colorScheme={colorScheme}
                significance={significance}
                borderRadius="moderate"
                size="xl"
                className={Config.Css.css({ justifyContent: "left" })}
              >
                {Config.answerList[i]}) {answer}
              </Uu5Elements.Button>
            );
          })}
        </Uu5Elements.Grid>
        {answerBar}
        {type === "question" && <ProgressLoader timeMs={0.167 * Config.minMs} onFinish={() => setType("answer")} />}
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

    const [type, setType] = useState("offer");

    useEffect(() => {
      if (round2?.playerId !== playerData.id || round2?.hunterId !== hunter.data.id) {
        handlerMap.init({ playerId: playerData.id, hunterId: hunter.data.id });
      }
    }, [playerData.id, hunter.data.id, round2?.playerId, round2?.hunterId]);

    let result;

    switch (type) {
      case "offer":
        result = (
          <>
            <Table
              itemList={[null, round2?.offer?.[1], playerData.amount, round2?.offer?.[0], null, null, null].map(
                (value, i) => ({
                  style: { justifyContent: value === playerData.amount ? "space-between" : "center" },
                  children: value ? (
                    <>
                      {value === playerData.amount && (
                        <Uu5Elements.Icon
                          icon="uugds-chevron-right"
                          className={Config.Css.css({ fontSize: "1.5em" })}
                        />
                      )}
                      <b>
                        <Amount value={value} />
                      </b>
                      {value === playerData.amount && (
                        <Uu5Elements.Icon icon="uugds-chevron-left" className={Config.Css.css({ fontSize: "1.5em" })} />
                      )}
                    </>
                  ) : (
                    ""
                  ),
                  disabled: !value,
                  onClick:
                    value && round2?.offer
                      ? () => {
                          handlerMap.confirmOffer(value);
                          setType("canPlay");
                        }
                      : undefined,
                }),
              )}
            />

            {!round2?.offer && <WaitingForOffer />}
          </>
        );
        break;
      case "canPlay":
        const length = 6;
        const playerStepI = length - round2.playerStep;
        const hunterStepI = length - round2.hunterStep;

        result = (
          <>
            <Table
              itemList={Array(length)
                .fill()
                .map((_, i) => ({
                  style: { justifyContent: i === playerStepI ? "space-between" : "center" },
                  children:
                    i === playerStepI ? (
                      <>
                        <Uu5Elements.Icon
                          icon="uugds-chevron-right"
                          className={Config.Css.css({ fontSize: "1.5em" })}
                        />
                        <b>
                          <Amount value={round2.amount} />
                        </b>
                        <Uu5Elements.Icon icon="uugds-chevron-left" className={Config.Css.css({ fontSize: "1.5em" })} />
                      </>
                    ) : i === hunterStepI ? (
                      <b>Lovec</b>
                    ) : (
                      ""
                    ),
                  colorScheme: i <= hunterStepI ? "negative" : i >= playerStepI ? "dark-blue" : "blue",
                  significance: "highlighted",
                }))}
            />
            {round2.playerStep === 0 || round2.playerStep === round2.hunterStep ? (
              <Button
                onClick={() => {
                  player.handlerMap.set({ amount: round2.playerStep === 0 ? round2.amount : 0 });
                  if (playerIndex === playerList.length - 1) onConfirm();
                  else setPlayerIndex(playerIndex + 1);
                }}
              >
                Další
              </Button>
            ) : (
              <Button onClick={() => setType("question")}>Otázka</Button>
            )}
          </>
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
      <Cover colorScheme={type === "offer" && !round2?.offer ? "red" : undefined}>
        <Uu5Elements.Text category="interface" segment="title" type="main">
          2. kolo
        </Uu5Elements.Text>
        <Uu5Elements.Text category="interface" segment="title" type="major">
          {playerData.name}
          {type === "canPlay" && (round2.playerStep === 0 || round2.playerStep === round2.hunterStep) ? (
            <>
              :&nbsp;
              <Amount value={round2.amount} />
            </>
          ) : null}
        </Uu5Elements.Text>

        {result}
      </Cover>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Round2 };
export default Round2;
//@@viewOff:exports
