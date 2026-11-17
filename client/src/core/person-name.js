// How a person's name is shown, in one place (review 2026-11-12, 1.3: the join was copied 12×).
//
// A missing part is left out. An empty result means there is no name to show: the server does
// not send the names of children (server/services/hidden-names.js), or the record has no person.
// What stands in for it ("?", "Hráč", the player's short name) is the caller's decision.
//
// Plain module without uu5, so node tests read it.

/** "Jan Novák" -- the web, tooltips, page titles. */
export function personName(person) {
  return [person?.name, person?.surname].filter(Boolean).join(" ");
}

/** "Novák Jan" -- lists in the administration, sorted by surname. */
export function personNameBySurname(person) {
  return [person?.surname, person?.name].filter(Boolean).join(" ");
}

/** "JN" -- the circle of a person without a photo; empty without a name. */
export function personInitials(person) {
  return [person?.name, person?.surname]
    .map((part) => part?.trim()?.[0])
    .filter(Boolean)
    .join("");
}
