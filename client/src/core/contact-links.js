// Kontaktní údaje jako odkazy, všude stejně (stránka Kontakt, patička, výbor): adresa vede
// do Google Map, e-mail na `mailto:`, telefon na `tel:` (review 1.3 B, Caio 2026-11-17).
// Bez uu5, ať to jde testovat v node.

/** Vyhledání adresy v Google Mapách (oficiální tvar odkazu bez klíče, `api=1`). */
export function mapsUrl(address) {
  return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;
}

export function mailtoUrl(email) {
  return email ? `mailto:${email}` : null;
}

/** `+420 605 907 732` -> `tel:+420605907732`: mezery v `tel:` některé telefony nevytočí. */
export function telUrl(phone) {
  return phone ? `tel:${String(phone).replace(/\s/g, "")}` : null;
}

// Pořadí řádků kontaktu a jejich ikony. `target` jen u map: e-mail a telefon otevře
// systémová aplikace, mapy nová karta.
export const CONTACT_FIELD_LIST = [
  { code: "address", icon: "uugds-mapmarker", href: mapsUrl, target: "_blank" },
  { code: "email", icon: "uugds-email", href: mailtoUrl },
  { code: "phone", icon: "uugds-phone", href: telUrl },
];
