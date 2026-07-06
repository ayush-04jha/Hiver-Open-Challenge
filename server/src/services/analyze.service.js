const { emailInputSchema } = require('../schemas/email.schema');
const { contractSchema } = require('../schemas/contract.schema');
const { evaluationSchema } = require('../schemas/evaluation.schema');
const { extractContract } = require('./contractExtractor');
const { generateResponse } = require('./responseGenerator');
const { evaluateResponse } = require('./rubricEvaluator');
const { calculateScore } = require('../utils/calculateScore');

async function analyzeEmail(email) {
  // Step 1: Validate input
  const validationResult = emailInputSchema.safeParse({ email });
  if (!validationResult.success) {
    throw new Error(`Invalid email input: ${validationResult.error.message}`);
  }

  // Step 2: Extract contract
  let contract = await extractContract(email);
  
  // Validate contract with retry
  try {
    contractSchema.parse(contract);
  } catch (error) {
    console.log('Contract validation failed, retrying...');
    contract = await extractContract(email);
    contractSchema.parse(contract);
  }

  // Step 3: Generate response
  const generatedResponse = await generateResponse(email, contract);

  // Step 4: Evaluate response
  let evaluation = await evaluateResponse(email, contract, generatedResponse);
  
  // Validate evaluation with retry
  try {
    evaluationSchema.parse(evaluation);
  } catch (error) {
    console.log('Evaluation validation failed, retrying...');
    evaluation = await evaluateResponse(email, contract, generatedResponse);
    evaluationSchema.parse(evaluation);
  }

  // Step 5: Calculate deterministic score
  const qualityScore = calculateScore(evaluation);

  return {
    email,
    contract,
    generatedResponse,
    evaluation,
    qualityScore
  };
}

module.exports = { analyzeEmail };
