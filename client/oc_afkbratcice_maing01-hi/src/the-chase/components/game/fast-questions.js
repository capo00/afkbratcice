//@@viewOn:imports
import { createVisualComponent, useEffect, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import speech from "../../utils/speech";
import Progress from "./progress";
import Button from "../button";
//@@viewOff:imports

const FastQuestions = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "FastQuestions",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { itemList, onSuccess, onFailure, onFinish, timeMs } = props;

    const [index, setIndex] = useState(0);
    const question = itemList?.[index]?.question;

    useEffect(() => {
      if (question) {
        speech.speak(question, { rate: 2 });
        return () => speech.stop();
      }
    }, [question]);

    //@@viewOn:render
    return itemList ? (
      <div className={Config.Css.css({ display: "flex", flexDirection: "column", gap: 32, alignItems: "center" })}>
        <Progress
          type="horizontal"
          size="xl"
          colorScheme="building"
          width="100%"
          timeMs={timeMs}
          onFinish={onFinish}
          className={Config.Css.css({ flexDirection: "column" })}
        />

        <Uu5Elements.Text category="interface" segment="title" type="major">
          {itemList[index].answer}
        </Uu5Elements.Text>

        <div className={Config.Css.css({ display: "flex", gap: 16 })}>
          <Button
            colorScheme="positive"
            width={80}
            onClick={() => {
              speech.stop();
              setIndex(index + 1);
              onSuccess(1000);
            }}
          >
            Ano
          </Button>

          <Button
            colorScheme="negative"
            width={80}
            onClick={() => {
              speech.stop();
              setIndex(index + 1);
              onFailure?.(1000);
            }}
          >
            Ne
          </Button>
        </div>
      </div>
    ) : null;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { FastQuestions };
export default FastQuestions;
//@@viewOff:exports
