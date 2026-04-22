import { createComponent } from "uu5g05";
import Button from "./button";

const TileButtons = createComponent({
  uu5Tag: "CaioLenaVisage.TileButtons",

  render(props) {
    const { itemList, onClick, pending } = props;

    const buttons = itemList.map(({key, name, ...props}) => (
      <Button key={key} onClick={() => onClick(key)} pending={pending} {...props}>
        {name ?? props.children}
      </Button>
    ));

    return <>{buttons}</>;
  },
});

export default TileButtons;
