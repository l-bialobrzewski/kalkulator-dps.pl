# Prompt do sprawdzenia w innym LLM

Skopiuj poniższy prompt do Gemini, Mistral, Bielika albo innego modelu i załącz pliki `index.html`, `styles.css`, `app.js`, `README.md` oraz `openapi.yaml`.

```text
Jesteś recenzentem projektu "Kalkulator DPS 2.0" dla polskiego rynku. Sprawdź frontend, logikę prawną, SEO, konwersję i specyfikację OpenAPI.

Kontekst:
- Aplikacja oblicza odpłatność za pobyt w domu pomocy społecznej.
- Podstawy prawne: art. 60-64b ustawy o pomocy społecznej oraz rozporządzenie RM z 12 lipca 2024 r. o kryteriach dochodowych.
- Kryteria dochodowe dla 2025/2026: 1 010 zł dla osoby samotnie gospodarującej i 823 zł dla osoby w rodzinie.
- Wynik ma charakter edukacyjny, nie jest poradą prawną ani gwarancją decyzji OPS/MOPS.

Zadania:
1. Sprawdź, czy logika obliczeń jest zgodna z art. 60-64b:
   - mieszkaniec maks. 70% dochodu,
   - rodzina tylko nadwyżka ponad 300% kryterium,
   - kolejność: małżonek, zstępni przed wstępnymi, gmina,
   - art. 64 jako zwolnienie uznaniowe,
   - art. 64a jako zwolnienie obligatoryjne,
   - art. 64b jako szczególna przesłanka mieszkańca.
2. Wskaż błędy, nadinterpretacje albo miejsca wymagające konsultacji z prawnikiem.
3. Oceń UX i frontend:
   - czy użytkownik rozumie wynik,
   - czy scenariusze best/worst case są jasne,
   - czy scoring i procent szans są bezpiecznie opisane,
   - czy aplikacja działa na mobile.
4. Oceń SEO:
   - title, description, Open Graph, JSON-LD,
   - frazy long-tail,
   - brakujące podstrony lub treści.
5. Oceń konwersję:
   - czy użytkownik ma jasny następny krok,
   - czy warto dodać CTA do konsultacji, zapisu PDF, maila albo formularza kontaktowego.
6. Sprawdź `openapi.yaml`:
   - czy schemat żądania i odpowiedzi jest kompletny,
   - czy nazwy pól są zrozumiałe,
   - czy typy i przykłady są poprawne.

Format odpowiedzi:
- Najpierw lista błędów krytycznych.
- Potem lista ryzyk średnich.
- Potem szybkie usprawnienia.
- Na końcu werdykt: gotowe / gotowe po poprawkach / wymaga przebudowy.
```

## Dodatkowe pytania kontrolne dla LLM

- Czy procent "szansy na zwolnienie" jest wystarczająco opisany jako heurystyka?
- Czy wynik nie sugeruje, że OPS/MOPS musi zastosować scoring kalkulatora?
- Czy mechanizm rozdziału opłaty w tej samej grupie jest jasno opisany jako założenie produktowe?
- Czy best case nie zwiększa opłat innych osób po zwolnieniu jednej osoby?
- Czy OpenAPI powinno rozdzielać silnik prawny od scoringu AI?
