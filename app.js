'use strict';

(function () {
  const { shuffleArray, gradeAnswer } = window.QuizCore;

  const state = {
    mode: null,
    questions: [],
    shuffledQuestionIds: [],
    currentIndex: 0,
    submitted: false,
    lastResult: null,
  };

  const elements = {
    appStatus: document.querySelector('[data-app-status]'),
    launcher: document.querySelector('[data-launcher]'),
    quizPanel: document.querySelector('[data-quiz-panel]'),
    completionPanel: document.querySelector('[data-completion-panel]'),
    modeButtons: document.querySelectorAll('[data-mode]'),
    currentMode: document.querySelector('[data-current-mode]'),
    questionLabel: document.querySelector('[data-question-label]'),
    questionText: document.querySelector('[data-question-text]'),
    answerInput: document.querySelector('[data-answer-input]'),
    answerHint: document.querySelector('[data-answer-hint]'),
    submitButton: document.querySelector('[data-submit]'),
    nextButton: document.querySelector('[data-next]'),
    restartButtons: document.querySelectorAll('[data-restart]'),
    backToLauncherButtons: document.querySelectorAll('[data-back-to-launcher]'),
    feedback: document.querySelector('[data-feedback]'),
    progress: document.querySelector('[data-progress]'),
    completionSummary: document.querySelector('[data-completion-summary]'),
  };

  function setStatus(message) {
    elements.appStatus.textContent = message;
  }

  function setModeButtonsDisabled(disabled) {
    elements.modeButtons.forEach((button) => {
      button.disabled = disabled;
    });
  }

  function getQuestionById(questionId) {
    return state.questions.find((question) => question.id === questionId) || null;
  }

  function getCurrentQuestion() {
    if (!state.shuffledQuestionIds.length) {
      return null;
    }

    const questionId = state.shuffledQuestionIds[state.currentIndex];
    return getQuestionById(questionId);
  }

  function updateProgress() {
    if (!state.shuffledQuestionIds.length) {
      elements.progress.textContent = '0/0';
      return;
    }

    const currentNumber = Math.min(state.currentIndex + 1, state.shuffledQuestionIds.length);
    elements.progress.textContent = `${currentNumber}/${state.shuffledQuestionIds.length}`;
  }

  function clearFeedback() {
    elements.feedback.hidden = true;
    elements.feedback.className = 'feedback';
    elements.feedback.textContent = '';
  }

  function renderQuestion() {
    const question = getCurrentQuestion();

    if (!question) {
      showCompletion();
      return;
    }

    state.submitted = false;
    state.lastResult = null;
    elements.answerInput.value = '';
    elements.answerInput.disabled = false;
    elements.submitButton.disabled = false;
    elements.nextButton.disabled = false;
    elements.nextButton.textContent = '送出答案';
    clearFeedback();
    updateProgress();

    const isEnglishToChinese = state.mode === 'en-to-zh';
    elements.currentMode.textContent = isEnglishToChinese ? '英翻中' : '中翻英';
    elements.questionLabel.textContent = isEnglishToChinese ? '英文題目' : '中文題目';
    elements.questionText.textContent = isEnglishToChinese ? question.en : question.zh;
    elements.answerHint.textContent = isEnglishToChinese ? '輸入中文答案' : '輸入英文答案';

    requestAnimationFrame(() => {
      elements.answerInput.focus();
    });
  }

  function showFeedback(result) {
    const answers = result.acceptedAnswers.join(' / ');
    elements.feedback.hidden = false;
    elements.feedback.className = result.isCorrect ? 'feedback feedback-correct' : 'feedback feedback-wrong';
    elements.feedback.textContent = result.isCorrect ? '答對了。' : `答錯了。正解：${answers}`;
  }

  function showCompletion() {
    elements.launcher.hidden = true;
    elements.quizPanel.hidden = true;
    elements.completionPanel.hidden = false;
    elements.completionSummary.textContent = `本輪 ${state.shuffledQuestionIds.length} 題已完成。`;
    elements.progress.textContent = `${state.shuffledQuestionIds.length}/${state.shuffledQuestionIds.length}`;
  }

  function startQuiz(mode) {
    state.mode = mode;
    state.currentIndex = 0;
    state.submitted = false;
    state.lastResult = null;
    state.shuffledQuestionIds = shuffleArray(state.questions.map((question) => question.id));

    elements.launcher.hidden = true;
    elements.completionPanel.hidden = true;
    elements.quizPanel.hidden = false;
    renderQuestion();
  }

  function handleSubmit() {
    if (state.submitted) {
      return;
    }

    const question = getCurrentQuestion();
    if (!question) {
      return;
    }

    const userInput = elements.answerInput.value;
    const result = gradeAnswer(state.mode, question, userInput);

    state.submitted = true;
    state.lastResult = result;
    elements.answerInput.disabled = true;
    elements.submitButton.disabled = true;
    elements.nextButton.disabled = false;
    elements.nextButton.textContent = '下一題';
    showFeedback(result);
  }

  function handleNext() {
    if (!state.submitted) {
      handleSubmit();
      return;
    }

    state.currentIndex += 1;
    if (state.currentIndex >= state.shuffledQuestionIds.length) {
      showCompletion();
      return;
    }

    renderQuestion();
  }

  function showLauncher() {
    state.mode = null;
    state.shuffledQuestionIds = [];
    state.currentIndex = 0;
    state.submitted = false;
    state.lastResult = null;

    elements.quizPanel.hidden = true;
    elements.completionPanel.hidden = true;
    elements.launcher.hidden = false;
    elements.answerInput.value = '';
    clearFeedback();
    updateProgress();

    requestAnimationFrame(() => {
      elements.modeButtons[0]?.focus();
    });
  }

  function handleInputKeydown(event) {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    if (state.submitted) {
      handleNext();
      return;
    }

    handleSubmit();
  }

  function bindEvents() {
    elements.modeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        startQuiz(button.dataset.mode);
      });
    });

    elements.submitButton.addEventListener('click', handleSubmit);
    elements.nextButton.addEventListener('click', handleNext);
    elements.answerInput.addEventListener('keydown', handleInputKeydown);

    elements.restartButtons.forEach((button) => {
      button.addEventListener('click', () => startQuiz(state.mode || 'en-to-zh'));
    });

    elements.backToLauncherButtons.forEach((button) => {
      button.addEventListener('click', showLauncher);
    });
  }

  async function loadQuestions() {
    try {
      const response = await fetch('./questions.json');
      if (!response.ok) {
        throw new Error(`Failed to load questions: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (Array.isArray(window.__QUESTIONS__) && window.__QUESTIONS__.length > 0) {
        return window.__QUESTIONS__;
      }

      throw error;
    }
  }

  async function init() {
    try {
      setStatus('題庫載入中...');
      setModeButtonsDisabled(true);
      state.questions = await loadQuestions();
      bindEvents();
      setModeButtonsDisabled(false);
      updateProgress();
      setStatus(`題庫已載入，共 ${state.questions.length} 題。`);
    } catch (error) {
      console.error(error);
      setModeButtonsDisabled(true);
      setStatus('題庫載入失敗，請確認 questions.json 是否存在。');
    }
  }

  init();
})();
