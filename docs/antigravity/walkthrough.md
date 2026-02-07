# Walkthrough — Tymonteam.pl (retro2026)

## 1) Start w Codespaces
1. Otwórz Codespace dla repo.
2. Terminal: uruchom środowisko (docelowo):
   - docker compose up
3. Otwórz zakładkę PORTS i kliknij link do:
   - web: 3000
   - api: 8000 [web:96]

## 2) Smoke test (po M0)
- Wejście na web (3000) działa.
- API (8000) odpowiada (np. /health).
- API /avatars endpoint zwraca listę 6 avatarów.

## 3) Test ścieżki STUDENT (po M1 ✅)
1. Zaloguj się uczniem (np. 2C-1) hasłem `password123`.
2. System wymusza zmianę hasła → podaj nowe hasło.
3. Zostaniesz przekierowany na `/edu`.
4. Kliknij przycisk "👤 Profil" w nagłówku.
5. Wybierz jeden z 6 dostępnych avatarów (circle-blue, square-green, hexagon-purple, triangle-orange, diamond-red, star-yellow).
6. Kliknij "Zapisz avatar".
7. Wróć do panelu edu.

Oczekiwane: 
- Sesja działa poprawnie.
- Avatar jest wyświetlany w panelu edu (80x80px).
- Panel pokazuje "✅ Avatar został ustawiony!"
- Brak ostrzeżenia o brakującym avatarze.


## 4) Test ścieżki ADMIN (po M2+)
1. Zaloguj się adminem.
2. Utwórz grupę `2C` (ma być unikalna).
3. Bulk-create uczniów 2C-1..2C-3.
4. Pobierz CSV dla nowych kont.
Oczekiwane: brak zer w loginach; duplikat `2C` odrzucony.

## 5) Test bramki gier (po M7+)
1. Wejdź /fun bez zaliczenia quizów.
2. UI pokazuje czego brakuje.
3. Zaliczyć quizy i spróbować ponownie.
Oczekiwane: dostęp kontrolowany przez API, nie tylko UI.

## 6) Troubleshooting portów
- Porty zarządzasz w PORTS (protokół, visibility); GitHub opisuje też komendę gh do zmiany widoczności portów. [web:96]
