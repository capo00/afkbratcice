import { createVisualComponent, useState, useEffect, useDataList, useMemo, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import OcElements from "../../libs/oc_cli-elements";
import { withRoute } from "../../libs/oc_cli-app";

const ICON_MAP = {
  "wedding": "mdi-heart-multiple-outline",
  "event": "mdi-glass-wine",
  "eyelash": "mdi-eye-outline",
  "man": "mdi-human-male",
  "child": "mdi-human-child",
  "woman": "mdi-human-female",
};

const dtFormatter = new Intl.DateTimeFormat("cs-CS", { month: "long" });
const monthNameList = Array.from({ length: 12 }, (_, i) => Utils.String.capitalize(dtFormatter.format(new Date(2026, i, 1))));

function Amount({ data }) {
  return data.total !== data.subtotal ? (
    <>
      <b>
        <Uu5Elements.Number value={data.total} />
      </b> / <Uu5Elements.Number value={data.subtotal} currency="CZK" minDecimalDigits={0} />
    </>
  ) : (
    <b>
      <Uu5Elements.Number value={data.total} currency="CZK" minDecimalDigits={0} />
    </b>
  );
}

function OrderItem({ order: { data, handlerMap }, ...propsToPass }) {
  const [order, setOrder] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Uu5Elements.MenuItem
        {...propsToPass}
        icon={ICON_MAP[data.product] ?? ICON_MAP[data.hair?.category]}
        contentRight={<Amount data={data} />}
        onClick={() => setOrder({
          header: data.customerName ?? "Customer",
          children: (
            <pre>
              {JSON.stringify(data, null, 2)}
            </pre>
          ),
        })}
        actionList={[
          {
            icon: "uugds-delete",
            onClick: (e) => {
              e.stopPropagation();
              setDeleteOpen(true)
            },
          }
        ]}
      >
        {data.customerName ?? ""}
      </Uu5Elements.MenuItem>
      <Uu5Elements.Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        icon="uugds-delete"
        header="Smazat objednávku"
        info="Opravdu chcete smazat objednávku?"
        actionList={[
          {
            children: "Smazat",
            colorScheme: "negative",
            onClick: () => handlerMap.delete(),
          },
          {
            children: "Zrušit",
            onClick: () => setDeleteOpen(false),
          },
        ]}
      />
      <Uu5Elements.Modal {...order} open={!!order} onClose={() => setOrder(null)} />
    </>
  );
}

function groupByMonth(orderList) {
  const monthList = [];

  for (let i = 0; i < 12; i++) monthList[i] = {
    name: monthNameList[i],
    subtotal: 0,
    total: 0,
    dayList: [],
  };

  orderList.forEach((order) => {
    if (order.data.paydate) {
      const paydate = new Date(order.data.paydate);
      const month = paydate.getMonth();
      if (month >= 0 && month < 12) {
        const day = paydate.getDate();
        const item = monthList[month].dayList[day - 1] ??= { itemList: [], subtotal: 0, total: 0 };
        item.date = new Date(paydate.getFullYear(), month, day);
        item.itemList.push(order);
        item.subtotal += order.data.subtotal;
        item.total += order.data.total;
        monthList[month].subtotal += order.data.subtotal;
        monthList[month].total += order.data.total;
      }
    }
  });

  const itemList = monthList.map((month) => month.total ? {
    children: month.name,
    contentRight: <Amount data={month} />,
    itemList: month.dayList.length === 0 ? undefined : month.dayList.map((day, i) => ({
      children: <Uu5Elements.DateTime value={day.date} format="D. M." />,
      contentRight: <Amount data={day} />,
      itemList: day.itemList.length === 0 ? undefined : day.itemList
        .toSorted((a, b) => a.data.paydate.localeCompare(b.data.paydate))
        .map((order) => ({ component: <OrderItem order={order} /> })),
    }))
  } : null).filter(Boolean);

  return itemList;
}

let Archive = createVisualComponent({
  uu5Tag: Config.TAG + "Archive",

  render() {
    const [year, setYear] = useState(() => new Date().getFullYear());

    const dataList = useDataList({
      skipInitialLoad: true,
      handlerMap: {
        load: () => {
          return OcElements.Call.cmdGet("caio-lenavisage/order/list", { year });
        },
      },
    });

    useEffect(() => {
      if (year) dataList.handlerMap.load();
    }, [year]);

    const isPending = dataList.state.startsWith("pending") || !dataList.data;

    const itemList = useMemo(() => dataList.data ? groupByMonth(dataList.data) : null, [dataList.data]);

    return (
      <Uu5Elements.Block
        header="Archiv"
        headerType="title"
        actionList={[
          {
            component: (
              <Uu5Forms.Year.Input
                value={year + ""}
                onChange={(e) => setYear(e.data.value ? +e.data.value : null)}
                significance="subdued"
                disabled={isPending}
                required
              />
            ),
          }
        ]}
      >
        {isPending ? <Uu5Elements.Pending size="max" /> : (
          <Uu5Elements.MenuList
            itemList={itemList}
            compactSubmenu
            colorScheme="pink"
            size="xl"
          />
        )}
      </Uu5Elements.Block>
    );
  },
});

Archive = withRoute(Archive, { profileList: ["authorities", "operatives"] });

export default Archive;
