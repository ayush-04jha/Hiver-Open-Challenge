const { z } = require('zod');

const evaluationSchema = z.object({
  issueCoverage: z.object({
    score: z.number().min(0).max(10),
    reason: z.string()
  }),
  grounding: z.object({
    score: z.number().min(0).max(10),
    reason: z.string()
  }),
  actionability: z.object({
    score: z.number().min(0).max(10),
    reason: z.string()
  }),
  toneClarity: z.object({
    score: z.number().min(0).max(10),
    reason: z.string()
  })
});

module.exports = { evaluationSchema };
