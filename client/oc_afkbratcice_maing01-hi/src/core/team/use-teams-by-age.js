import { useDataObject } from "uu5g05";
import Calls from "./calls";

function useTeamsByAge(age) {
  const { data } = useDataObject(
    {
      handlerMap: {
        load: () => (age ? Calls.load({ age }) : null),
      },
    },
    [age],
  );

  return data;
}

export default useTeamsByAge;
