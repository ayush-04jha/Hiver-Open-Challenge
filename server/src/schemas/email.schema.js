const { z } = require('zod');

const emailInputSchema = z.object({
  email: z.string().min(10).max(5000)
});

module.exports = { emailInputSchema };
