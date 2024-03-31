import { useEffect } from "uu5g05";
import { useRound2 } from "../../contexts/round2-context";
import WaitingForQuestion from "../waiting-for-question";
import AnswerList from "../answer-list";

function Round2Player({ onConfirm }) {
  const { data: round2 } = useRound2();

  useEffect(() => {
    if ((round2?.playerStep != null && round2?.playerStep === round2?.hunterStep) || round2?.playerStep === 0) {
      console.log("onConfirm", round2.playerStep, round2.hunterStep);
      onConfirm();
    }
  }, [round2?.playerStep, round2?.hunterStep]);

  console.log("Round2Player", round2);

  let result;
  if (round2?.question && round2?.question.playerAnswer == null) {
    result = <AnswerList />;
  } else {
    result = <WaitingForQuestion />;
  }

  return result;
}

export default Round2Player;
