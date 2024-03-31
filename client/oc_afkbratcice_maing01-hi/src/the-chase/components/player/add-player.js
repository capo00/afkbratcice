import Uu5Forms from "uu5g05-forms";
import { usePlayer } from "../../contexts/player-context";

function AddPlayer({ onConfirm }) {
  const { handlerMap } = usePlayer();

  return (
    <Uu5Forms.Form
      onSubmit={async (e) => {
        await handlerMap.create({ name: e.data.value.name });
        onConfirm();
      }}
    >
      <Uu5Forms.FormText name="name" label="Zadej jméno" required autoFocus />
      <Uu5Forms.SubmitButton>Přihlásit</Uu5Forms.SubmitButton>
    </Uu5Forms.Form>
  );
}

export default AddPlayer;
