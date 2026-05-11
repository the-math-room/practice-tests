import { evaluateExpression } from "./expressionEvaluator.js";

export function fillTemplateObject(value, context) {
  if (typeof value === "string") {
    return fillTemplateString(value, context);
  }

  if (Array.isArray(value)) {
    return value.map(item => fillTemplateObject(item, context));
  }

  if (value && typeof value === "object") {
    const result = {};

    for (const [key, childValue] of Object.entries(value)) {
      result[key] = fillTemplateObject(childValue, context);
    }

    return result;
  }

  return value;
}

function fillTemplateString(template, context) {
  return template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_, expression) => {
    return evaluateExpression(expression.trim(), context);
  });
}
