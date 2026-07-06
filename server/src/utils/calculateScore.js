function calculateScore(evaluation) {
  const score =
    evaluation.issueCoverage.score * 0.30 +
    evaluation.grounding.score * 0.30 +
    evaluation.actionability.score * 0.20 +
    evaluation.toneClarity.score * 0.20;

  return Number((score * 10).toFixed(2));
}

module.exports = { calculateScore };
