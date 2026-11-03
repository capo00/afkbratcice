import { createVisualComponent, useDataObject, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import EmptyState from "./empty-state.jsx";

// Výbor AFK ze záznamů vedení (`management/list?board=true&active=true`), ne psaný text --
// do 2026-11 byl stránkou v `content/page-content.js` a každá změna ve výboru znamenala
// nové vydání.
//
// Skupiny podle funkce v pořadí číselníku (`BOARD_ROLE_LIST`: předseda nahoře). Telefon
// a e-mail jen u toho, komu je administrace zaškrtla („Kontakt na webu“): server je pošle
// jako `contact`, osobní údaje osoby jinak veřejné nejsou.
//
// Sazbu (nadpisy `h3`, odstavce, barvu odkazů) dává obal obsahové stránky (`routes/page.jsx`),
// stejně jako dřív psanému textu.

const fullName = (person) => [person?.name, person?.surname].filter(Boolean).join(" ");

function Contact({ contact }) {
  if (!contact?.phone && !contact?.email) return null;
  return (
    <>
      {contact.phone ? (
        <>
          <br />
          <Lsi import={importLsi} path={["board", "phone"]} />: <a href={`tel:${contact.phone}`}>{formatPhone(contact.phone)}</a>
        </>
      ) : null}
      {contact.email ? (
        <>
          <br />
          <Lsi import={importLsi} path={["board", "email"]} />: <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </>
      ) : null}
    </>
  );
}

/** `+420605907732` -> `+420 605 907 732`; jiný tvar projde, jak je. */
function formatPhone(phone) {
  const match = /^\+420(\d{3})(\d{3})(\d{3})$/.exec(phone);
  return match ? `+420 ${match[1]} ${match[2]} ${match[3]}` : phone;
}

const Board = createVisualComponent({
  uu5Tag: Config.TAG + "Board",

  render() {
    const { state, data } = useDataObject(
      { handlerMap: { load: () => UiElements.Call.cmdGet("/management/list", { board: true, active: true }) } },
      [],
    );

    if (state === "pendingNoData") return <Uu5Elements.Skeleton height={240} />;

    const today = new Date().toISOString().slice(0, 10);
    const groupList = Config.BOARD_ROLE_LIST.map((role) => ({
      role,
      memberList: (data?.itemList ?? [])
        .filter((item) =>
          (item.boardList ?? []).some(
            (m) => m.role === role && (!m.dateFrom || m.dateFrom <= today) && (!m.dateTo || m.dateTo >= today),
          ),
        )
        .sort((a, b) => fullName(a.person).localeCompare(fullName(b.person), "cs")),
    })).filter((group) => group.memberList.length);

    if (!groupList.length) return <EmptyState lsi={lsi("board", "empty")} icon="uugds-account-multi" />;

    return groupList.map(({ role, memberList }) => (
      <section key={role}>
        <h3>
          <Lsi import={importLsi} path={role === "member" ? ["board", "members"] : ["enum", "boardRole", role]} />
        </h3>
        <p>
          {memberList.map((item, i) => (
            <span key={item.id}>
              {i ? <br /> : null}
              <b>{fullName(item.person)}</b>
              <Contact contact={item.contact} />
            </span>
          ))}
        </p>
      </section>
    ));
  },
});

export { Board };
export default Board;
