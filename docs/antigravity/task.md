# Tymonteam.pl (retro2026) — Task (M0..M10)

## Repo / środowisko
- Repo: https://github.com/piotrpelnikowski86/retro2026.git
- Dev: GitHub Codespaces + devcontainer
- Porty: 3000 (web), 8000 (api), 5432 (db) — test w zakładce PORTS. [web:96]

## Model kont uczniów (ważne)
- groupCode globalnie unikalne, np. `2C`.
- username ucznia: `{groupCode}-{studentNo}`, np. `2C-15` (bez zer wiodących).
- Admin tworzy konta hurtowo (klasa + zakres numerów).
- Avatary: tylko presety neutralne, bez twarzy.

## Artefakty wymagane od agenta
- docs/antigravity/task.md (ten plik) — aktualizowany po każdym PR.
- docs/antigravity/implementation_plan.md — architektura i szczegóły.
- docs/antigravity/walkthrough.md — uruchomienie i test manualny.

## Milestones (każdy jako 1–3 PR-y)

### M0 — Szkielet repo + uruchomienie
**PR0.1**
- [x] Utwórz strukturę: `apps/web`, `apps/api`, `infra/`, `docs/antigravity/`.
- [x] Dodaj `.devcontainer/devcontainer.json`.
- [x] Dodaj `.github/PULL_REQUEST_TEMPLATE.md`.

**PR0.2**
- [x] Dodaj docker compose (web/api/db) + podstawowe env-y.
- [x] Dodaj migracje (Alembic) i seed: admin + klasa `2C` + `2C-1..2C-3`.
- [x] README: jak uruchomić w Codespaces.

Akceptacja:
- [x] `docker compose up` uruchamia całość.
- [x] Web działa na 3000, API na 8000 (PORTS). [web:96]

### M1 — Auth + RBAC + profil + avatar preset
**PR1.1**
- [x] Backend: users/roles, logowanie, `/me`, `mustChangePassword`.
- [x] Front: logowanie, ochrona tras, ekran zmiany hasła.

**PR1.2**
- [x] Avatary: `/public/avatars/*.svg` + `avatars.json`, tylko neutralne (bez twarzy).
- [x] Profil: wybór `avatarPresetId`.

Akceptacja:
- [x] Uczeń loguje się, zmienia hasło, ustawia avatar.

### M2 — Admin: klasy + bulk-create `2C-15`
**PR2.1**
- [x] CRUD klas/grup (`groups.code` unikalne).
- [x] UI admina dla klas.


**PR2.2**
- [x] Bulk-create uczniów: `2C-1..2C-28` bez zer wiodących.
- [x] Eksport CSV tylko dla nowo utworzonych kont.
- [x] Reset hasła (pojedynczy uczeń lub cała klasa).

Akceptacja:
- [x] Admin tworzy klasę `3A`, dodaje `3A-1..3A-25`. Loginy: `3A-1`, `3A-15` (BEZ `3A-01`, `3A-015`).
- [x] Eksport CSV — po bulk-create tylko nowe.
- [x] Nie da się utworzyć drugiej klasy `2C`.
- [x] Loginy mają format `2C-15`, nie `2C-015`.

### M3 — Materiały dydaktyczne (CMS)
- [x] CRUD materiałów: draft/published, tagi, poziom/klasa.
- [x] UI ucznia: lista + filtry + szczegóły, tylko published.


### M4 — Tabliczka + słupki
- [x] Interaktywna tabliczka (nauka + trening + statystyki).
- [x] Generator słupków mnożenia/dzielenia.


### M5 — Quiz matematyczny (bez 1 i 10)
- [x] Generator: operandy 2–9, dzielenie zawsze całkowite.
- [x] Zapis prób + wyniki + progi zaliczenia.
- [x] Unit testy generatora (np. 1000 losowań).


### M6 — Słówka EN + quiz EN
- [x] CRUD słówek.
- [x] Quiz EN (EN→PL, PL→EN) + zapis prób.

### M7 — Gatekeeper do gier
- [ ] Reguły odblokowania konfigurowalne w panelu admina.
- [ ] Egzekucja po stronie API + czytelny powód blokady.

### M8 — Gry
- [ ] GameShell (pauza/restart/wyjście).
- [ ] TicTacToe
- [ ] Snake
- [ ] Warcaby (2 graczy lokalnie)
- [ ] Tetris

### M9 — Jakość i CI
- [ ] Unit: quiz math/EN + gatekeeper.
- [ ] E2E: login → zmiana hasła → quizy → odblokowanie → gry.
- [ ] GitHub Actions: lint/format/test.

### M10 — Deploy-ready
- [ ] deploy.md: env vars, migracje, backup DB, monitoring.
