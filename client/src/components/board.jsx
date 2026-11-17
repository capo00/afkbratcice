import { createVisualComponent, useDataObject, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import EmptyState from "./empty-state.jsx";
import DataState from "./data-state.jsx";
import { personName } from "../core/person-name.js";
import { mailtoUrl, telUrl } from "../core/contact-links.js";

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


/** `+420605907732` -> `+420 605 907 732`; jiný tvar projde, jak je. */
function formatPhone(phone) {
  const match = /^\+420(\d{3})(\d{3})(\d{3})$/.exec(phone);
  return match ? `+420 ${match[1]} ${match[2]} ${match[3]}` : phone;
}

/** Telefon · e-mail pod jménem, jen co je zaškrtnuté k zveřejnění; jinak nic. */
function contactLine(contact) {
  const linkList = [
    contact?.phone ? (
      <Uu5Elements.Link key="phone" href={telUrl(contact.phone)} colorScheme="primary">
        {formatPhone(contact.phone)}
      </Uu5Elements.Link>
    ) : null,
    contact?.email ? (
      <Uu5Elements.Link key="email" href={mailtoUrl(contact.email)} colorScheme="primary">
        {contact.email}
      </Uu5Elements.Link>
    ) : null,
  ].filter(Boolean);
  if (!linkList.length) return undefined;
  return linkList.flatMap((link, i) =>
    i ? [<span key={"separator" + i} className={Config.Css.css({ marginInline: 6 })}>·</span>, link] : [link],
  );
}

const Board = createVisualComponent({
  uu5Tag: Config.TAG + "Board",

  render() {
    const dataObject = useDataObject(
      { handlerMap: { load: () => UiElements.Call.cmdGet("/management/list", { board: true, active: true }) } },
      [],
    );
    const { state, data } = dataObject;

    if (state === "pendingNoData" || state === "errorNoData") return <DataState dataObject={dataObject} height={240} />;

    // Záznam je jedna trvající funkce ve výboru (`active: true` filtruje server).
    const groupList = Config.BOARD_ROLE_LIST.map((role) => ({
      role,
      memberList: (data?.itemList ?? [])
        .filter((item) => item.role === role)
        .sort((a, b) => personName(a.person).localeCompare(personName(b.person), "cs")),
    })).filter((group) => group.memberList.length);

    if (!groupList.length) return <EmptyState lsi={lsi("board", "empty")} icon="uugds-account-multi" />;

    // Člen = `InfoItem`: fotka osoby (bez ní ikona), jméno a pod ním kontakt (review 1.3 B).
    return groupList.map(({ role, memberList }) => (
      <section key={role}>
        <h3>
          <Lsi import={importLsi} path={role === "member" ? ["board", "members"] : ["enum", "boardRole", role]} />
        </h3>
        <Uu5Elements.InfoGroup
          direction="vertical"
          itemDirection="vertical"
          // `l`: fotka člena má být poznat, v `m` je to jen tečka vedle jména.
          size="l"
          itemList={memberList.map((item) => ({
            ...(item.person?.photoUri ? { imageSrc: item.person.photoUri } : { icon: "uugds-account" }),
            title: personName(item.person),
            subtitle: contactLine(item.contact),
          }))}
        />
      </section>
    ));
  },
});

export { Board };
export default Board;
