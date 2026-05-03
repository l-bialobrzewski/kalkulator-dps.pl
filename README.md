# Kalkulator DPS 2.0

Kalkulator odpłatności za pobyt w domu pomocy społecznej. Wersja 2.0 rozdziela aplikację na osobne pliki `index.html`, `styles.css` i `app.js`, dodaje scenariusze best/worst case, scoring sytuacji, heurystyczny procent szans na zwolnienie oraz regułową interpretację AI.

Stan prawny sprawdzony: 2026-05-03.

## Pliki

- `index.html` - semantyczny frontend, SEO, Open Graph i JSON-LD.
- `styles.css` - responsywny interfejs kalkulatora.
- `app.js` - logika prawna, scenariusze, scoring, interpretacja, eksport JSON.
- `openapi.yaml` - specyfikacja przyszłego API obliczeniowego.
- `LLM_REVIEW_PROMPT.md` - gotowy prompt do sprawdzenia projektu w Gemini, Mistral, Bieliku lub innym LLM.

## Audyt wersji poprzedniej

### Frontend

Poprzednia wersja była funkcjonalnym prototypem, ale miała kilka ograniczeń: część wariantów była w jednym pliku HTML, widoczne było ryzyko problemów z kodowaniem znaków, logika była spięta z inline-handlerami `onclick`, a wynik był prezentowany bardziej jako prosty kalkulator niż narzędzie decyzyjne. Wersja 2.0 rozdziela warstwy, poprawia semantykę, formularze, responsywność, drukowanie wyniku i eksport JSON.

### Logika prawna

Wersja 2.0 uwzględnia:

- art. 60: pobyt w DPS jest odpłatny do wysokości średniego miesięcznego kosztu utrzymania,
- art. 61: kolejność odpłatności: mieszkaniec, małżonek, zstępni przed wstępnymi, gmina,
- limit mieszkańca: maksymalnie 70% dochodu,
- próg rodziny: opłata tylko nadwyżką ponad 300% właściwego kryterium dochodowego,
- art. 64: uznaniowe zwolnienie częściowe lub całkowite,
- art. 64a: obligatoryjne zwolnienie po spełnieniu przesłanek i złożeniu wniosku,
- art. 64b: szczególna przesłanka dla wskazanych grup mieszkańców,
- scenariusz proceduralny dla ryzyka braku wywiadu lub umowy.

Źródła:

- Ustawa o pomocy społecznej, tekst ujednolicony: <https://eli.gov.pl/api/acts/DU/2025/1214/text/U/D20251214Lj.pdf>
- Rozporządzenie RM z 12 lipca 2024 r. w sprawie kryteriów dochodowych: <https://eli.gov.pl/eli/DU/2024/1044/ogl>
- Komunikat MRPiPS o kryteriach 2025: <https://www.gov.pl/web/rodzina/powiekszy-sie-grupa-osob-uprawnionych-do-wsparcia-rzad-przyjal-rozporzadzenie-o-kryteriach-dochodowych-w-pomocy-spolecznej2>

## Założenia obliczeniowe

1. Mieszkaniec płaci `min(70% dochodu skorygowanego, koszt DPS)`.
2. Jeżeli wskazano dochód objęty ulgą terapeutyczną, kalkulator obniża podstawę dochodu mieszkańca o 50% tej kwoty.
3. Po opłacie mieszkańca pozostaje luka do pokrycia.
4. Osoby zobowiązane są sortowane według rangi: małżonek, zstępni, wstępni, osoba dobrowolna.
5. W tej samej grupie kalkulator rozdziela opłatę proporcjonalnie do zdolności płatniczej, a nie według kolejności wpisania.
6. Dla osoby samotnej zdolność płatnicza to nadwyżka ponad `3 * kryterium osoby samotnej`.
7. Dla osoby w rodzinie zdolność płatnicza to nadwyżka dochodu gospodarstwa ponad `3 * kryterium rodzinne * liczba osób`.
8. Art. 64 i 64a nie zwiększają automatycznie opłat innych osób w scenariuszu best case; różnicę przejmuje gmina.

## Scoring i procent szans na zwolnienie

Procent szans jest heurystyką produktową, nie predykcją administracyjną. Kalkulator przyznaje punkty za przesłanki z art. 64/64a, jakość dokumentów i presję dochodową po opłacie.

Interpretacja scoringu:

- `100%` - zwolnienie obligatoryjne art. 64a, jeśli dokumenty są prawdziwe i złożono wniosek.
- `78-92%` - bardzo wysoka szansa uznaniowa.
- `62-77%` - wysoka szansa.
- `45-61%` - średnia szansa.
- `30-44%` - niska/średnia szansa.
- `<30%` - niska szansa.

Wynik powinien być traktowany jako lista argumentów do rozmowy z OPS/MOPS, a nie jako gwarancja decyzji.

## Scenariusze

- Best case: pozytywne rozpatrzenie najsilniejszych przesłanek zwolnienia i najniższy sensowny udział rodziny.
- Bazowy: ustawowa zdolność płatnicza bez uznaniowych zwolnień.
- Worst case: brak uznaniowego zwolnienia; opcjonalnie ryzyko proceduralne przy braku wywiadu/umowy.

## SEO

Wdrożone elementy:

- unikalny title i meta description,
- canonical URL,
- Open Graph,
- JSON-LD `WebApplication` i `FAQPage`,
- treści odpowiadające na frazy: `kalkulator DPS`, `odpłatność DPS`, `ile płaci rodzina za DPS`, `zwolnienie z opłaty DPS`,
- szybki frontend bez zewnętrznych fontów i bibliotek.

Rekomendacje po wdrożeniu produkcyjnym:

- dodać statyczne podstrony poradnikowe: `kto płaci za DPS`, `zwolnienie z opłaty DPS`, `art. 64a DPS`, `odwołanie od decyzji OPS`,
- dodać sitemap.xml i robots.txt,
- dodać przykłady lokalne z kosztami DPS według województw po ich ręcznej weryfikacji,
- mierzyć konwersję kliknięć: drukuj wynik, kopiuj JSON, dodaj osobę, wczytaj przykład.

## Konwersja

Wersja 2.0 prowadzi użytkownika od danych do wyniku bez landing page'a. Najważniejsze mechanizmy konwersyjne:

- wynik live bez przeładowania strony,
- przykład danych do natychmiastowego zrozumienia narzędzia,
- jasny podział: mieszkaniec, rodzina, gmina,
- scenariusze best/worst case,
- interpretacja sytuacji i konkretne argumenty do wniosku,
- eksport JSON do konsultacji lub dalszej analizy.

## Uruchomienie

To statyczna aplikacja. Można otworzyć `index.html` bez serwera lokalnego.

## API

`openapi.yaml` opisuje przyszły endpoint `POST /v2/calculate`, który przyjmuje dane wejściowe kalkulatora i zwraca:

- opłatę mieszkańca,
- wkład osób zobowiązanych,
- udział gminy,
- scenariusze,
- scoring,
- interpretację.

## Ryzyka i TODO

- Uznaniowe zwolnienia zależą od praktyki konkretnego OPS/MOPS i dokumentów.
- Kalkulator nie pobiera automatycznie lokalnych średnich kosztów DPS z BIP.
- Warto dodać testy jednostkowe dla silnika po przeniesieniu go do modułu backendowego.
- Przed produkcją warto wykonać recenzję prawną przez radcę prawnego lub specjalistę pomocy społecznej.

## Zastrzeżenie

Projekt ma charakter informacyjny i edukacyjny. Nie jest poradą prawną, decyzją administracyjną ani gwarancją zwolnienia z opłaty.
