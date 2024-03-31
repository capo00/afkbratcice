//@@viewOn:imports
import { createVisualComponent, useEffect, useState, useUveVisibility } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Extras from "uu5extrasg01";
import Config from "../../config/config";
import { useGame } from "../../contexts/game-context";
import { usePlayerList } from "../../contexts/player-list-context";
//@@viewOff:imports

//@@viewOn:helpers
function WaitingForPlayers({ onConfirm }) {
  const visible = useUveVisibility();
  const gameDto = useGame();
  const { state, data, handlerMap } = usePlayerList();
  const [hunterId, setHunterId] = useState();

  useEffect(() => {
    if (state.startsWith("ready")) {
      const interval = setInterval(() => visible && handlerMap.load(), 1000);
      return () => clearInterval(interval);
    }
  }, [state, handlerMap, visible]);

  let result;
  switch (state) {
    case "readyNoData":
    case "pendingNoData":
      result = null;
      break;
    case "ready":
    case "pending":
      result = (
        <Uu5Elements.MenuList
          itemList={data.itemList.map(({ data: { id, name } }) => ({
            children: name,
            ...(hunterId === id ? { colorScheme: "red" } : null),
            significance: "distinct",
            actionList:
              hunterId === id
                ? undefined
                : [
                    {
                      icon: "uugdsstencil-user-account-key",
                      onClick: () => setHunterId(id),
                      tooltip: "Nastavit lovce",
                    },
                  ],
          }))}
        />
      );
      break;
    default:
      result = <h4>Nečekaná chyba (state = {state})</h4>;
  }

  const inviteUri = location.href + "?gameId=" + gameDto.data.id;

  return (
    <div>
      <Uu5Extras.QRCode value={inviteUri} size="m" elementAttrs={{ onClick: () => window.open(inviteUri, "_blank") }} />

      <div>
        {result}
        <Uu5Elements.Pending />
      </div>

      {hunterId && data?.playerList?.length > 0 && (
        <Uu5Elements.Button
          colorScheme="primary"
          significance="highlighted"
          onClick={() => {
            gameDto.handlerMap.setHunter(hunterId);
            onConfirm();
          }}
        >
          Začít 1. kolo
        </Uu5Elements.Button>
      )}
    </div>
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
    const { onConfirm } = props;

    const { state, handlerMap } = useGame();

    useEffect(() => {
      handlerMap.init();
    }, []);

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
