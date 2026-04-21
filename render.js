/**
 * render.js — Renderowanie wyników kalkulacji
 *
 * Odpowiada wyłącznie za budowanie i wstrzykiwanie HTML z wynikami.
 * Nie zawiera żadnej logiki obliczeniowej.
 */

'use strict';

/* ──────────────────────────────────────────────────────────────────────────
   GŁÓWNA FUNKCJA RENDERUJĄCA
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Wypełnia #results-card wygenerowanym HTML na podstawie wyników calcAll().
 *
 * @param {{ year, dpsCost, residentIncome, persons }} inputs
 * @param {{ resident, persons, family, municipality }}  res
 */
function renderResults(inputs, res) {
  const total = inputs.dpsCost;
  const pctR  = Math.round((res.resident.fee / total) * 100);
  const pctF  = Math.round((res.family       / total) * 100);
  const pctM  = Math.round((res.municipality / total) * 100);

  const personsHTML   = buildPersonsHTML(res);
  const residentNote  = res.resident.coversFull
    ? `<span style="color:var(--green)">Pokrywa pełny koszt — rodzina i gmina nie płacą.</span>`
    : `Pozostaje 30% dochodu: ${pln(res.resident.remainder)}`;

  document.getElementById('results-card').innerHTML = `
    <div class="card-title">Wynik kalkulacji</div>
    <div class="card-sub">
      Rok: <strong>${inputs.year}</strong>
      &nbsp;|&nbsp;
      Koszt DPS: <strong>${pln(inputs.dpsCost)}</strong> / miesiąc
    </div>

    ${buildSummaryHTML(res.resident.fee, res.family, res.municipality, pctR, pctF, pctM)}
    ${buildBarHTML(pctR, pctF, pctM)}

    <div class="detail-section">
      <div class="detail-title">Szczegóły — pensjonariusz</div>
      <div class="detail-row">
        <div class="d-label">Dochód miesięczny</div>
        <div class="d-val">${pln(inputs.residentIncome)}</div>
      </div>
      <div class="detail-row">
        <div class="d-label">Opłata (max 70% dochodu, art. 61 ust. 2 pkt 1)</div>
        <div class="d-val">${pln(res.resident.fee)}</div>
      </div>
      <div class="detail-row">
        <div class="d-label">Dochód po opłacie</div>
        <div class="d-val d-muted">${residentNote}</div>
      </div>
    </div>

    ${res.persons.length > 0
      ? `<div class="detail-section">
           <div class="detail-title">Osoby zobowiązane (art. 61 ust. 1 pkt 2)</div>
           ${personsHTML}
         </div>`
      : personsHTML
    }

    ${res.municipality > 0
      ? `<div class="detail-section">
           <div class="detail-title">Udział gminy (art. 61 ust. 1 pkt 3)</div>
           <div class="detail-row">
             <div class="d-label">Gmina pokrywa różnicę między kosztem DPS a sumą opłat mieszkańca i rodziny</div>
             <div class="d-val" style="color:var(--green)">${pln(res.municipality)}</div>
           </div>
         </div>`
      : ''
    }

    <div class="disclaimer" style="margin-top:1.25rem">
      <strong>Zastrzeżenie prawne:</strong>
      Wynik ma charakter szacunkowy i edukacyjny. Rzeczywistą wysokość opłat ustala
      organ administracyjny (MOPS/OPS) w decyzji administracyjnej na podstawie wywiadu
      środowiskowego. Na ostateczną kwotę wpływają m.in.: zaległości za poprzednie okresy,
      uznaniowe zwolnienia oraz inne okoliczności nieuchwycone przez kalkulator.
      W przypadku wątpliwości lub sporu z organem — skonsultuj się z radcą prawnym
      lub złóż odwołanie do SKO.
    </div>`;
}

/* ──────────────────────────────────────────────────────────────────────────
   FUNKCJE BUDUJĄCE FRAGMENTY HTML
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Trzy komórki zbiorcze: pensjonariusz / rodzina / gmina.
 */
function buildSummaryHTML(feeResident, feeFamily, feeMunicipality, pctR, pctF, pctM) {
  return `
    <div class="results-summary">
      <div class="summary-cell c-resident">
        <div class="s-lbl">Pensjonariusz</div>
        <div class="s-val">${pln(feeResident)}</div>
        <div class="s-sub">${pctR}% kosztu</div>
      </div>
      <div class="summary-cell c-family">
        <div class="s-lbl">Rodzina</div>
        <div class="s-val">${pln(feeFamily)}</div>
        <div class="s-sub">${pctF}% kosztu</div>
      </div>
      <div class="summary-cell c-municipality">
        <div class="s-lbl">Gmina</div>
        <div class="s-val">${pln(feeMunicipality)}</div>
        <div class="s-sub">${pctM}% kosztu</div>
      </div>
    </div>`;
}

/**
 * Wizualny pasek podziału odpłatności.
 */
function buildBarHTML(pctR, pctF, pctM) {
  return `
    <div class="bar-wrap">
      <div class="bar-seg bar-resident"     style="width:${pctR}%">${pctR > 8 ? pctR + '%' : ''}</div>
      <div class="bar-seg bar-family"       style="width:${pctF}%">${pctF > 8 ? pctF + '%' : ''}</div>
      <div class="bar-seg bar-municipality" style="width:${pctM}%">${pctM > 8 ? pctM + '%' : ''}</div>
    </div>`;
}

/**
 * Buduje HTML dla wszystkich osób zobowiązanych.
 * Jeśli lista jest pusta, zwraca stosowny komunikat.
 *
 * @param {{ resident, persons }} res
 * @returns {string}
 */
function buildPersonsHTML(res) {
  if (res.persons.length === 0) {
    return res.resident.coversFull
      ? `<div class="alert alert-success">
           Pensjonariusz pokrywa pełny koszt —
           rodzina i gmina nie są zobowiązane do dopłaty (art. 61 ust. 1 pkt 2 i 3).
         </div>`
      : `<div class="alert alert-info">
           Nie dodano osób zobowiązanych. Gmina pokrywa brakującą kwotę w całości.
         </div>`;
  }

  return res.persons.map(buildPersonResultHTML).join('');
}

/**
 * Buduje HTML dla wyniku jednej osoby zobowiązanej.
 *
 * @param {object} person  — wzbogacony obiekt z calcPerson()
 * @returns {string}
 */
function buildPersonResultHTML(person) {
  const { exemptions } = person;
  const isMandatory    = exemptions.mandatory;
  const pays           = !isMandatory && person.contribution > 0;

  const typeLabel  = person.type === 'single'
    ? 'osoba samotna'
    : `rodzina ${person.members}-os.`;

  const threshInfo = person.type === 'single'
    ? `Próg: ${pln(person.threshold)} (300% kryterium dla osoby samotnej)`
    : `Próg: ${pln(person.threshold)} (300% × ${person.members} osób × kryterium rodzinne)`;

  const statusLine = isMandatory
    ? '<strong>Zwolnienie obligatoryjne</strong> — opłata 0 zł.'
    : person.exceeds
      ? `Przekracza próg o ${pln(person.maxContrib)} → dopłata: ${pln(person.contribution)}`
      : `Dochód poniżej lub równy progowi → <strong>nie płaci</strong>.`;

  const exemptNote = buildExemptNoteHTML(exemptions);

  return `
    <div class="person-result ${pays ? '' : 'no-pay'}">
      <div class="person-result-head">
        <div class="person-result-name">
          #${person.id} ${person.label}
          <span style="font-weight:300;color:var(--muted)">(${typeLabel})</span>
        </div>
        <div class="person-result-amount ${pays ? 'amount-pay' : 'amount-nopay'}">
          ${pln(isMandatory ? 0 : person.contribution)}
        </div>
      </div>
      <div class="person-result-detail">
        Dochód: ${pln(person.income)} &nbsp;|&nbsp; ${threshInfo}<br>
        ${statusLine}
      </div>
      ${exemptNote}
    </div>`;
}

/**
 * Buduje notatkę o przesłankach do zwolnienia (art. 64 / 64a).
 *
 * @param {{ e1, e2, e3, e4, mandatory }} exemptions
 * @returns {string}
 */
function buildExemptNoteHTML(exemptions) {
  if (exemptions.mandatory) {
    return `
      <div class="alert alert-success" style="margin-top:.5rem;font-size:.78rem">
        Zwolnienie obligatoryjne (art. 64a) — organ musi zwolnić z opłaty na wniosek.
      </div>`;
  }

  const items = [];
  if (exemptions.e1) items.push('Płaci za innego członka rodziny w placówce');
  if (exemptions.e2) items.push('Choroba / bezrobocie / niepełnosprawność');
  if (exemptions.e3) items.push('Jedno świadczenie z małżonkiem');
  if (exemptions.e4) items.push('Ciąża / samotne wychowywanie dziecka');

  if (items.length === 0) return '';

  return `
    <div class="alert alert-warn" style="margin-top:.5rem;font-size:.78rem">
      <strong>Przesłanki do wniosku o zwolnienie (art. 64):</strong>
      ${items.map(item => `<br>• ${item}`).join('')}
      <br>Wniosek składa się w MOPS po przeprowadzeniu wywiadu środowiskowego.
      Decyzja ma charakter uznaniowy.
    </div>`;
}
