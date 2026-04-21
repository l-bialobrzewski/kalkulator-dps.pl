/**
 * ui.js — Nawigacja kroków i zarządzanie osobami zobowiązanymi
 *
 * Odpowiada za:
 * - przełączanie widoku między krokami 1 → 2 → 3
 * - dodawanie / usuwanie bloków osób zobowiązanych
 * - odczyt danych z formularza i walidację
 * - reset kalkulatora
 */

'use strict';

/* ──────────────────────────────────────────────────────────────────────────
   STAN MODUŁU
   ────────────────────────────────────────────────────────────────────────── */

/** Licznik osób zobowiązanych (globalny ID, nie zmniejsza się przy usunięciu) */
let personCount = 0;

/* ──────────────────────────────────────────────────────────────────────────
   NAWIGACJA KROKÓW
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Aktywuje wskazany krok, aktualizuje pasek postępu i przewija do góry.
 * @param {1|2|3} stepNumber
 */
function setStep(stepNumber) {
  [1, 2, 3].forEach(i => {
    document.getElementById('step' + i).style.display = (i === stepNumber) ? '' : 'none';

    const indicator = document.getElementById('si-' + i);
    indicator.className =
      'step-item' +
      (i < stepNumber ? ' done'   : '') +
      (i === stepNumber ? ' active' : '');
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goStep1() {
  setStep(1);
}

function goStep2() {
  const cost   = parseFloat(document.getElementById('dpsCost').value);
  const income = parseFloat(document.getElementById('residentIncome').value);

  if (!cost || cost <= 0) {
    alert('Proszę wpisać koszt pobytu w DPS (np. 7000).');
    return;
  }
  if (isNaN(income) || income < 0) {
    alert('Proszę wpisać dochód pensjonariusza.');
    return;
  }

  // Podgląd opłaty pensjonariusza jeszcze na kroku 1
  const preview = calcResident(income, cost);
  const el      = document.getElementById('step1-preview');
  el.style.display = '';
  el.innerHTML = preview.coversFull
    ? `<strong>Pensjonariusz pokrywa pełny koszt.</strong>
       Opłata: ${pln(preview.fee)} (70% dochodu ≥ koszt DPS).
       Rodzina i gmina nie dopłacają.`
    : `<strong>Opłata pensjonariusza: ${pln(preview.fee)}</strong> (70% dochodu).
       Pozostaje do pokrycia: ${pln(preview.gap)}.
       Przejdź dalej, aby dodać osoby zobowiązane.`;

  setStep(2);
}

function goStep3() {
  const inputs = getInputs();
  if (!inputs) return;

  const results = calcAll(inputs);
  renderResults(inputs, results);
  setStep(3);
}

function resetAll() {
  document.getElementById('dpsCost').value            = '';
  document.getElementById('residentIncome').value     = '';
  document.getElementById('step1-preview').style.display = 'none';
  document.getElementById('persons-list').innerHTML   = '';
  personCount = 0;
  updateAddButton();
  setStep(1);
}

/* ──────────────────────────────────────────────────────────────────────────
   OSOBY ZOBOWIĄZANE
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Dodaje nowy blok osoby zobowiązanej do formularza.
 * Limit: CONFIG.MAX_PERSONS osób.
 */
function addPerson() {
  if (personCount >= CONFIG.MAX_PERSONS) {
    alert(`Maksymalnie ${CONFIG.MAX_PERSONS} osób zobowiązanych.`);
    return;
  }

  personCount++;
  const id  = personCount;
  const div = document.createElement('div');
  div.className = 'person-block';
  div.id        = 'person-' + id;

  div.innerHTML = buildPersonBlockHTML(id);
  document.getElementById('persons-list').appendChild(div);
  updateAddButton();
}

/**
 * Usuwa blok osoby zobowiązanej o podanym ID.
 * @param {number} id
 */
function removePerson(id) {
  const el = document.getElementById('person-' + id);
  if (el) el.remove();
  updateAddButton();
}

/**
 * Przełącza widoczność pola "Liczba osób w rodzinie"
 * w zależności od wybranego typu gospodarstwa.
 * @param {number} id
 */
function toggleMembers(id) {
  const type  = document.getElementById('type-' + id).value;
  const field = document.getElementById('members-field-' + id);
  field.style.display = (type === 'family') ? '' : 'none';
}

/**
 * Aktualizuje widoczność przycisku "Dodaj osobę zobowiązaną".
 */
function updateAddButton() {
  const btn            = document.getElementById('addPersonBtn');
  const visiblePersons = document.querySelectorAll('.person-block').length;
  btn.style.display    = (visiblePersons >= CONFIG.MAX_PERSONS) ? 'none' : '';
}

/**
 * Buduje HTML bloku osoby zobowiązanej.
 * @param {number} id
 * @returns {string}
 */
function buildPersonBlockHTML(id) {
  return `
    <div class="person-head">
      <div class="person-badge">${id}</div>
      <div class="person-title">Osoba zobowiązana #${id}</div>
      <button class="person-remove" onclick="removePerson(${id})" title="Usuń">×</button>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Relacja</label>
        <select id="label-${id}">
          <option value="Małżonek">Małżonek / małżonka</option>
          <option value="Dziecko">Dziecko (zstępny)</option>
          <option value="Rodzic">Rodzic (wstępny)</option>
          <option value="Inna osoba">Inna osoba</option>
        </select>
      </div>
      <div class="field">
        <label>Dochód netto / mies. [zł]</label>
        <input type="number" id="income-${id}" placeholder="np. 4500"
               min="0" step="1" inputmode="numeric">
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Typ gospodarstwa</label>
        <select id="type-${id}" onchange="toggleMembers(${id})">
          <option value="single">Osoba samotnie gospodarująca</option>
          <option value="family">Osoba w rodzinie (wieloosobowe)</option>
        </select>
      </div>
      <div class="field" id="members-field-${id}" style="display:none">
        <label>Liczba osób w rodzinie</label>
        <input type="number" id="members-${id}" value="2"
               min="2" max="12" step="1" inputmode="numeric">
      </div>
    </div>

    <div class="exemptions-section">
      <div class="exemptions-label">Przesłanki do zwolnienia (art. 64) — zaznacz jeśli dotyczą</div>
      <div class="checks">
        <label>
          <input type="checkbox" id="ex1-${id}">
          Płaci za pobyt innego członka rodziny w DPS lub ośrodku wsparcia
        </label>
        <label>
          <input type="checkbox" id="ex2-${id}">
          Długotrwała choroba, bezrobocie lub niepełnosprawność
        </label>
        <label>
          <input type="checkbox" id="ex3-${id}">
          Utrzymuje się z jednego świadczenia / wynagrodzenia razem z małżonkiem
        </label>
        <label>
          <input type="checkbox" id="ex4-${id}">
          Ciąża lub samotne wychowywanie dziecka
        </label>
        <label>
          <input type="checkbox" id="ex5-${id}">
          Sąd pozbawił pensjonariusza władzy rodzicielskiej nad tą osobą
          <em style="display:block;font-size:.78rem;color:var(--green);margin-top:2px">
            → zwolnienie obligatoryjne (art. 64a)
          </em>
        </label>
      </div>
    </div>`;
}

/* ──────────────────────────────────────────────────────────────────────────
   ODCZYT DANYCH Z FORMULARZA
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Odczytuje i waliduje wszystkie dane z formularza.
 * @returns {object|null}  obiekt inputs dla calcAll(), lub null przy błędzie
 */
function getInputs() {
  const cost   = parseFloat(document.getElementById('dpsCost').value);
  const income = parseFloat(document.getElementById('residentIncome').value);
  const year   = parseInt(document.getElementById('year').value, 10);

  if (!cost || isNaN(income)) {
    alert('Brakuje danych z kroku 1.');
    return null;
  }

  const persons = [];

  // Iteruj po aktualnie istniejących blokach (nie po personCount — może być luka po usunięciu)
  const blocks = document.querySelectorAll('.person-block');
  for (const block of blocks) {
    const id     = parseInt(block.id.replace('person-', ''), 10);
    const incEl  = document.getElementById('income-' + id);
    if (!incEl) continue;

    const pIncome = parseFloat(incEl.value);
    if (isNaN(pIncome) || pIncome < 0) {
      alert(`Wprowadź poprawny dochód dla osoby #${id}.`);
      return null;
    }

    const type    = document.getElementById('type-' + id).value;
    const members = type === 'family'
      ? (parseInt(document.getElementById('members-' + id).value, 10) || 2)
      : 1;
    const label   = document.getElementById('label-' + id).value;

    const exemptions = {
      e1:        document.getElementById('ex1-' + id).checked,
      e2:        document.getElementById('ex2-' + id).checked,
      e3:        document.getElementById('ex3-' + id).checked,
      e4:        document.getElementById('ex4-' + id).checked,
      mandatory: document.getElementById('ex5-' + id).checked,
    };

    persons.push({ id, label, income: pIncome, type, members, exemptions });
  }

  return { year, dpsCost: cost, residentIncome: income, persons };
}
