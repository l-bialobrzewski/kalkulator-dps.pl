kalkulator-dps.pl

Kalkulator odpłatności za pobyt w Domu Pomocy Społecznej — zgodny z ustawą z dnia 12 marca 2004 r. o pomocy społecznej (art. 61–64a).


Opis projektu
Narzędzie webowe do szacowania podziału odpłatności za pobyt w DPS między trzech zobowiązanych:

pensjonariusza (max 70% dochodu netto, art. 61 ust. 2 pkt 1),
osoby zobowiązane (małżonek, dzieci, rodzice — ponad 300% kryterium dochodowego),
gminę (pokrywa pozostałą różnicę, art. 61 ust. 1 pkt 3).

Kalkulator ma charakter edukacyjny i szacunkowy. Ostateczną wysokość odpłatności ustala organ administracyjny (MOPS/OPS) w decyzji administracyjnej po przeprowadzeniu wywiadu środowiskowego.

Funkcje

Obsługa lat 2024, 2025, 2026 z poprawnymi progami dochodowymi (Rozporządzenie RM z 12.07.2024, Dz.U. 2024 poz. 1081)
Dodawanie do 5 osób zobowiązanych z możliwością wyboru relacji (małżonek, dziecko, rodzic, inna)
Rozróżnienie gospodarstw jednoosobowych i wieloosobowych (próg proporcjonalny do liczby osób)
Detekcja przesłanek do zwolnienia (art. 64) — choroba, bezrobocie, ciąża, samotne wychowywanie dziecka itd.
Detekcja zwolnienia obligatoryjnego (art. 64a) — pozbawienie władzy rodzicielskiej
Wizualizacja podziału odpłatności (wykres słupkowy, komórki zbiorcze)
Eksport wyników przez Drukuj / Zapisz PDF (natywny dialog drukowania)
W pełni responsywny (mobile-first, breakpoint 480px)
Zero zależności zewnętrznych — jeden plik .html, czysty HTML/CSS/JS


Podstawa prawna
ArtykułTreśćArt. 61 ust. 1Kolejność podmiotów zobowiązanych do odpłatnościArt. 61 ust. 2 pkt 1Opłata pensjonariusza — max 70% dochoduArt. 61 ust. 2 pkt 2Próg dla osób zobowiązanych — 300% kryterium dochodowegoArt. 64Przesłanki fakultatywnego zwolnienia z opłaty (decyzja uznaniowa)Art. 64a Zwolnienie obligatoryjne — pozbawienie władzy rodzicielskiej


Silnik obliczeniowy — algorytm
1. Opłata pensjonariusza = min(dochód × 0,70 ; koszt DPS)
2. Luka = max(0 ; koszt DPS − opłata pensjonariusza)
3. Dla każdej osoby zobowiązanej (iteracja po kolejności wprowadzenia):
     próg = 300% × kryterium × [1 | liczba osób w rodzinie]
     jeśli dochód osoby > próg:
       max_wkład = dochód osoby − próg
       wkład = min(max_wkład ; pozostała_luka)
       pozostała_luka -= wkład
4. Udział gminy = pozostała_luka po uwzględnieniu wszystkich osób zobowiązanych

Struktura projektu
kalkulator-dps.html   # Cały projekt — jeden samowystarczalny plik
README.md             # Ten plik

Uruchomienie
Brak serwera, brak instalacji. Otwórz plik bezpośrednio w przeglądarce:
bash# Lokalne uruchomienie
open kalkulator-dps.html          # macOS
start kalkulator-dps.html         # Windows
xdg-open kalkulator-dps.html      # Linux
Lub umieść plik na dowolnym hostingu statycznym (GitHub Pages, Cloudflare Pages, Netlify, własny serwer Apache/Nginx).

Stos technologiczny
WarstwaTechnologiaMarkupHTML5StylizacjaCSS3 (Custom Properties, Grid, Flexbox)LogikaVanilla JavaScript (ES6+)CzcionkiGoogle Fonts — Lora (nagłówki), DM Sans (treść)Dependencjebrak

Ograniczenia i zastrzeżenia

Kalkulator nie uwzględnia zaległości z poprzednich okresów.
Zwolnienia z art. 64 mają charakter uznaniowy — decyzja należy do organu po wywiadzie środowiskowym.
Kolejność osób zobowiązanych wprowadzona przez użytkownika ma znaczenie dla wyliczenia wkładu każdej z nich (algorytm sekwencyjny).
Wynik nie zastępuje decyzji administracyjnej MOPS/OPS ani porady prawnej. W przypadku sporu zalecane jest odwołanie do SKO lub konsultacja z radcą prawnym.


Planowany rozwój

 Obsługa lat 2027+ (automatyczna aktualizacja progów po nowelizacji rozporządzenia)
 Eksport do PDF po stronie klienta (bez dialogu drukowania)
 Tryb porównawczy — zestawienie wielu scenariuszy równolegle
 Kalkulator odwrotny — wyliczenie dochodu granicznego dla danego kosztu DPS
 API / wersja backend (Node.js / Python) do integracji z systemami DPS


Licencja
MIT — możesz używać, modyfikować i rozpowszechniać bez ograniczeń, z zachowaniem informacji o autorze.

Autor
Łukasz Białobrzewski
Projekt: kalkulator-dps.pl
Kontakt: [l.bialobrzewski@gmail.com]
