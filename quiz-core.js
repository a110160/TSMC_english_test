(function (globalScope) {
  'use strict';

  const CHINESE_PUNCTUATION_MAP = {
    '，': ',',
    '。': '.',
    '：': ':',
    '；': ';',
    '！': '!',
    '？': '?',
    '（': '(',
    '）': ')',
    '「': '"',
    '」': '"',
    '『': '"',
    '』': '"',
    '、': ',',
  };

  function collapseWhitespace(value) {
    return String(value || '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function normalizeEnglishAnswer(value) {
    return collapseWhitespace(value).toLowerCase();
  }

  function normalizeChineseAnswer(value) {
    const collapsed = collapseWhitespace(value);
    return Array.from(collapsed)
      .map((character) => CHINESE_PUNCTUATION_MAP[character] || character)
      .join('')
      .replace(/\s+/g, '');
  }

  function shuffleArray(items, randomFn) {
    const random = typeof randomFn === 'function' ? randomFn : Math.random;
    const result = items.slice();

    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      const currentValue = result[index];
      result[index] = result[swapIndex];
      result[swapIndex] = currentValue;
    }

    return result;
  }

  function gradeAnswer(mode, question, userInput) {
    if (!question) {
      throw new Error('question is required');
    }

    if (mode === 'en-to-zh') {
      const expected = normalizeChineseAnswer(question.zh);
      const actual = normalizeChineseAnswer(userInput);
      return {
        isCorrect: actual !== '' && actual === expected,
        acceptedAnswers: [question.zh],
      };
    }

    if (mode === 'zh-to-en') {
      const normalizedInput = normalizeEnglishAnswer(userInput);
      const acceptedAnswers = question.acceptedEn.slice();
      const isCorrect = normalizedInput !== '' && acceptedAnswers.some((answer) => normalizeEnglishAnswer(answer) === normalizedInput);

      return {
        isCorrect,
        acceptedAnswers,
      };
    }

    throw new Error(`Unsupported mode: ${mode}`);
  }

  const QuizCore = {
    normalizeEnglishAnswer,
    normalizeChineseAnswer,
    shuffleArray,
    gradeAnswer,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizCore;
  }

  globalScope.QuizCore = QuizCore;
})(typeof window !== 'undefined' ? window : globalThis);
