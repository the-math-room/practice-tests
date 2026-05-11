export function evaluateComputedValues(computed = {}, context = {}) {
  const result = {};

  for (const [name, expression] of Object.entries(computed)) {
    result[name] = evaluateExpression(expression, {
      ...context,
      ...result
    });
  }

  return result;
}

export function evaluateExpression(expression, context = {}) {
  const safeExpression = replaceVariables(expression, context);

  if (!isSafeMathExpression(safeExpression)) {
    throw new Error(`Unsafe or unsupported expression: ${expression}`);
  }

  return Function(`"use strict"; return (${safeExpression});`)();
}

function replaceVariables(expression, context) {
  return expression.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, variableName => {
    if (!(variableName in context)) {
      throw new Error(`Unknown variable: ${variableName}`);
    }

    return String(context[variableName]);
  });
}

function isSafeMathExpression(expression) {
  return /^[0-9+\-*/().\s]+$/.test(expression);
}
