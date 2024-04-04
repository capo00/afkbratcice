import { useRoute } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { usePlayer } from "../../contexts/player-context";

function Init({ onConfirm }) {
  const { handlerMap } = usePlayer();
  const [route, setRoute] = useRoute();

  return (
    <Uu5Forms.Form.Provider
      onSubmit={async (e) => {
        const dtoOut = await handlerMap.create({ name: e.data.value.name });
        setRoute(route.uu5Route, { ...route.params, playerId: dtoOut.id }, { replace: true });
        onConfirm();
      }}
    >
      <Uu5Forms.Form.View>
        <Uu5Forms.FormText name="name" placeholder="Zadej jméno" required autoFocus />
      </Uu5Forms.Form.View>
      <Uu5Forms.SubmitButton>Přihlásit</Uu5Forms.SubmitButton>
    </Uu5Forms.Form.Provider>
  );
}

export default Init;
