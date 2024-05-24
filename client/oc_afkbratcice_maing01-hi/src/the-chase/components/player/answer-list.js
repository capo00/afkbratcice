import Uu5Elements from "uu5g05-elements";
import { usePlayer } from "../../contexts/player-context";
import { useRound2 } from "../../contexts/round2-context";
import Config from "../../config/config";
import Table from "../table";

function AnswerList({ isHunter }) {
  const { data: player } = usePlayer();
  const { data: round2, handlerMap, pendingData } = useRound2();

  return (
    <>
      <Uu5Elements.Text category="interface" segment="title" type="common">
        {round2.question.question}
      </Uu5Elements.Text>
      <Table
        itemList={round2.question.answerList.map(({ answer, hunterDisabled }, i) => ({
          style: { justifyContent: "start" },
          colorScheme: "building",
          disabled: (isHunter && hunterDisabled) || pendingData?.operation === "setAnswer",
          children: (
            <>
              {Config.answerList[i]}) {answer}
            </>
          ),
          onClick: () => handlerMap.setAnswer({ [isHunter ? "hunterId" : "playerId"]: player.id, answer: i }),
        }))}
      />
    </>
  );
}

export default AnswerList;
