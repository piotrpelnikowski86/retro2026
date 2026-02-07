# Implementation Plan — Tymonteam.pl (retro2026)

## 1. Stack i architektura
- Web: Next.js + React + TypeScript (App Router).
- API: FastAPI (Python).
- DB: PostgreSQL + Alembic migracje.
- Dev: Docker Compose, uruchamiane w Codespaces.

## 2. Role i uprawnienia
- STUDENT: profil (avatar preset), quizy, materiały, gry (po odblokowaniu).
- ADMIN: klasy, konta uczniów, materiały, słówka, reguły odblokowania, podgląd wyników.

## 3. Model kont (2C-15)
- groups.code: unikalne globalnie (np. `2C`).
- users.username: `{groupCode}-{studentNo}`, bez zer wiodących.
- Bulk-create: tworzy konta w zakresie numerów; pomija istniejące; eksportuje CSV dla nowych.

## 4. DB schema (minimal)
### groups
- id (uuid, pk)
- code (text, not null, unique)

### users
- id (uuid, pk)
- username (text, not null, unique)
- role (enum: STUDENT/ADMIN)
- group_id (uuid, fk -> groups)
- student_no (int, not null)
- password_hash (text, not null)
- must_change_password (bool, default true)
- avatar_preset_id (text, not null)

Constrainty:
- UNIQUE(groups.code)
- UNIQUE(users.username)
- UNIQUE(users.group_id, users.student_no) (spójność numeru w klasie)

## 5. Endpointy API (propozycja)
Auth:
- POST /token
- GET /me
- PATCH /me/password
Profile:
- GET /avatars
- PATCH /me/avatar

Admin:
- POST /admin/groups
- GET /admin/groups
- PATCH /admin/groups/{id}
- DELETE /admin/groups/{id}
- POST /admin/students/bulk-create
- POST /admin/students/{id}/reset-password
- GET /admin/students/export.csv

Edukacja:
- Materials CRUD (admin), read (student)
- Vocab CRUD (admin)
- Quiz endpoints: start/submit/history

Gatekeeper:
- GET /games/access (zwraca: allowed + reasons)
- Middleware/dep w endpointach /games/*

## 6. UI routes (Next.js)
- /login
- /first-login (zmiana hasła)
- /profile (avatar preset)
- /edu (dashboard)
- /edu/materials, /edu/materials/[id]
- /edu/math (tabliczka + słupki)
- /quiz/math, /quiz/english
- /fun (bramka), /fun/snake, /fun/tictactoe, /fun/checkers, /fun/tetris
- /admin (dashboard)
- /admin/groups
- /admin/students
- /admin/materials
- /admin/vocab
- /admin/unlock-rules
- /admin/attempts

## 7. Gatekeeper (reguły)
Model ruleJson (przykład):
- requirePassed: ["MATH", "EN"]
- withinDays: 7
- minScore: 80
API ma wyliczać dostęp i zwracać listę braków (reasons).

## 8. Test plan
Unit:
- generator quiz math: brak operandów 1 i 10; dzielenie zawsze całkowite
- walidator reguł gatekeepera
- scoring quizów

E2E:
- admin: create group 2C → bulk-create 2C-1..2C-3
- student: login 2C-1 → change password → set avatar → pass quizzes → enter games

## 9. PR plan
Realizować wg docs/antigravity/task.md (M0..M10) w małych PR-ach.
