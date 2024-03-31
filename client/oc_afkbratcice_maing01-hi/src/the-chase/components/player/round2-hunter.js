import { useEffect, useState, useUveVisibility } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { useRound2 } from "../../contexts/round2-context";
import { usePlayer } from "../../contexts/player-context";
import WaitingForQuestion from "../waiting-for-question";
import AnswerList from "../answer-list";

function WaitingForOffer() {
  const visible = useUveVisibility();
  const { data: hunter } = usePlayer();
  const { handlerMap } = useRound2();

  useEffect(() => {
    const interval = setInterval(() => visible && handlerMap.load({ hunterId: hunter.id }), 1000);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <div>
      <h2>Vyčkejte lovče, až budete na řadě!</h2>
    </div>
  );
}

function Offer() {
  const { data: round2, handlerMap, pendingData } = useRound2();

  const [valueMin, setValueMin] = useState();
  const [valueMax, setValueMax] = useState();

  const min = Math.ceil(round2.amount / 3000) * 1000;
  const max = 2 * round2.amount;

  return (
    <div>
      <h3>
        Nabídněte vyšší a nižší částku než je <Uu5Elements.Number value={round2.amount} currency="CZK" />!
      </h3>
      <Uu5Elements.MenuList
        itemList={Array((max - min) / 1000)
          .fill()
          .map((_, i) => {
            const value = min + i * 1000;
            console.log(value, valueMin, valueMax);
            return {
              ...(value === valueMin || value === valueMax
                ? { colorScheme: "primary", significance: "highlighted" }
                : null),
              onClick: () => {
                if (value < round2.amount) setValueMin(value);
                else setValueMax(value);
              },
              disabled: value === round2.amount,
              children: <Uu5Elements.Number value={value} currency="CZK" />,
            };
          })}
      />
      {valueMin && valueMax && (
        <Uu5Elements.Button
          colorScheme="primary"
          significance="highlighted"
          onClick={() => handlerMap.setOffer([valueMin, valueMax])}
          disabled={pendingData?.operation === "setOffer"}
        >
          Potvrdit
        </Uu5Elements.Button>
      )}
    </div>
  );
}

function Round2Hunter({ onConfirm }) {
  const { data: round2, handlerMap } = useRound2();

  useEffect(() => {
    if (round2?.playerStep === round2?.hunterStep || round2?.playerStep === 0) {
      handlerMap.setData({});
    }
  }, [round2?.playerStep, round2?.hunterStep]);

  console.log("Round2Hunter render round2", round2);

  let result;
  if (round2?.question && round2?.question.hunterAnswer == null) {
    result = <AnswerList isHunter />;
  } else if (round2?.offer) {
    result = <WaitingForQuestion />;
  } else if (round2?.amount) {
    result = <Offer />;
  } else {
    result = <WaitingForOffer />;
  }

  return result;
}

export default Round2Hunter;
