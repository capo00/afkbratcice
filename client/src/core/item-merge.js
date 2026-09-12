// Položkový handler pro `useDataList`, který návratovou hodnotu **sloučí se současnými
// daty položky** místo toho, aby ji jimi nahradil.
//
// Proč: zápisová operace nemusí vracet tranzitivní data, kterých se netýká —
// `match/setLineup` mění sestavu, ne týmy, takže server vrací holý zápas, kdežto
// `match/get` k němu přibaluje `homeTeam`/`guestTeam`. `useDataList` ale položku nahradí
// **celou** tím, co handler vrátí (`transformListCustomOp` v uu5g05), takže bez merge by
// se z ní vložené týmy ztratily a obrazovka by je musela načítat znovu.
//
// Merge proto musí udělat sám handler — a ten se `useDataList` předává jednou pro celý
// seznam, ne pro konkrétní řádek, takže se k původním datům dostane jen přes ref.
//
//   const dataRef = useRef();
//   const dataList = useDataList({
//     handlerMap: { load: ... },
//     itemHandlerMap: { setResult: mergeItemHandler(dataRef, (dtoIn) => Call.cmdPost("match/setResult", dtoIn)) },
//   });
//   dataRef.current = dataList.data;   // AŽ ZA `useDataList` -- dřív ještě neexistuje
//
// **Nepoužívat na `delete`**: prázdná odpověď je pro `useDataList` pokyn položku ze
// seznamu vyhodit; merge by z ní udělal objekt a řádek by zůstal viset.

/**
 * @param dataRef  ref na `dataList.data` (pole položek `{ data, handlerMap, state }`)
 * @param call     funkce, která provede samotné volání use casu
 */
function mergeItemHandler(dataRef, call) {
  return async (dtoIn) => {
    const updated = await call(dtoIn);
    const current = dataRef.current?.find((item) => item?.data?.id === dtoIn.id)?.data;
    return { ...current, ...updated };
  };
}

export { mergeItemHandler };
