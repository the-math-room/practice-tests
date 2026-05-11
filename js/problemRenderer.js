import { escapeHTML } from "./utils.js";

export function renderProblem(problem, container, state = {}) {
  const showAnswer = Boolean(state.showAnswer);
  const showSteps = Boolean(state.showSteps);

  container.innerHTML = `
    <article>
      <div class="problem-meta">
        <span class="problem-type">${escapeHTML(problem.type)}</span>
        ${problem.category ? `<span class="problem-category">${escapeHTML(problem.category)}</span>` : ""}
      </div>

      <h2>${escapeHTML(problem.title)}</h2>

      <div class="prompt">
        ${renderBlocks(problem.prompt)}
      </div>

      ${renderChoices(problem.choices)}

      <section class="answer-panel ${showAnswer ? "" : "hidden"}">
        <h3>Answer</h3>
        ${renderAnswer(problem.answer, problem.choices)}
      </section>

      <section class="steps-panel ${showSteps ? "" : "hidden"}">
        <h3>Steps</h3>
        ${renderBlocks(problem.steps)}
      </section>
    </article>
  `;
}

export function renderProblemSummary(problem, index) {
  return `
    <article class="problem-summary">
      <h3>${index + 1}. ${escapeHTML(problem.title)}</h3>

      <p class="muted">
        ${escapeHTML(problem.type)}
        ${problem.category ? ` · ${escapeHTML(problem.category)}` : ""}
      </p>

      <div class="prompt">
        ${renderBlocks(problem.prompt)}
      </div>

      ${renderChoices(problem.choices)}
    </article>
  `;
}

export function renderBlocks(blocks = []) {
  return blocks.map(renderBlock).join("");
}

export function renderBlock(block) {
  if (!block) return "";

  switch (block.kind) {
    case "text":
      return `<p>${escapeHTML(block.content)}</p>`;

    case "math":
      return `<div class="math">\\[${escapeHTML(block.content)}\\]</div>`;

    case "svg":
      // SVG content is intentionally rendered as HTML.
      // Keep this limited to trusted local problem files.
      return `<div class="svg-wrap">${block.content}</div>`;

    default:
      return `<p>${escapeHTML(block.content ?? "")}</p>`;
  }
}

export function renderChoices(choices = []) {
  if (!Array.isArray(choices) || choices.length === 0) {
    return "";
  }

  return `
    <div class="choices-wrap" aria-label="Answer choices">
      ${choices.map((choice, index) => {
        const label = choice.label ?? String.fromCharCode(65 + index);

        return `
          <div class="choice-item" data-label="${escapeHTML(label)}">
            <div class="choice-content">
              ${renderChoiceContent(choice)}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderChoiceContent(choice) {
  if (!choice) return "";

  if (typeof choice === "string") {
    return escapeHTML(choice);
  }

  if (choice.kind) {
    return renderBlock(choice);
  }

  if (Array.isArray(choice.content)) {
    return renderBlocks(choice.content);
  }

  return escapeHTML(choice.content ?? "");
}

function renderAnswer(answer, choices = []) {
  if (!answer) return "";

  if (answer.choiceContent) {
    return `
      <p><strong>${escapeHTML(answer.content)}.</strong> ${escapeHTML(answer.choiceContent)}</p>
    `;
  }

  const answerHTML = renderBlock(answer);

  if (answer.kind === "text") {
    const matchingChoice = findChoiceByLabel(answer.content, choices);

    if (matchingChoice) {
      return `
        ${answerHTML}
        <div class="answer-choice-detail">
          <strong>${escapeHTML(answer.content)}.</strong>
          ${renderChoiceContent(matchingChoice)}
        </div>
      `;
    }
  }

  return answerHTML;
}

function findChoiceByLabel(label, choices = []) {
  const normalizedLabel = String(label).trim().replace(".", "").toUpperCase();

  return choices.find((choice, index) => {
    const fallbackLabel = String.fromCharCode(65 + index);
    const choiceLabel = choice.label ?? fallbackLabel;

    return String(choiceLabel).trim().replace(".", "").toUpperCase() === normalizedLabel;
  });
}