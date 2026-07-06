require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { generateResponse } = require('../src/services/responseGenerator');
const { evaluateResponse } = require('../src/services/rubricEvaluator');
const { calculateScore } = require('../src/utils/calculateScore');

const BENCHMARK_PATH = path.join(__dirname, '../data/benchmark.json');
const RESULTS_PATH = path.join(__dirname, '../results/benchmark-results.json');

async function runBenchmark() {
  console.log('Loading benchmark dataset...');
  const benchmarkData = JSON.parse(fs.readFileSync(BENCHMARK_PATH, 'utf8'));
  const examples = benchmarkData.examples;
  
  console.log(`Running benchmark on ${examples.length} examples...`);
  
  const results = [];
  let totalIssueCoverage = 0;
  let totalGrounding = 0;
  let totalActionability = 0;
  let totalToneClarity = 0;
  let totalOverallScore = 0;
  
  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    console.log(`\nProcessing example ${i + 1}/${examples.length}: ${example.id}`);
    
    try {
      // Use ground truth contract directly (skip contract extraction in benchmark)
      const contract = example.groundTruth;
      
      console.log('Generating response...');
      const generatedResponse = await generateResponse(example.email, contract);
      
      console.log('Evaluating response...');
      const evaluation = await evaluateResponse(example.email, contract, generatedResponse);
      
      const overallScore = calculateScore(evaluation);
      
      const result = {
        id: example.id,
        category: example.category,
        email: example.email,
        generatedResponse,
        evaluation,
        overallScore
      };
      
      results.push(result);
      
      // Accumulate scores
      totalIssueCoverage += evaluation.issueCoverage.score;
      totalGrounding += evaluation.grounding.score;
      totalActionability += evaluation.actionability.score;
      totalToneClarity += evaluation.toneClarity.score;
      totalOverallScore += overallScore;
      
      console.log(`Score: ${overallScore}/100`);
    } catch (error) {
      console.error(`Error processing example ${example.id}:`, error.message);
      results.push({
        id: example.id,
        category: example.category,
        email: example.email,
        error: error.message
      });
    }
  }
  
  // Calculate averages
  const validResults = results.filter(r => !r.error);
  const count = validResults.length;
  
  const averageScores = {
    issueCoverage: count > 0 ? Number((totalIssueCoverage / count).toFixed(2)) : 0,
    grounding: count > 0 ? Number((totalGrounding / count).toFixed(2)) : 0,
    actionability: count > 0 ? Number((totalActionability / count).toFixed(2)) : 0,
    toneClarity: count > 0 ? Number((totalToneClarity / count).toFixed(2)) : 0
  };
  
  const overallBenchmarkScore = count > 0 ? Number((totalOverallScore / count).toFixed(2)) : 0;
  
  const benchmarkResults = {
    examplesEvaluated: count,
    averageScores,
    overallBenchmarkScore,
    results
  };
  
  console.log('\nBenchmark complete!');
  console.log(`Overall Benchmark Score: ${overallBenchmarkScore}/100`);
  console.log(`Average Scores:`);
  console.log(`  Issue Coverage: ${averageScores.issueCoverage}/10`);
  console.log(`  Grounding: ${averageScores.grounding}/10`);
  console.log(`  Actionability: ${averageScores.actionability}/10`);
  console.log(`  Tone & Clarity: ${averageScores.toneClarity}/10`);
  
  // Save results
  console.log(`\nSaving results to ${RESULTS_PATH}...`);
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(benchmarkResults, null, 2));
  console.log('Results saved successfully!');
}

runBenchmark().catch(console.error);
