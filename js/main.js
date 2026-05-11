import { loadJSONFromIndex } from "./dataLoader.js";
import { Navigator } from "./navigation.js";
import { renderProblem, renderProblemSummary } from "./problemRenderer.js";
import { createProblemFromType } from "./problemFactory.js";
import {
  populatePracticeSetSelect,
  getProblemSlotsForPracticeSet
} from "./practiceSetSelector.js";
import { typesetMath } from "./utils.js";

let navigator;
let problemTypes = [];
let practiceSets = [];

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

  gotoDialog: document.getElementById("goto-dialog"),
  gotoList: document.getElementById("goto-list"),

  allProblemsContainer: document.getElementById("all-problems-container")
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

  els.allProblemsContainer.classList.add("hidden");
  els.showAllBtn.textContent = "Show All Problems";

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
      return `
        <button type="button" class="goto-item" data-index="${index}">
          <span>${index + 1}</span>
          <strong>${problem.title}</strong>
          <small>${problem.type}</small>
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
      <h2>All Problems in This Practice Set</h2>
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
      <p>${message}</p>
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
}

window.addEventListener("DOMContentLoaded", init);