import { loadJSONFromIndex } from "./dataLoader.js";
import { Navigator } from "./navigation.js";
import { renderProblem, renderProblemSummary } from "./problemRenderer.js";
import { createProblemFromType } from "./problemFactory.js";
import {
  populatePracticeSetSelect,
  getProblemSlotsForPracticeSet
} from "./practiceSetSelector.js";
import { escapeHTML, typesetMath } from "./utils.js";

let navigator;
let problemTypes = [];
let practiceSets = [];
let currentPracticeSet = null;
let currentVariantGroups = [];

const els = {
  practiceSetSelect: document.getElementById("practice-set-select"),

  problemCard: document.getElementById("problem-card"),
  problemCount: document.getElementById("problem-count"),

  prevBtn: document.getElementById("prev-btn"),
  nextBtn: document.getElementById("next-btn"),
  gotoBtn: document.getElementById("goto-btn"),

  showAnswerBtn: document.getElementById("show-answer-btn"),
  showStepsBtn: document.getElementById("show-steps-btn"),
  newProblemBtn: document.getElementById("new-problem-btn"),
  showAllBtn: document.getElementById("show-all-btn"),
  showVariantsBtn: document.getElementById("show-variants-btn"),

  gotoDialog: document.getElementById("goto-dialog"),
  gotoList: document.getElementById("goto-list"),

  allProblemsContainer: document.getElementById("all-problems-container"),
  allVariantsContainer: document.getElementById("all-variants-container")
};

async function init() {
  try {
    problemTypes = await loadJSONFromIndex(
      "./data/problemTypes/index.json",
      "./data/problemTypes"
    );

    practiceSets = await loadJSONFromIndex(
      "./data/practiceSets/index.json",
      "./data/practiceSets"
    );

    populatePracticeSetSelect(els.practiceSetSelect, practiceSets);

    els.practiceSetSelect.addEventListener("change", () => {
      loadPracticeSet(els.practiceSetSelect.value);
    });

    bindEvents();

    if (practiceSets.length > 0) {
      loadPracticeSet(practiceSets[0].id);
    } else {
      showFatalError("No practice sets were found.");
    }
  } catch (error) {
    console.error(error);
    showFatalError(error.message);
  }
}

function loadPracticeSet(practiceSetId) {
  currentPracticeSet = practiceSets.find(practiceSet => {
    return practiceSet.id === practiceSetId;
  });

  if (!currentPracticeSet) {
    showFatalError(`Practice set not found: ${practiceSetId}`);
    return;
  }

  const problemSlots = getProblemSlotsForPracticeSet(
    practiceSetId,
    practiceSets,
    problemTypes
  );

  const problems = problemSlots.map(slot => {
    return createProblemFromSlot(slot);
  });

  navigator = new Navigator(problems, renderProblem, els.problemCard);
  navigator.render();

  currentVariantGroups = [];

  els.allProblemsContainer.classList.add("hidden");
  els.allVariantsContainer.classList.add("hidden");

  els.showAllBtn.textContent = "Show All Problems";
  els.showVariantsBtn.textContent = "Show All Variants";

  renderGotoList();
  updateUI();
}

function createProblemFromSlot(slot) {
  const problem = createProblemFromType(slot.problemType);

  problem.practiceSetSlot = {
    type: slot.type,
    sectionTitle: slot.sectionTitle ?? null,
    poolTitle: slot.poolTitle ?? null,
    poolProblemTypeIds: slot.poolProblemTypeIds ?? null
  };

  return problem;
}

function bindEvents() {
  els.prevBtn.addEventListener("click", () => {
    navigator.prev();
    updateUI();
  });

  els.nextBtn.addEventListener("click", () => {
    navigator.next();
    updateUI();
  });

  els.gotoBtn.addEventListener("click", () => {
    els.gotoDialog.showModal();
  });

  els.showAnswerBtn.addEventListener("click", () => {
    const isVisible = navigator.toggleAnswer();
    updateToggleButton(els.showAnswerBtn, isVisible, "Answer");
  });

  els.showStepsBtn.addEventListener("click", () => {
    const isVisible = navigator.toggleSteps();
    updateToggleButton(els.showStepsBtn, isVisible, "Steps");
  });

  els.newProblemBtn.addEventListener("click", () => {
    replaceCurrentProblem();
  });

  els.showAllBtn.addEventListener("click", toggleAllProblems);
  els.showVariantsBtn.addEventListener("click", toggleAllVariants);
}

function replaceCurrentProblem() {
  const currentProblem = navigator.currentProblem;

  if (currentProblem.practiceSetSlot?.type === "pool") {
    replaceCurrentProblemFromPool(currentProblem);
  } else {
    replaceCurrentProblemSameType(currentProblem);
  }

  renderGotoList();
  updateUI();
}

function replaceCurrentProblemFromPool(currentProblem) {
  const poolProblemTypeIds = currentProblem.practiceSetSlot.poolProblemTypeIds;

  if (!Array.isArray(poolProblemTypeIds) || poolProblemTypeIds.length === 0) {
    replaceCurrentProblemSameType(currentProblem);
    return;
  }

  const currentIndex = poolProblemTypeIds.indexOf(currentProblem.problemTypeId);

  const nextIndex = currentIndex === -1
    ? 0
    : (currentIndex + 1) % poolProblemTypeIds.length;

  const nextProblemTypeId = poolProblemTypeIds[nextIndex];
  const nextProblemType = findProblemTypeById(nextProblemTypeId);

  if (!nextProblemType) {
    console.error(`Problem type not found: ${nextProblemTypeId}`);
    return;
  }

  const nextProblem = createProblemFromType(nextProblemType);

  nextProblem.practiceSetSlot = {
    ...currentProblem.practiceSetSlot
  };

  navigator.replaceCurrentProblem(nextProblem);
}

function replaceCurrentProblemSameType(currentProblem) {
  const problemType = findProblemTypeById(currentProblem.problemTypeId);

  if (!problemType) {
    console.error(`Problem type not found: ${currentProblem.problemTypeId}`);
    return;
  }

  const newProblem = createProblemFromType(problemType);

  newProblem.practiceSetSlot = {
    ...currentProblem.practiceSetSlot
  };

  navigator.replaceCurrentProblem(newProblem);
}

function findProblemTypeById(problemTypeId) {
  return problemTypes.find(type => {
    return type.id === problemTypeId;
  });
}

function renderGotoList() {
  els.gotoList.innerHTML = navigator.problems
    .map((problem, index) => {
      const poolLabel = problem.practiceSetSlot?.poolTitle
        ? `<small>${escapeHTML(problem.practiceSetSlot.poolTitle)}</small>`
        : `<small>${escapeHTML(problem.type)}</small>`;

      return `
        <button type="button" class="goto-item" data-index="${index}">
          <span>${index + 1}</span>
          <strong>${escapeHTML(problem.title)}</strong>
          ${poolLabel}
        </button>
      `;
    })
    .join("");

  els.gotoList.querySelectorAll(".goto-item").forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      navigator.goTo(index);
      els.gotoDialog.close();
      updateUI();
    });
  });
}

async function toggleAllProblems() {
  const isHidden = els.allProblemsContainer.classList.contains("hidden");

  if (isHidden) {
    els.allProblemsContainer.innerHTML = `
      <h2>Generated Practice Final</h2>
      <p class="muted">These are the questions currently selected for this practice set.</p>
      ${navigator.problems.map(renderProblemSummary).join("")}
    `;

    els.allProblemsContainer.classList.remove("hidden");
    els.showAllBtn.textContent = "Hide All Problems";

    await typesetMath(els.allProblemsContainer);
  } else {
    els.allProblemsContainer.classList.add("hidden");
    els.showAllBtn.textContent = "Show All Problems";
  }
}

async function toggleAllVariants() {
  const isHidden = els.allVariantsContainer.classList.contains("hidden");

  if (isHidden) {
    if (currentVariantGroups.length === 0) {
      currentVariantGroups = createAllVariantGroups(currentPracticeSet);
    }

    els.allVariantsContainer.innerHTML = `
      <h2>All Question Variants</h2>
      <p class="muted">
        These are all available variants from the pools in this practice set.
      </p>
      ${currentVariantGroups.map(renderVariantGroup).join("")}
    `;

    els.allVariantsContainer.classList.remove("hidden");
    els.showVariantsBtn.textContent = "Hide All Variants";

    await typesetMath(els.allVariantsContainer);
  } else {
    els.allVariantsContainer.classList.add("hidden");
    els.showVariantsBtn.textContent = "Show All Variants";
  }
}

function renderVariantGroup(group) {
  return `
    <section class="variant-group">
      <h3>${escapeHTML(group.title)}</h3>
      <p class="muted">${escapeHTML(group.subtitle)}</p>
      ${group.problems.map(renderProblemSummary).join("")}
    </section>
  `;
}

function createAllVariantGroups(practiceSet) {
  if (!practiceSet || !Array.isArray(practiceSet.sections)) {
    return [];
  }

  return practiceSet.sections.flatMap(section => {
    if (!Array.isArray(section.items)) {
      return [];
    }

    return section.items
      .filter(item => item.type === "pool")
      .map(pool => {
        const problems = pool.items.map(poolItem => {
          const problemType = findProblemTypeById(poolItem.problemTypeId);

          if (!problemType) {
            throw new Error(`Problem type not found: ${poolItem.problemTypeId}`);
          }

          const problem = createProblemFromType(problemType);

          problem.practiceSetSlot = {
            type: "pool",
            sectionTitle: section.title,
            poolTitle: pool.title,
            poolProblemTypeIds: pool.items.map(item => item.problemTypeId)
          };

          return problem;
        });

        return {
          title: pool.title,
          subtitle: createVariantGroupSubtitle(section, pool),
          problems
        };
      });
  });
}

function createVariantGroupSubtitle(section, pool) {
  const standards = Array.isArray(pool.standards)
    ? pool.standards.join(", ")
    : "";

  if (standards) {
    return `${section.title} · ${standards}`;
  }

  return section.title;
}

function updateUI() {
  if (!navigator || navigator.problems.length === 0) {
    els.problemCount.textContent = "No problems loaded";

    els.prevBtn.disabled = true;
    els.nextBtn.disabled = true;
    els.gotoBtn.disabled = true;
    els.showAnswerBtn.disabled = true;
    els.showStepsBtn.disabled = true;
    els.newProblemBtn.disabled = true;
    els.showAllBtn.disabled = true;
    els.showVariantsBtn.disabled = true;

    return;
  }

  els.problemCount.textContent = `Problem ${navigator.currentIndex + 1} of ${navigator.problems.length}`;

  els.prevBtn.disabled = navigator.currentIndex === 0;
  els.nextBtn.disabled = navigator.currentIndex === navigator.problems.length - 1;
  els.gotoBtn.disabled = navigator.problems.length === 0;

  els.showAnswerBtn.disabled = false;
  els.showStepsBtn.disabled = false;
  els.newProblemBtn.disabled = false;
  els.showAllBtn.disabled = false;
  els.showVariantsBtn.disabled = false;

  updateToggleButton(els.showAnswerBtn, navigator.showAnswer, "Answer");
  updateToggleButton(els.showStepsBtn, navigator.showSteps, "Steps");
}

function updateToggleButton(button, isVisible, label) {
  button.textContent = isVisible ? `Hide ${label}` : `Show ${label}`;
  button.setAttribute("aria-pressed", String(isVisible));
}

function showFatalError(message) {
  els.problemCard.innerHTML = `
    <article>
      <h2>Something went wrong</h2>
      <p>${escapeHTML(message)}</p>
      <p class="muted">Check that your data files exist and that your JSON is valid.</p>
    </article>
  `;

  els.problemCount.textContent = "Error loading practice set";

  els.prevBtn.disabled = true;
  els.nextBtn.disabled = true;
  els.gotoBtn.disabled = true;
  els.showAnswerBtn.disabled = true;
  els.showStepsBtn.disabled = true;
  els.newProblemBtn.disabled = true;
  els.showAllBtn.disabled = true;
  els.showVariantsBtn.disabled = true;
}

window.addEventListener("DOMContentLoaded", init);