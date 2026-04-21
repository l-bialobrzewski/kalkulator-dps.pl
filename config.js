/**
 * config.js — Dane konfiguracyjne kalkulatora DPS
 *
 * Źródło prawne: Rozporządzenie Rady Ministrów z dnia 12 lipca 2024 r.
 * w sprawie zweryfikowanych kryteriów dochodowych (Dz.U. 2024 poz. 1081)
 *
 * Aktualizacja: przy każdej nowelizacji rozporządzenia zaktualizuj
 * wyłącznie ten plik — reszta kodu pozostaje bez zmian.
 */

'use strict';

const CONFIG = {
  /**
   * Kryteria dochodowe wg roku [PLN/miesiąc]
   * single — dla osoby samotnie gospodarującej
   * family — na osobę w rodzinie wieloosobowej
   */
  THRESHOLDS: {
    2024: { single: 776,  family: 600  },
    2025: { single: 1010, family: 823  },
    2026: { single: 1010, family: 823  },
    // Dodaj kolejny rok tutaj po aktualizacji rozporządzenia:
    // 2027: { single: XXXX, family: XXXX },
  },

  /** Mnożnik kryterium dochodowego dla osób zobowiązanych (art. 61 ust. 2 pkt 2) */
  THRESHOLD_MULTIPLIER: 3,

  /** Maksymalny udział pensjonariusza w kosztach (art. 61 ust. 2 pkt 1) */
  RESIDENT_MAX_SHARE: 0.70,

  /** Maksymalna liczba osób zobowiązanych możliwa do dodania w formularzu */
  MAX_PERSONS: 5,

  /** Rok domyślny przy ładowaniu kalkulatora */
  DEFAULT_YEAR: 2025,
};
