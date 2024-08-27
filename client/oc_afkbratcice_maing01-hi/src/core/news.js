//@@viewOn:imports
// import { GoogleApis } from "googleapis";
import { Content, createVisualComponent, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Uu5Extras from "uu5extrasg01";
import Config from "./config/config.js";
import GoogleDisk from "../libs/capo-google-disk";

//@@viewOff:imports

function withControlledCarousel(Component) {
  return (props) => {
    const { index: propsIndex, onIndexChange } = props;

    const [index, setIndex] = useState(propsIndex || 0);

    return (
      <Component
        {...props}
        index={index}
        onIndexChange={(e) => {
          typeof onIndexChange === "function" && onIndexChange(e);
          setIndex(e.data.index);
        }}
      />
    );
  };
}

const Carousel = withControlledCarousel(Uu5Extras.InfoCarousel);

function wrapContent(header, content) {
  return (
    <Uu5Elements.Block
      headerType="heading"
      level={2}
      header={<Content childrenNestingLevel="spot">{header}</Content>}
      significance="subdued"
    >
      <Content childrenNestingLevel="areaCollection">{content}</Content>
    </Uu5Elements.Block>
  );
}

const News = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "News",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const itemList = [
      {
        src: GoogleDisk.Utils.Image.getUri("1IuBJ3_jO-SIIiVjLqoDwHu4bbJTVgcj8"),
        children: wrapContent(
          "Commuting problems",
          "Getting to your office every day from home can be stressful and time consuming. Getting stuck in traffic jams is not a very pleasant way to spend your free time. There are better ways to handle this." +
            " Getting to your office every day from home can be stressful and time consuming. Getting stuck in traffic jams is not a very pleasant way to spend your free time. There are better ways to handle this." +
            " Getting to your office every day from home can be stressful and time consuming. Getting stuck in traffic jams is not a very pleasant way to spend your free time. There are better ways to handle this." +
            " Getting to your office every day from home can be stressful and time consuming. Getting stuck in traffic jams is not a very pleasant way to spend your free time. There are better ways to handle this." +
            " Getting to your office every day from home can be stressful and time consuming. Getting stuck in traffic jams is not a very pleasant way to spend your free time. There are better ways to handle this." +
            " Getting to your office every day from home can be stressful and time consuming. Getting stuck in traffic jams is not a very pleasant way to spend your free time. There are better ways to handle this." +
            " Getting to your office every day from home can be stressful and time consuming. Getting stuck in traffic jams is not a very pleasant way to spend your free time. There are better ways to handle this." +
            " Getting to your office every day from home can be stressful and time consuming. Getting stuck in traffic jams is not a very pleasant way to spend your free time. There are better ways to handle this." +
            " Getting to your office every day from home can be stressful and time consuming. Getting stuck in traffic jams is not a very pleasant way to spend your free time. There are better ways to handle this.",
        ),
      },
      {
        src: "https://drive.usercontent.google.com/download?id=1IuBJ3_jO-SIIiVjLqoDwHu4bbJTVgcj8&export=view&authuser=0",
        children: wrapContent(
          "Stress in the city",
          "Living directly in the city where you work is a great way to solve every day long distance travels. Life in the city is stressful in a different way and using the overcrowded public transport can be unpleasant experience as well.",
        ),
      },
      {
        src: "https://uuapp.plus4u.net/uu-webkit-maing02/b6d739b46b0a4f4980891c3c54a6df5d/image-placeholder-03",
        children: wrapContent(
          "Teleworking",
          "Great solution is working from home. There are downsides as well though. Being closed in your house alone the whole day can be also stressful and not many people can find the will to focus on their tasks without procrastinating.",
        ),
      },
    ];

    //@@viewOn:render
    return (
      <div>
        <Uu5Forms.Form
          onSave={async (e) => {
            console.log(e.data.value);
          }}
        >
          <Uu5Forms.FormFile name="file" />
        </Uu5Forms.Form>
        <Carousel itemList={itemList} type="infinite" intervalMs={5000} />
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { News };
export default News;
//@@viewOff:exports
