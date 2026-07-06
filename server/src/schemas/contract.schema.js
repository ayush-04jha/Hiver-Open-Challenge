const { z } = require('zod');

const contractSchema = z.object({
  intent: z.string().min(1),
  customerNeeds: z.array(z.string()).min(1),
  requiredPoints: z.array(z.string()).min(1),
  forbiddenClaims: z.array(z.string()).min(0)
});

module.exports = { contractSchema };
