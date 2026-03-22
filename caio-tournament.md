# Caio Tournament – Design Specification

## 1. Overview

Plugin pro řízení sportovních turnajů integrovaný do aplikace AFK Bratčice.

Podporované sporty:

* football
* ping-pong
* darts
* nohejbal

Technologický stack:

* Node.js
* Express
* MongoDB (native driver via oc_mongo)
* JWT Authentication
* OAuth2 (Google)

Architektura:

* Plugin v rámci aplikace afkbratcice
* Role-based authorization (per tournament)
* Audit logging všech změn
* Pouze GET a POST endpoints
* Identifikátory vždy přes query parametry
* Všechny API prefixovány `caio-tournament/`

---

# 2. Functional Scope

## 2.1 Turnajový proces

1. Vytvoření turnaje
2. Zadání účastníků
3. Nastavení strategie
4. Přiřazení skupin
5. Generování zápasů (Berger tables)
6. Zadávání výsledků
7. Automatický výpočet tabulek
8. Generování playoff
9. Vyhodnocení vítěze

---

# 3. Roles & Authorization

## 3.1 Role Types

* **Authorities** – globální profil (`profileList` obsahuje `"authorities"`). Plná správa turnajů.
* **Operator** – per-tournament role (identity je v `operativeList` nebo `createdBy`). Může řídit průběh turnaje. Authorities mají automaticky roli Operatora.
* **Referee** – per-tournament role (identity je v `refereeList`). Může zadávat výsledky zápasů. Operator/Authorities mají automaticky roli Referee.
* **Guest** – nepřihlášený nebo přihlášený bez přiřazené role. Pouze GET operace.

## 3.2 Authorization Matrix

| Operation                                   | Authorities | Operator | Referee | Guest |
|---------------------------------------------|:-----------:|:--------:|:-------:|:-----:|
| caio-tournament/tournament/create           | ✓           |          |         |       |
| caio-tournament/tournament/update           | ✓           | ✓        |         |       |
| caio-tournament/tournament/delete           | ✓           |          |         |       |
| caio-tournament/tournament/generateMatches  | ✓           | ✓        |         |       |
| caio-tournament/tournament/generatePlayoff  | ✓           | ✓        |         |       |
| caio-tournament/tournament/evaluate         | ✓           | ✓        |         |       |
| caio-tournament/tournament/close            | ✓           |          |         |       |
| caio-tournament/participant/create,update,delete | ✓      | ✓        |         |       |
| caio-tournament/match/setResult             | ✓           | ✓        | ✓       |       |
| GET (all)                                   | ✓           | ✓        | ✓       | ✓     |

### State `final` restriction

When a tournament is in state `final`, **all POST operations** are rejected (server returns 403).

### Client-side enforcement

* "Uzavřít" button is only visible to Authorities and shows a confirmation dialog before closing.
* CRUD actions (create, edit, delete) on the tournament list are only shown to Authorities.
* The tournament list is accessible to all users (including guests).

## 3.3 Role Storage

Role jsou přiřazeny v objektu tournament (`operativeList`, `refereeList`). Globální role `authorities` je uložena v `profileList` identity.

---

# 4. Database Design (MongoDB)

Collections use prefix `caioTournament_`.

## 4.1 Identities

Uses shared `sys_identity` collection from afkbratcice's `oc_app-auth`.

## 4.2 Tournament (caioTournament_tournament)

State transitions:
```
created → run (generateMatches)
run → playoff (generatePlayoff)
playoff → completed (evaluate)
completed → final (close)
```

## 4.3 Participant (caioTournament_participant)

## 4.4 Match (caioTournament_match)

Phases: `group`, `quarter`, `semi`, `thirdPlace`, `final`

## 4.5 HistoryEvent (caioTournament_historyEvent)

---

# 5. API Design

All endpoints prefixed with `caio-tournament/`.

## 5.1 Tournament

| Endpoint | Method | Auth |
|---|---|---|
| `caio-tournament/tournament/list` | GET | - |
| `caio-tournament/tournament/get` | GET | - |
| `caio-tournament/tournament/create` | POST | Authorities |
| `caio-tournament/tournament/update` | POST | Operator |
| `caio-tournament/tournament/delete` | POST | Authorities |
| `caio-tournament/tournament/generateMatches` | POST | Operator |
| `caio-tournament/tournament/generatePlayoff` | POST | Operator |
| `caio-tournament/tournament/evaluate` | POST | Operator |
| `caio-tournament/tournament/close` | POST | Authorities |
| `caio-tournament/tournament/listStandings` | GET | - |
| `caio-tournament/tournament/playoff` | GET | - |
| `caio-tournament/tournament/finalStandings` | GET | - |

## 5.2 Participant

| Endpoint | Method | Auth |
|---|---|---|
| `caio-tournament/participant/list` | GET | - |
| `caio-tournament/participant/get` | GET | - |
| `caio-tournament/participant/create` | POST | Operator |
| `caio-tournament/participant/update` | POST | Operator |
| `caio-tournament/participant/delete` | POST | Operator |

## 5.3 Match

| Endpoint | Method | Auth |
|---|---|---|
| `caio-tournament/match/list` | GET | - |
| `caio-tournament/match/get` | GET | - |
| `caio-tournament/match/setResult` | POST | Referee |

## 5.4 AuditLog

| Endpoint | Method | Auth |
|---|---|---|
| `caio-tournament/auditLog/list` | GET | - |

---

# 6. Business Logic Rules

## 6.1 Berger Algorithm

Round-robin pairing for group matches.

## 6.2 Standings Calculation

Tie-breaking order: points → head-to-head → score difference → goals scored.

## 6.3 Playoff Logic

Cross-seeding with alternating home group. Dynamic generation of next-round matches.

---

# 7. Project Structure

```
afkbratcice/
  server/
    caio-tournament/
      api.js                    # aggregator
      tournament/
        abl.js, dao.js, api.js
      participant/
        abl.js, dao.js, api.js
      match/
        abl.js, dao.js, api.js
      history/
        abl.js, dao.js, api.js
  client/oc_afkbratcice_maing01-hi/src/
    caio-tournament/
      spa.js                    # SPA root
      config/config.js
      tournament/
        tournament-list.js
        tournament-detail.js
        tournament-detail-view.js
        tournament-context.js
        tournament-detail-context.js
      participant/
        participant-context.js
        participant-section.js
      components/
        form-identity-select.js
        group-matches.js
        playoff-section.js
    caio-tournament.html        # entry HTML
    caio-tournament.js          # entry JS
```

---

# 8. Front-end

## 8.1 Routing

| Route | Popis |
|---|---|
| `/caio-tournament/tournament` | Seznam turnajů |
| `/caio-tournament/tournament?id=<tournamentId>` | Detail konkrétního turnaje |

## 8.2 Seznam turnajů

Dvě záložky: "Aktivní" a "Uzavřené".

## 8.3 Detail turnaje

Sekce: info, účastníci, skupiny, play-off, celkové umístění, tlačítka akcí dle stavu a role.
