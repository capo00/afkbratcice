import { useEffect, useState, useUveVisibility } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { useRound2 } from "../../contexts/round2-context";
import { usePlayer } from "../../contexts/player-context";
import WaitingForQuestion from "./waiting-for-question";
import AnswerList from "./answer-list";
import Button from "../button";
import Amount from "../amount";
import Config from "../../config/config";
import Table from "../table";

function WaitingForOffer() {
  const visible = useUveVisibility();
  const { data: hunter } = usePlayer();
  const { handlerMap } = useRound2();

  useEffect(() => {
    const interval = setInterval(() => visible && handlerMap.load({ hunterId: hunter.id }), 1000);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <Uu5Elements.Text category="interface" segment="title" type="major">
      Vyčkejte lovče, až budete na řadě!
    </Uu5Elements.Text>
  );
}

function Offer() {
  const { data: round2, handlerMap, pendingData } = useRound2();

  const [valueMin, setValueMin] = useState();
  const [valueMax, setValueMax] = useState();

  const min = Math.ceil(round2.amount / 3000) * 1000;
  const max = 2 * round2.amount;

  const length = (max - min) / 1000;

  return (
    <>
      <Uu5Elements.Text category="interface" segment="title" type="major">
        Nabídněte vyšší a nižší částku než je <Amount value={round2.amount} />!
      </Uu5Elements.Text>
      <Table
        itemList={Array(length)
          .fill()
          .map((_, i) => {
            const value = min + i * 1000;

            return {
              style: { justifyContent: value === round2.amount ? "space-between" : "center" },
              children:
                value === round2.amount ? (
                  <>
                    <Uu5Elements.Icon icon="uugds-chevron-right" className={Config.Css.css({ fontSize: "1.5em" })} />
                    <b>
                      <Amount value={round2.amount} />
                    </b>
                    <Uu5Elements.Icon icon="uugds-chevron-left" className={Config.Css.css({ fontSize: "1.5em" })} />
                  </>
                ) : (
                  <Amount value={value} />
                ),

              colorScheme: value === valueMin || value === valueMax || value === round2.amount ? "dark-blue" : "blue",
              significance: "highlighted",

              disabled: value === round2.amount,
              onClick: () => {
                if (value < round2.amount) setValueMin(value);
                else setValueMax(value);
              },
            };
          })}
      />

      {valueMin && valueMax && (
        <Button
          onClick={() => handlerMap.setOffer([valueMin, valueMax])}
          disabled={pendingData?.operation === "setOffer"}
        >
          Potvrdit
        </Button>
      )}
    </>
  );
}

function Round2Hunter({ onConfirm }) {
  const { data: round2, handlerMap } = useRound2();

  useEffect(() => {
    if (round2?.playerStep === round2?.hunterStep || round2?.playerStep === 0) {
      handlerMap.setData({});
    }
  }, [round2?.playerStep, round2?.hunterStep]);

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
