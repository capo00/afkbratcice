import Uu5Elements from "uu5g05-elements";
import { usePlayer } from "../contexts/player-context";
import { useRound2 } from "../contexts/round2-context";
import Config from "../config/config";

function AnswerList({ isHunter }) {
  const { data: player } = usePlayer();
  const { data: round2, handlerMap, pendingData } = useRound2();

  console.log("answer list: pendingData", pendingData);

  return (
    <Uu5Elements.MenuList
      itemList={round2.question.answerList.map(({ answer, hunterDisabled }, i) => ({
        disabled: (isHunter && hunterDisabled) || pendingData?.operation === "setAnswer",
        children: (
          <>
            {Config.answerList[i]}) {answer}
          </>
        ),
        onClick: () => handlerMap.setAnswer({ [isHunter ? "hunterId" : "playerId"]: player.id, answer: i }),
      }))}
    />
  );
}

export default AnswerList;
