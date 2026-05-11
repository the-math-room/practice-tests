import { typesetMath } from "./utils.js";

export class Navigator {
  constructor(problems, renderFn, container) {
    this.problems = problems;
    this.renderFn = renderFn;
    this.container = container;

    this.currentIndex = 0;
    this.showAnswer = false;
    this.showSteps = false;
  }

  async render() {
    this.renderFn(this.currentProblem, this.container, {
      showAnswer: this.showAnswer,
      showSteps: this.showSteps
    });

    await typesetMath(this.container);
  }

  get currentProblem() {
    return this.problems[this.currentIndex];
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.resetToggles();
      this.render();
    }
  }

  next() {
    if (this.currentIndex < this.problems.length - 1) {
      this.currentIndex++;
      this.resetToggles();
      this.render();
    }
  }

  goTo(index) {
    if (index >= 0 && index < this.problems.length) {
      this.currentIndex = index;
      this.resetToggles();
      this.render();
    }
  }

  toggleAnswer() {
    this.showAnswer = !this.showAnswer;
    this.render();
    return this.showAnswer;
  }

  toggleSteps() {
    this.showSteps = !this.showSteps;
    this.render();
    return this.showSteps;
  }

  replaceCurrentProblem(problem) {
    this.problems[this.currentIndex] = problem;
    this.resetToggles();
    this.render();
  }

  resetToggles() {
    this.showAnswer = false;
    this.showSteps = false;
  }
}
