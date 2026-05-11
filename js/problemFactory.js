import { getRandomInt, shuffleArray } from "./utils.js";
import { fillTemplateObject } from "./templateEngine.js";
import { evaluateComputedValues } from "./expressionEvaluator.js";

export function createProblemFromType(problemType) {
  const values = generateParamValues(problemType.params);
  const computedValues = evaluateComputedValues(problemType.computed ?? {}, values);

  const context = {
    ...values,
    ...computedValues
  };

  const filledTemplate = fillTemplateObject(problemType.template, context);
  const preparedChoices = prepareChoices(
    filledTemplate.choices ?? [],
    filledTemplate.answer,
    problemType.shuffleChoices ?? true
  );

  return {
    id: crypto.randomUUID(),
    problemTypeId: problemType.id,
    type: problemType.type,
    title: problemType.title,
    category: problemType.category,
    values: context,
    prompt: filledTemplate.prompt,
    choices: preparedChoices.choices,
    answer: preparedChoices.answer,
    steps: filledTemplate.steps
  };
}

function generateParamValues(params = {}) {
  const values = {};

  for (const [name, config] of Object.entries(params)) {
    if (config.type === "int") {
      values[name] = getRandomInt(config.min, config.max);
    } else {
      throw new Error(`Unsupported param type: ${config.type}`);
    }
  }

  return values;
}

function prepareChoices(choices, answer, shouldShuffle) {
  if (!Array.isArray(choices) || choices.length === 0) {
    return {
      choices: [],
      answer
    };
  }

  const normalizedChoices = choices.map((choice, index) => {
    return {
      ...choice,
      originalLabel: choice.label ?? String.fromCharCode(65 + index)
    };
  });

  const finalChoices = shouldShuffle
    ? shuffleArray(normalizedChoices)
    : normalizedChoices;

  const labeledChoices = finalChoices.map((choice, index) => {
    return {
      ...choice,
      label: String.fromCharCode(65 + index)
    };
  });

  const resolvedAnswer = resolveChoiceAnswer(answer, labeledChoices);

  return {
    choices: labeledChoices,
    answer: resolvedAnswer
  };
}

function resolveChoiceAnswer(answer, choices) {
  if (!answer || answer.kind !== "choice") {
    return answer;
  }

  const correctChoice = choices.find(choice => {
    return choice.id === answer.choiceId;
  });

  if (!correctChoice) {
    throw new Error(`Correct choice not found: ${answer.choiceId}`);
  }

  return {
    kind: "text",
    content: correctChoice.label,
    choiceId: answer.choiceId,
    choiceContent: correctChoice.content
  };
}