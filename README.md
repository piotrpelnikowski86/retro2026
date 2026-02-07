# 🎓 Tymonteam.pl (retro2026)

Platforma edukacyjna z interaktywnymi narzędziami do nauki matematyki, angielskiego i grami edukacyjnymi.

## 🚀 Uruchomienie w GitHub Codespaces

### 1. Utwórz Codespace

1. Wejdź na [https://github.com/piotrpelnikowski86/retro2026](https://github.com/piotrpelnikowski86/retro2026)
2. Kliknij **Code** → **Codespaces** → **Create codespace on main**

### 2. Skonfiguruj środowisko

```bash
# Skopiuj przykładowy plik .env
cp .env.example .env

# Uruchom wszystkie serwisy (web, api, db)
docker compose up
```

### 3. Sprawdź działanie

Otwórz zakładkę **PORTS** w Codespaces i kliknij linki do:

- 🌐 **Web (Next.js)**: port 3000
- 🔌 **API (FastAPI)**: port 8000
- 🗄️ **Database (PostgreSQL)**: port 5432

### 4. Seed danych testowych

W nowym terminalu wykonaj:

```bash
# Wejdź do kontenera API
docker compose exec api bash

# Uruchom seed
python seed.py
```

**Konta testowe:**
- Admin: `admin` / `admin123`
- Uczeń: `2C-1` / `password123`
- Uczeń: `2C-2` / `password123`
- Uczeń: `2C-3` / `password123`

## 📋 Technologie

- **Frontend**: Next.js 14 + React + TypeScript
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL 15
- **Migrations**: Alembic
- **Dev Environment**: Docker Compose + GitHub Codespaces

## 🏗️ Struktura projektu

```
retro2026/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # FastAPI backend
├── infra/            # Infrastructure configs
├── docs/
│   └── antigravity/  # Planning artifacts
├── .devcontainer/    # Codespaces config
└── docker-compose.yml
```

## 📚 Dokumentacja

- [Task List](docs/antigravity/task.md) - Plan milestones M0-M10
- [Implementation Plan](docs/antigravity/implementation_plan.md) - Architektura techniczna
- [Walkthrough](docs/antigravity/walkthrough.md) - Instrukcja testowania

## ⚙️ Zarządzanie portami w Codespaces

W zakładce **PORTS** możesz:
- Zmienić widoczność portu (Private/Public)
- Zmienić protokół (HTTP/HTTPS)
- Skopiować link do portu

## 🔐 Bezpieczeństwo

⚠️ **Uwaga**: Plik `.env` zawiera sekrety i **NIE MOŻE** być dodany do repozytorium!

Przed pierwszym uruchomieniem na produkcji zmień:
- `SECRET_KEY` w `.env`
- Hasła do bazy danych
- CORS origins

## 📝 Konwencje

### Format loginów uczniów
- Klasa: `2C` (kod globalnie unikalny)
- Uczeń: `2C-15` (**bez zer wiodących**, nie `2C-015`)

### Pull Requests
Każdy PR używa template z `.github/PULL_REQUEST_TEMPLATE.md` i zawiera:
- Cel PR (1 zdanie)
- Kroki manual testu
- Checklist backend/DB/testy/security

## 🤝 Contributing

1. Małe PR-y (1 feature/fix)
2. Manual test przed merge
3. Bramki bezpieczeństwa (gatekeeper) zawsze po stronie API