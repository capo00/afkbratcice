# Tournament Manager – Backend Specification

## 1. Overview

Backend aplikace pro řízení sportovních turnajů.

Podporované sporty:

* football
* ping-pong
* darts
* nohejbal

Technologický stack:

* Node.js
* Express
* MongoDB (Mongoose)
* JWT Authentication
* OAuth2 (Google, Facebook)

Architektura:

* Modular monolith
* Role-based authorization (per tournament)
* Audit logging všech změn
* Pouze GET a POST endpoints
* Identifikátory vždy přes query parametry

---

# 2. Functional Scope

## 2.1 Turnajový proces

1. Vytvoření turnaje
2. Zadání účastníků
3. Nastavení strategie
4. Generování skupin
5. Generování zápasů (Berger tables)
6. Zadávání výsledků
7. Automatický výpočet tabulek
8. Generování playoff
9. Vyhodnocení vítěze

---

# 3. Roles & Authorization

## 3.1 Role Types

* GUEST (nepřihlášený)

  * pouze GET
* REFEREE

  * může zadávat výsledky
* ADMIN

  * plná správa turnaje

## 3.2 Role Storage

Role jsou přiřazeny per tournament:

```json
{
  "tournamentId": "ObjectId",
  "userId": "ObjectId",
  "role": "ADMIN | REFEREE"
}
```

Unikátní index:

```
{ tournamentId: 1, userId: 1 }
```

---

# 4. Database Design (MongoDB)

## 4.1 Users

```js
{
  _id: ObjectId,
  email: String,
  name: String,
  providers: [
    {
      provider: "google" | "facebook",
      providerId: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 4.2 Tournament

```js
{
  _id: ObjectId,
  name: String,
  sport: String,
  strategy: {
    type: "groups+playoff" | "league",
    groupsCount: Number,
    advanceFromGroup: Number
  },
  status: "draft" | "groups" | "playoff" | "finished",
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

* `{ status: 1 }`
* `{ createdBy: 1 }`

---

## 4.3 Participant

```js
{
  _id: ObjectId,
  tournamentId: ObjectId,
  name: String,
  label: String,
  group: String | null,
  seed: Number,
  stats: {
    played: Number,
    wins: Number,
    draws: Number,
    losses: Number,
    scored: Number,
    conceded: Number,
    points: Number
  }
}
```

Indexes:

* `{ tournamentId: 1 }`
* `{ tournamentId: 1, group: 1 }`

---

## 4.4 Match

```js
{
  _id: ObjectId,
  tournamentId: ObjectId,
  phase: "group" | "quarter" | "semi" | "final",
  group: String | null,
  round: Number,
  homeParticipantId: ObjectId,
  awayParticipantId: ObjectId,
  score: {
    home: Number,
    away: Number
  },
  winnerId: ObjectId | null,
  status: "scheduled" | "played",
  playedAt: Date
}
```

Indexes:

* `{ tournamentId: 1 }`
* `{ tournamentId: 1, phase: 1 }`
* `{ tournamentId: 1, group: 1 }`

---

## 4.5 HistoryEvent (Audit Log)

Každá POST operace musí vytvořit záznam.

```js
{
  _id: ObjectId,
  tournamentId: ObjectId,
  userId: ObjectId,
  entityType: String,
  entityId: ObjectId,
  action: String,
  diff: Object,
  timestamp: Date
}
```

Indexes:

* `{ tournamentId: 1 }`
* `{ entityType: 1, entityId: 1 }`

---

# 5. API Design (GET + POST Only)

## 5.1 Design Rules

* Pouze GET a POST
* Žádné PUT / DELETE
* ID pouze přes query parametry
* Všechny POST musí obsahovat `action`
* Každá mutace musí být zalogována

---

# 5.2 Public Endpoints

### List tournaments

```
GET /tournaments
```

### Get tournament

```
GET /tournament?id=<tournamentId>
```

### Get matches

```
GET /matches?tournamentId=<tournamentId>&phase=group&group=A
```

### Get standings

```
GET /standings?tournamentId=<tournamentId>&group=A
```

### Get playoff

```
GET /playoff?tournamentId=<tournamentId>
```

---

# 5.3 Admin Endpoints (POST)

## Tournament

```
POST /tournament
```

Body examples:

Create:

```json
{
  "action": "create",
  "name": "Summer Cup",
  "sport": "football",
  "strategy": {
    "type": "groups+playoff",
    "groupsCount": 2,
    "advanceFromGroup": 2
  }
}
```

Update:

```json
{
  "action": "update",
  "id": "<tournamentId>",
  "name": "Updated Name"
}
```

Delete:

```json
{
  "action": "delete",
  "id": "<tournamentId>"
}
```

---

## Participant

```
POST /participant?tournamentId=<tournamentId>
```

Create:

```json
{
  "action": "create",
  "name": "Team A",
  "label": "A1",
  "group": "A",
  "seed": 1
}
```

Update:

```json
{
  "action": "update",
  "id": "<participantId>",
  "name": "Updated Name"
}
```

Delete:

```json
{
  "action": "delete",
  "id": "<participantId>"
}
```

---

## Generate Groups

```
POST /generate-groups?tournamentId=<tournamentId>
```

Body:

```json
{
  "action": "generate"
}
```

---

## Generate Matches (Berger)

```
POST /generate-matches?tournamentId=<tournamentId>
```

Body:

```json
{
  "action": "generate"
}
```

---

## Start Playoff

```
POST /start-playoff?tournamentId=<tournamentId>
```

Body:

```json
{
  "action": "start"
}
```

---

# 5.4 Referee / Admin

## Update Match Result

```
POST /match-result?id=<matchId>
```

Body:

```json
{
  "action": "setResult",
  "home": 3,
  "away": 1
}
```

Musí:

1. Ověřit roli
2. Aktualizovat skóre
3. Určit vítěze
4. Přepočítat tabulku skupiny
5. Zalogovat změnu
6. V případě potřeby generovat další playoff fázi

---

# 6. Business Logic Rules

## 6.1 Berger Algorithm

* Pokud lichý počet týmů → přidat dummy
* Fix první tým
* Rotovat ostatní
* Párovat dle pozic
* Generovat pouze jednou
* Uložit do DB

---

## 6.2 Standings Calculation

Po každém update výsledku:

1. Načíst zápasy skupiny
2. Reset stats
3. Přepočítat:

   * played
   * wins/draws/losses
   * scored/conceded
   * points (3/1/0)
4. Seřadit dle:

   * points
   * score difference
   * goals scored
   * head-to-head
5. Persistovat změny

---

## 6.3 Playoff Logic

Příklad:

```
A1 vs B2
B1 vs A2
```

Po odehrání:

* vítěz postupuje
* další fáze se aktualizuje automaticky

---

# 7. Authentication Flow

1. Frontend získá OAuth token
2. Backend ověří token
3. Najde nebo vytvoří uživatele
4. Vydá JWT

JWT payload:

```json
{
  "userId": "...",
  "email": "..."
}
```

Middleware:

* ověření JWT
* načtení role pro tournament
* kontrola oprávnění

---

# 8. Error Format

Error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Readable message"
  }
}
```

Success:

```json
{
  "success": true,
  "data": {}
}
```

---

# 9. Project Structure

```
/src
  /modules
    /auth
    /tournament
    /participant
    /match
    /role
    /history
  /middleware
  /services
  app.js
```

Každý modul obsahuje:

* model
* service
* controller
* routes

---

# 10. Non-Functional Requirements

* Validace vstupu (Zod/Joi)
* Transakce při vícenásobných zápisech
* Žádné generování při GET
* Historie povinná pro každou mutaci
* Indexy optimalizované pro tournamentId

---

# 11. Implementation Order

1. Base project setup
2. Auth + JWT
3. Tournament CRUD
4. Participants
5. Match generation
6. Standings logic
7. Role enforcement
8. History logging
9. Playoff automation