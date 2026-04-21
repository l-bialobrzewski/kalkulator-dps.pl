/**
 * calc.js — Silnik obliczeniowy kalkulatora DPS
 *
 * Moduł jest celowo odizolowany od DOM — nie odwołuje się do żadnych
 * elementów HTML. Przyjmuje i zwraca zwykłe obiekty JS, co umożliwia
 * testowanie jednostkowe bez przeglądarki.
 *
 * Podstawa prawna: art. 61–64a ustawy z dnia 12 marca 2004 r.
 * o pomocy społecznej (Dz.U. z 2024 r. poz. 1283)
 */

'use strict';

/* ──────────────────────────────────────────────────────────────────────────
   FUNKCJE POMOCNICZE
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Zaokrągla do dwóch miejsc po przecinku (groszowa precyzja).
 * @param {number} value
 * @returns {number}
 */
function round(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Formatuje liczbę jako kwotę PLN z polskim separatorem dziesiętnym.
 * @param {number} value
 * @returns {string}  np. "3 030,00 zł"
 */
function pln(value) {
  return value.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' zł';
}

/* ──────────────────────────────────────────────────────────────────────────
   OBLICZENIA
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Oblicza próg dochodowy dla osoby zobowiązanej.
 *
 * Wzór: mnożnik × kryterium × [1 | liczba członków rodziny]
 *
 * @param {'single'|'family'} householdType
 * @param {number}            memberCount   — liczba osób w rodzinie (ignorowane dla 'single')
 * @param {number}            year
 * @returns {number}
 */
function getThreshold(householdType, memberCount, year) {
  const thresholds = CONFIG.THRESHOLDS[year] || CONFIG.THRESHOLDS[CONFIG.DEFAULT_YEAR];
  const base       = householdType === 'single' ? thresholds.single : thresholds.family;
  const count      = householdType === 'single' ? 1 : Math.max(1, memberCount);
  return round(base * CONFIG.THRESHOLD_MULTIPLIER * count);
}

/**
 * Oblicza opłatę pensjonariusza (art. 61 ust. 2 pkt 1).
 *
 * Reguła: opłata = min(dochód × 70% ; koszt DPS)
 *
 * @param {number} income   — miesięczny dochód netto pensjonariusza
 * @param {number} dpsCost  — miesięczny koszt utrzymania w DPS
 * @returns {{ fee: number, remainder: number, coversFull: boolean, gap: number }}
 */
function calcResident(income, dpsCost) {
  const fee       = round(Math.min(income * CONFIG.RESIDENT_MAX_SHARE, dpsCost));
  const gap       = round(Math.max(0, dpsCost - fee));
  const remainder = round(income - fee);
  return {
    fee,
    remainder,
    coversFull: gap === 0,
    gap,
  };
}

/**
 * Oblicza udział jednej osoby zobowiązanej (art. 61 ust. 2 pkt 2).
 *
 * Reguła: jeśli dochód > próg → wpłaca max(dochód − próg) ale nie więcej
 *         niż pozostała luka do pokrycia.
 *
 * @param {{ id, label, income, type, members, exemptions }} person
 * @param {number} remainingGap — brakująca kwota przed tą osobą
 * @param {number} year
 * @returns {object}            — wzbogacony obiekt osoby o pola obliczeniowe
 */
function calcPerson(person, remainingGap, year) {
  const threshold = round(getThreshold(person.type, person.members, year));
  const exceeds   = person.income > threshold;

  if (!exceeds) {
    return { ...person, threshold, exceeds, maxContrib: 0, contribution: 0 };
  }

  const maxContrib   = round(person.income - threshold);
  const contribution = round(Math.min(maxContrib, remainingGap));

  return { ...person, threshold, exceeds, maxContrib, contribution };
}

/**
 * Główna funkcja kalkulacyjna — oblicza podział odpłatności
 * między pensjonariusza, osoby zobowiązane i gminę.
 *
 * @param {{
 *   year:           number,
 *   dpsCost:        number,
 *   residentIncome: number,
 *   persons:        Array
 * }} inputs
 * @returns {{
 *   resident:     object,
 *   persons:      Array,
 *   family:       number,
 *   municipality: number
 * }}
 */
function calcAll(inputs) {
  const resident = calcResident(inputs.residentIncome, inputs.dpsCost);

  // Pensjonariusz pokrywa pełen koszt — nikt inny nie płaci
  if (resident.coversFull) {
    return { resident, persons: [], family: 0, municipality: 0 };
  }

  let gap = resident.gap;
  const persons = [];

  for (const person of inputs.persons) {
    if (gap <= 0) {
      // Luka już pokryta — osoba nie jest zobowiązana do dopłaty
      persons.push({
        ...person,
        threshold:    round(getThreshold(person.type, person.members, inputs.year)),
        exceeds:      false,
        contribution: 0,
        maxContrib:   0,
      });
      continue;
    }

    const result = calcPerson(person, gap, inputs.year);
    persons.push(result);
    gap = round(Math.max(0, gap - result.contribution));
  }

  const family = round(persons.reduce((sum, p) => sum + p.contribution, 0));

  return {
    resident,
    persons,
    family,
    municipality: round(gap),
  };
}
