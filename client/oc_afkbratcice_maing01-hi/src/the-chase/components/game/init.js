//@@viewOn:imports
import { createVisualComponent, useEffect, useState, useUveVisibility, Utils, useRoute, Environment } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Extras from "uu5extrasg01";
import Config from "../../config/config";
import { useGame } from "../../contexts/game-context";
import { usePlayerList } from "../../contexts/player-list-context";
import Cover from "../cover";
import Button from "../button";
//@@viewOff:imports

//@@viewOn:helpers
function WaitingForPlayers({ onConfirm, ...props }) {
  const visible = useUveVisibility();
  const gameDto = useGame();
  const { state, data, handlerMap } = usePlayerList();
  const [hunterId, setHunterId] = useState();
  const [route] = useRoute();

  useEffect(() => {
    if (state.startsWith("ready")) {
      const interval = setInterval(() => visible && handlerMap.load(), 1000);
      return () => clearInterval(interval);
    }
  }, [state, handlerMap, visible]);

  let result = (
    <Uu5Elements.Text category="interface" segment="title" type="micro">
      Čekání na připojení hráčů
    </Uu5Elements.Text>
  );
  switch (state) {
    case "readyNoData":
    case "pendingNoData":
      break;
    case "ready":
    case "pending":
      if (data.itemList.length) {
        result = (
          <Uu5Elements.MenuList
            size="xl"
            itemList={data.itemList.map(({ data: { id, name, hunter } }) => ({
              children: name,
              ...(hunterId === id || hunter ? { colorScheme: "red" } : null),
              significance: "distinct",
              actionList:
                hunterId === id || hunter
                  ? undefined
                  : [
                      {
                        icon: "uugdsstencil-user-account-key",
                        onClick: () => setHunterId(id),
                        tooltip: "Nastavit lovce",
                        colorScheme: "red",
                        size: "m",
                      },
                    ],
            }))}
            className={Config.Css.css({ width: 360 })}
          />
        );
      }
      break;
    default:
      result = <h4>Nečekaná chyba (state = {state})</h4>;
  }

  const inviteUrl = new URL(route.uu5Route, Environment.appBaseUri);
  inviteUrl.searchParams.set("gameId", gameDto.data.id);
  const inviteUri = inviteUrl.toString();

  //@@viewOn:render
  const { elementProps } = Utils.VisualComponent.splitProps(props, Config.Css.css({ paddingTop: 40 }));

  return (
    <Cover {...elementProps}>
      <div className={Config.Css.css({ display: "flex", flexDirection: "column" })}>
        <Uu5Extras.QRCode
          value={inviteUri}
          size="l"
          elementAttrs={{ onClick: () => window.open(inviteUri, "_blank") }}
        />
        <Uu5Elements.Pending type="horizontal" colorScheme="building" size="xxs" width={360} />
      </div>

      {result}

      {(hunterId || data?.itemList?.find(({ data }) => data.hunter)) && data?.itemList?.length > 1 && (
        <Button
          onClick={() => {
            hunterId && gameDto.handlerMap.setHunter(hunterId);
            onConfirm();
          }}
        >
          Začít 1. kolo
        </Button>
      )}
    </Cover>
  );
}

//@@viewOff:helpers

const Init = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Init",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { id, onConfirm } = props;

    const { state, handlerMap } = useGame();
    const [route, setRoute] = useRoute();

    useEffect(() => {
      (async function () {
        if (id) {
          handlerMap.get({ id });
        } else {
          const dtoOut = await handlerMap.init();
          setRoute(route.uu5Route, { id: dtoOut.id }, { replace: true });
        }
      })();
    }, [id]);

    //@@viewOn:render
    let result;
    switch (state) {
      case "pendingNoData":
      case "readyNoData":
        result = <Uu5Elements.Pending size="max" />;
        break;
      case "ready":
      case "pending":
        result = <WaitingForPlayers onConfirm={onConfirm} />;
        break;
      default:
        result = (
          <h4>
            Nečekaná chyba <Uu5Elements.Button onClick={() => handlerMap.get()}>Přenačíst</Uu5Elements.Button>
          </h4>
        );
    }

    return result;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Init };
export default Init;
//@@viewOff:exports
