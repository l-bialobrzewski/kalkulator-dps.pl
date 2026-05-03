(() => {
  "use strict";

  const CONFIG = {
    thresholds: {
      2024: { single: 776, family: 600 },
      2025: { single: 1010, family: 823 },
      2026: { single: 1010, family: 823 }
    },
    relationRank: {
      spouse: 1,
      descendant: 2,
      ascendant: 3,
      voluntary: 4
    },
    relationLabel: {
      spouse: "Małżonek",
      descendant: "Zstępny",
      ascendant: "Wstępny",
      voluntary: "Osoba dobrowolna"
    },
    exemptionWeights: {
      paysOtherCare: 18,
      severeCircumstances: 18,
      oneIncome: 12,
      pregnancyOrSingleParent: 16,
      fosterCareOrLimitedAuthority: 20,
      alimentClaimDismissed: 22,
      seriousFamilyBreach: 20
    }
  };

  const state = {
    nextPersonId: 1,
    lastResult: null
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    bindEvents();
    addPerson();
    calculateAndRender();
  }

  function cacheElements() {
    [
      "dps-form",
      "year",
      "dpsCost",
      "residentIncome",
      "therapeuticIncome",
      "residentVeteran",
      "people-list",
      "add-person",
      "load-demo",
      "noInterviewRisk",
      "evidenceQuality",
      "reset-form",
      "print-result",
      "result-empty",
      "result-content",
      "metrics",
      "payment-bar",
      "scenarios",
      "people-results",
      "ai-interpretation",
      "copy-json"
    ].forEach((id) => {
      els[toCamel(id)] = document.getElementById(id);
    });
  }

  function bindEvents() {
    els.dpsForm.addEventListener("input", calculateAndRender);
    els.dpsForm.addEventListener("change", calculateAndRender);
    els.addPerson.addEventListener("click", () => {
      addPerson();
      calculateAndRender();
    });
    els.loadDemo.addEventListener("click", loadDemo);
    els.resetForm.addEventListener("click", resetForm);
    els.printResult.addEventListener("click", () => window.print());
    els.copyJson.addEventListener("click", copyJson);
  }

  function toCamel(id) {
    return id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }

  function addPerson(data = {}) {
    const id = state.nextPersonId++;
    const card = document.createElement("article");
    card.className = "person-card";
    card.dataset.personId = String(id);
    card.innerHTML = `
      <div class="person-card-header">
        <span class="person-index">${id}</span>
        <span class="person-title">Osoba zobowiązana</span>
        <button class="remove-person" type="button" aria-label="Usuń osobę">Usuń</button>
      </div>

      <div class="field-grid">
        <label class="field">
          <span>Relacja</span>
          <select data-field="relation">
            <option value="spouse">Małżonek / małżonka</option>
            <option value="descendant">Dziecko, wnuk lub inny zstępny</option>
            <option value="ascendant">Rodzic, dziadek lub inny wstępny</option>
            <option value="voluntary">Inna osoba dobrowolna</option>
          </select>
        </label>
        <label class="field">
          <span>Dochód netto gospodarstwa</span>
          <input data-field="income" type="number" min="0" step="1" inputmode="decimal" placeholder="np. 5200">
        </label>
      </div>

      <div class="field-grid">
        <label class="field">
          <span>Typ gospodarstwa</span>
          <select data-field="householdType">
            <option value="single">Osoba samotnie gospodarująca</option>
            <option value="family">Osoba w rodzinie</option>
          </select>
        </label>
        <label class="field">
          <span>Liczba osób w gospodarstwie</span>
          <input data-field="members" type="number" min="1" max="20" step="1" inputmode="numeric" value="1">
        </label>
      </div>

      <div class="flag-grid" aria-label="Przesłanki do zwolnienia">
        ${flag("mandatoryParentalAuthority", "Art. 64a: pozbawienie władzy rodzicielskiej")}
        ${flag("mandatoryCrime", "Art. 64a: skazanie za przestępstwo")}
        ${flag("paysOtherCare", "Płaci za inną placówkę opieki")}
        ${flag("severeCircumstances", "Choroba, bezrobocie, niepełnosprawność lub zdarzenie losowe")}
        ${flag("oneIncome", "Rodzina utrzymuje się z jednego dochodu")}
        ${flag("pregnancyOrSingleParent", "Ciąża lub samotne wychowywanie dziecka")}
        ${flag("fosterCareOrLimitedAuthority", "Piecza zastępcza albo ograniczenie władzy rodzicielskiej")}
        ${flag("alimentClaimDismissed", "Wyrok oddalający alimenty")}
        ${flag("seriousFamilyBreach", "Rażące naruszenie obowiązków rodzinnych")}
      </div>
    `;

    els.peopleList.appendChild(card);
    card.querySelector(".remove-person").addEventListener("click", () => {
      card.remove();
      calculateAndRender();
    });
    card.querySelector('[data-field="householdType"]').addEventListener("change", (event) => {
      const members = card.querySelector('[data-field="members"]');
      members.value = event.target.value === "single" ? "1" : Math.max(2, Number(members.value || 2));
      calculateAndRender();
    });

    setPersonData(card, data);
  }

  function flag(name, label) {
    return `
      <label class="check-row">
        <input data-flag="${name}" type="checkbox">
        <span>${label}</span>
      </label>
    `;
  }

  function setPersonData(card, data) {
    if (data.relation) card.querySelector('[data-field="relation"]').value = data.relation;
    if (data.income !== undefined) card.querySelector('[data-field="income"]').value = data.income;
    if (data.householdType) card.querySelector('[data-field="householdType"]').value = data.householdType;
    if (data.members !== undefined) card.querySelector('[data-field="members"]').value = data.members;
    if (data.flags) {
      Object.entries(data.flags).forEach(([key, value]) => {
        const input = card.querySelector(`[data-flag="${key}"]`);
        if (input) input.checked = Boolean(value);
      });
    }
  }

  function collectInput() {
    const year = Number(els.year.value);
    const dpsCost = moneyValue(els.dpsCost.value);
    const residentIncome = moneyValue(els.residentIncome.value);
    const therapeuticIncome = moneyValue(els.therapeuticIncome.value);
    const people = [...els.peopleList.querySelectorAll(".person-card")].map((card, index) => {
      const flags = {};
      card.querySelectorAll("[data-flag]").forEach((flagInput) => {
        flags[flagInput.dataset.flag] = flagInput.checked;
      });
      const householdType = valueOf(card, "householdType");
      const membersRaw = numberValue(valueOf(card, "members"));
      return {
        id: index + 1,
        relation: valueOf(card, "relation"),
        income: moneyValue(valueOf(card, "income")),
        householdType,
        members: householdType === "single" ? 1 : Math.max(2, membersRaw || 2),
        flags
      };
    });

    return {
      year,
      thresholds: CONFIG.thresholds[year] || CONFIG.thresholds[2026],
      dpsCost,
      residentIncome,
      therapeuticIncome: Math.min(therapeuticIncome, residentIncome),
      residentVeteran: els.residentVeteran.checked,
      noInterviewRisk: els.noInterviewRisk.checked,
      evidenceQuality: els.evidenceQuality.value,
      people
    };
  }

  function valueOf(card, field) {
    const el = card.querySelector(`[data-field="${field}"]`);
    return el ? el.value : "";
  }

  function numberValue(value) {
    const parsed = Number(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function moneyValue(value) {
    return Math.max(0, round(numberValue(value)));
  }

  function calculateAndRender() {
    const input = collectInput();
    if (!input.dpsCost || !Number.isFinite(input.dpsCost)) {
      renderEmpty();
      return;
    }

    const result = calculate(input);
    state.lastResult = { input, result };
    renderResult(input, result);
  }

  function calculate(input) {
    const resident = calculateResident(input);
    const peopleWithCapacity = input.people.map((person) => {
      const capacity = calculatePersonCapacity(person, input.thresholds);
      return { ...person, ...capacity };
    });

    const allocatedPeople = allocatePeople(peopleWithCapacity, resident.gap);
    const evaluatedPeople = allocatedPeople.map((person) => ({
      ...person,
      exemption: evaluateExemption(person, input.evidenceQuality)
    }));

    const familyBaseline = round(sum(evaluatedPeople.map((person) => person.contribution)));
    const municipalityBaseline = round(Math.max(0, input.dpsCost - resident.fee - familyBaseline));
    const best = calculateBestCase(input, resident, evaluatedPeople);
    const worst = calculateWorstCase(input, resident, evaluatedPeople, familyBaseline);

    return {
      resident,
      people: evaluatedPeople,
      baseline: {
        resident: resident.fee,
        family: familyBaseline,
        municipality: municipalityBaseline,
        total: input.dpsCost
      },
      best,
      worst,
      interpretation: buildInterpretation(input, resident, evaluatedPeople, best, worst)
    };
  }

  function calculateResident(input) {
    const adjustedIncome = round(Math.max(0, input.residentIncome - input.therapeuticIncome * 0.5));
    const fee = round(Math.min(input.dpsCost, adjustedIncome * 0.7));
    return {
      income: input.residentIncome,
      adjustedIncome,
      therapeuticReduction: round(input.residentIncome - adjustedIncome),
      fee,
      retainedIncome: round(Math.max(0, input.residentIncome - fee)),
      gap: round(Math.max(0, input.dpsCost - fee)),
      coversFull: fee >= input.dpsCost
    };
  }

  function calculatePersonCapacity(person, thresholds) {
    const criterion = person.householdType === "single" ? thresholds.single : thresholds.family;
    const floor = round(criterion * 3 * person.members);
    const incomePerPerson = round(person.income / person.members);
    const thresholdPerPerson = round(criterion * 3);
    const aboveThreshold = person.income > floor && incomePerPerson > thresholdPerPerson;
    const hasMandatoryExemption = Boolean(person.flags.mandatoryParentalAuthority || person.flags.mandatoryCrime);
    const capacity = hasMandatoryExemption ? 0 : round(Math.max(0, person.income - floor));
    return {
      criterion,
      floor,
      incomePerPerson,
      thresholdPerPerson,
      aboveThreshold,
      hasMandatoryExemption,
      capacity
    };
  }

  function allocatePeople(people, gapAfterResident) {
    const sorted = [...people].sort((a, b) => {
      const rankDelta = CONFIG.relationRank[a.relation] - CONFIG.relationRank[b.relation];
      return rankDelta || a.id - b.id;
    });
    let remainingGap = gapAfterResident;
    const allocated = sorted.map((person) => ({ ...person, contribution: 0 }));
    const ranks = [...new Set(allocated.map((person) => CONFIG.relationRank[person.relation]))].sort((a, b) => a - b);

    for (const rank of ranks) {
      if (remainingGap <= 0) break;
      const group = allocated.filter((person) => CONFIG.relationRank[person.relation] === rank && person.capacity > 0);
      const groupCapacity = sum(group.map((person) => person.capacity));
      if (!groupCapacity) continue;

      if (groupCapacity <= remainingGap) {
        group.forEach((person) => {
          person.contribution = person.capacity;
        });
        remainingGap = round(remainingGap - groupCapacity);
      } else {
        group.forEach((person) => {
          person.contribution = round(remainingGap * (person.capacity / groupCapacity));
        });
        remainingGap = 0;
      }
    }

    return allocated.sort((a, b) => a.id - b.id);
  }

  function evaluateExemption(person, evidenceQuality) {
    if (person.hasMandatoryExemption) {
      return {
        score: 100,
        chance: 100,
        reliefShare: 1,
        label: "Zwolnienie obligatoryjne",
        badge: "ok",
        reasons: ["Art. 64a przewiduje całkowite zwolnienie po spełnieniu przesłanek i złożeniu wniosku."]
      };
    }

    if (person.contribution <= 0) {
      return {
        score: 0,
        chance: null,
        reliefShare: 0,
        label: "Nie dotyczy",
        badge: "neutral",
        reasons: ["Opłata wynosi 0 zł, bo dochód nie przekracza ustawowego limitu albo wcześniejsza grupa pokrywa lukę."]
      };
    }

    let score = 8;
    const reasons = [];

    Object.entries(CONFIG.exemptionWeights).forEach(([flagName, weight]) => {
      if (person.flags[flagName]) {
        score += weight;
        reasons.push(reasonFor(flagName));
      }
    });

    if (evidenceQuality === "basic") score += 8;
    if (evidenceQuality === "strong") score += 16;

    const retainedAfterContribution = person.income - person.contribution;
    const retainedRatio = person.floor > 0 ? retainedAfterContribution / person.floor : 99;
    if (retainedRatio < 1.08) score += 18;
    else if (retainedRatio < 1.25) score += 12;
    else if (retainedRatio < 1.6) score += 6;
    else if (retainedRatio > 2.4) score -= 8;

    score = clamp(Math.round(score), 5, 92);
    const reliefShare = score >= 78 ? 1 : score >= 62 ? .7 : score >= 45 ? .45 : score >= 30 ? .25 : .1;
    return {
      score,
      chance: score,
      reliefShare,
      label: chanceLabel(score),
      badge: score >= 62 ? "ok" : score >= 35 ? "warn" : "danger",
      reasons: reasons.length ? reasons : ["Brak silnych przesłanek z art. 64 poza ogólną sytuacją dochodową."]
    };
  }

  function reasonFor(flagName) {
    const labels = {
      paysOtherCare: "Opłata za inną placówkę opieki.",
      severeCircumstances: "Uzasadnione okoliczności: choroba, bezrobocie, niepełnosprawność albo zdarzenie losowe.",
      oneIncome: "Utrzymywanie rodziny z jednego świadczenia lub wynagrodzenia.",
      pregnancyOrSingleParent: "Ciąża lub samotne wychowywanie dziecka.",
      fosterCareOrLimitedAuthority: "Piecza zastępcza, rodzinny dom dziecka lub ograniczenie władzy rodzicielskiej.",
      alimentClaimDismissed: "Wyrok oddalający powództwo o alimenty.",
      seriousFamilyBreach: "Rażące naruszenie obowiązków alimentacyjnych lub rodzinnych."
    };
    return labels[flagName] || "Przesłanka do zwolnienia.";
  }

  function chanceLabel(score) {
    if (score >= 78) return "Bardzo wysoka";
    if (score >= 62) return "Wysoka";
    if (score >= 45) return "Średnia";
    if (score >= 30) return "Niska/średnia";
    return "Niska";
  }

  function calculateBestCase(input, resident, people) {
    const residentBest = input.residentVeteran ? 0 : resident.fee;
    const familyBest = round(sum(people.map((person) => {
      return person.contribution * (1 - person.exemption.reliefShare);
    })));
    return {
      resident: round(residentBest),
      family: familyBest,
      municipality: round(Math.max(0, input.dpsCost - residentBest - familyBest)),
      note: input.residentVeteran
        ? "Zakłada pozytywne rozpatrzenie art. 64b i najlepszy wariant zwolnień rodziny."
        : "Zakłada pozytywne rozpatrzenie najsilniejszych przesłanek z art. 64/64a."
    };
  }

  function calculateWorstCase(input, resident, people, familyBaseline) {
    const nonMandatory = people.filter((person) => !person.hasMandatoryExemption);
    const proceduralFamily = input.noInterviewRisk && nonMandatory.length
      ? resident.gap
      : familyBaseline;
    const family = round(Math.max(familyBaseline, proceduralFamily));
    return {
      resident: resident.fee,
      family,
      municipality: round(Math.max(0, input.dpsCost - resident.fee - family)),
      note: input.noInterviewRisk
        ? "Uwzględnia ryzyko decyzji przy braku wywiadu lub umowy; wymaga indywidualnej weryfikacji."
        : "Zakłada brak uznaniowego zwolnienia i pełne wykorzystanie ustawowej zdolności płatniczej."
    };
  }

  function buildInterpretation(input, resident, people, best, worst) {
    const payingPeople = people.filter((person) => person.contribution > 0);
    const strongest = [...people]
      .filter((person) => person.exemption.chance !== null)
      .sort((a, b) => b.exemption.score - a.exemption.score)[0];
    const lines = [];

    if (resident.coversFull) {
      lines.push("Mieszkaniec pokrywa pełny średni koszt DPS. Rodzina i gmina nie powinny dopłacać w modelu bazowym.");
    } else {
      lines.push(`Po opłacie mieszkańca pozostaje luka ${pln(resident.gap)}. Kalkulator rozdziela ją według kolejności: małżonek, zstępni, wstępni, a w ramach tej samej grupy proporcjonalnie do zdolności płatniczej.`);
    }

    if (!payingPeople.length && !resident.coversFull) {
      lines.push("Dodane osoby nie mają opłaty w modelu bazowym. Najczęstszy powód to dochód poniżej 300% właściwego kryterium lub brak luki do pokrycia.");
    }

    if (strongest) {
      lines.push(`Najsilniejszy argument o zwolnienie ma osoba #${strongest.id}: ${strongest.exemption.label.toLowerCase()}, scoring ${strongest.exemption.score}/100, szansa heurystyczna ${strongest.exemption.chance}%.`);
    }

    if (input.residentVeteran) {
      lines.push("Zaznaczono szczególną przesłankę mieszkańca z art. 64b. W najlepszym scenariuszu zmniejsza to udział mieszkańca, a nie powinno automatycznie podwyższać opłat innych osób.");
    }

    lines.push(`Przedział scenariuszowy dla rodziny: od ${pln(best.family)} w wariancie najlepszym do ${pln(worst.family)} w wariancie najgorszym.`);
    lines.push("Interpretacja jest regułowa i offline. Nie przesądza decyzji OPS/MOPS ani SKO.");
    return lines;
  }

  function renderEmpty() {
    els.resultEmpty.hidden = false;
    els.resultContent.hidden = true;
    state.lastResult = null;
  }

  function renderResult(input, result) {
    els.resultEmpty.hidden = true;
    els.resultContent.hidden = false;
    renderMetrics(input, result);
    renderPaymentBar(input, result.baseline);
    renderScenarios(result);
    renderPeople(input, result.people);
    els.aiInterpretation.innerHTML = result.interpretation.map((line) => `<p>${line}</p>`).join("");
  }

  function renderMetrics(input, result) {
    const metrics = [
      ["Mieszkaniec", result.baseline.resident, `${percent(result.baseline.resident, input.dpsCost)}% kosztu`],
      ["Rodzina", result.baseline.family, `${percent(result.baseline.family, input.dpsCost)}% kosztu`],
      ["Gmina", result.baseline.municipality, `${percent(result.baseline.municipality, input.dpsCost)}% kosztu`]
    ];
    els.metrics.innerHTML = metrics.map(([label, value, note]) => `
      <div class="metric-card">
        <div class="metric-label">${label}</div>
        <div class="metric-value">${pln(value)}</div>
        <div class="metric-note">${note}</div>
      </div>
    `).join("");
  }

  function renderPaymentBar(input, baseline) {
    const residentPct = percent(baseline.resident, input.dpsCost);
    const familyPct = percent(baseline.family, input.dpsCost);
    const municipalityPct = percent(baseline.municipality, input.dpsCost);
    const residentTrack = Math.max(1, residentPct);
    const familyTrack = Math.max(1, familyPct);
    const municipalityTrack = Math.max(1, municipalityPct);
    els.paymentBar.style.setProperty("--resident", `${residentTrack}fr`);
    els.paymentBar.style.setProperty("--family", `${familyTrack}fr`);
    els.paymentBar.style.setProperty("--municipality", `${municipalityTrack}fr`);
    els.paymentBar.innerHTML = `
      <span class="bar-resident">${residentPct}%</span>
      <span class="bar-family">${familyPct}%</span>
      <span class="bar-municipality">${municipalityPct}%</span>
    `;
  }

  function renderScenarios(result) {
    const scenarios = [
      ["Best case", result.best.family, result.best.note, "scenario-best"],
      ["Bazowy", result.baseline.family, "Ustawowa zdolność płatnicza bez uznaniowych zwolnień.", "scenario-base"],
      ["Worst case", result.worst.family, result.worst.note, "scenario-worst"]
    ];
    els.scenarios.innerHTML = scenarios.map(([label, amount, note, className]) => `
      <article class="scenario-card ${className}">
        <strong>${label}</strong>
        <div class="amount">${pln(amount)}</div>
        <p>${note}</p>
      </article>
    `).join("");
  }

  function renderPeople(input, people) {
    if (!people.length) {
      els.peopleResults.innerHTML = `<div class="person-result"><p>Nie dodano osób zobowiązanych. Brakującą kwotę w modelu bazowym pokrywa gmina.</p></div>`;
      return;
    }

    els.peopleResults.innerHTML = people.map((person) => {
      const chance = person.exemption.chance === null ? "nie dotyczy" : `${person.exemption.chance}%`;
      const badgeClass = `badge-${person.exemption.badge}`;
      const thresholdText = person.householdType === "single"
        ? `300% kryterium osoby samotnej: ${pln(person.floor)}`
        : `300% kryterium rodzinnego: ${pln(person.floor)} dla ${person.members} os.`;
      return `
        <article class="person-result">
          <div class="person-result-head">
            <div>
              <div class="person-result-title">#${person.id} ${CONFIG.relationLabel[person.relation]}</div>
              <div class="person-result-meta">${thresholdText}</div>
            </div>
            <div class="person-result-amount">${pln(person.contribution)}</div>
          </div>
          <p>Dochód: ${pln(person.income)} · zdolność ustawowa: ${pln(person.capacity)} · po opłacie: ${pln(Math.max(0, person.income - person.contribution))}</p>
          <p><span class="badge ${badgeClass}">${person.exemption.label}</span> Szansa na zwolnienie: <strong>${chance}</strong></p>
          <div class="score-row">
            <span>Scoring</span>
            <span class="score-track"><span class="score-fill" style="--score:${person.exemption.score}%"></span></span>
            <strong>${person.exemption.score}/100</strong>
          </div>
          <p>${person.exemption.reasons.join(" ")}</p>
        </article>
      `;
    }).join("");
  }

  function resetForm() {
    els.dpsForm.reset();
    els.peopleList.innerHTML = "";
    state.nextPersonId = 1;
    addPerson();
    calculateAndRender();
  }

  function loadDemo() {
    els.dpsForm.reset();
    els.peopleList.innerHTML = "";
    state.nextPersonId = 1;
    els.year.value = "2026";
    els.dpsCost.value = "7200";
    els.residentIncome.value = "2600";
    els.therapeuticIncome.value = "0";
    els.evidenceQuality.value = "strong";
    addPerson({
      relation: "descendant",
      income: 5600,
      householdType: "single",
      members: 1,
      flags: { severeCircumstances: true, seriousFamilyBreach: true }
    });
    addPerson({
      relation: "descendant",
      income: 8200,
      householdType: "family",
      members: 4,
      flags: { pregnancyOrSingleParent: true }
    });
    calculateAndRender();
  }

  async function copyJson() {
    if (!state.lastResult) return;
    const payload = JSON.stringify(state.lastResult, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      els.copyJson.textContent = "Skopiowano";
      setTimeout(() => {
        els.copyJson.textContent = "Kopiuj JSON";
      }, 1400);
    } catch (error) {
      console.warn("Nie udało się skopiować wyniku", error);
      window.prompt("Skopiuj wynik JSON:", payload);
    }
  }

  function sum(values) {
    return round(values.reduce((total, value) => total + Number(value || 0), 0));
  }

  function round(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function percent(value, total) {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  }

  function pln(value) {
    return Number(value || 0).toLocaleString("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + " zł";
  }

  window.DpsCalculator = {
    calculate,
    CONFIG
  };
})();
