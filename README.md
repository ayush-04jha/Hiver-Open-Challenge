# Grounded AI Email Response Generator

A GenAI system that generates professional customer-support email replies and evaluates their quality using a structured, rubric-based evaluation pipeline.

The system can process arbitrary customer emails, generate grounded responses, provide per-response evaluation scores with reasons, and measure overall performance on a fixed benchmark dataset.

## Architecture

```text
LIVE MODE

Customer Email
      ↓
Response Contract Extraction
      ↓
Required Points + Forbidden Claims
      ↓
Response Generation
      ↓
Rubric-Based Evaluation
      ↓
Per-Metric Scores + Reasons
      ↓
Deterministic Overall Score


BENCHMARK MODE

Fixed Benchmark Dataset
      ↓
Customer Email + Manual Ground Truth
      ↓
Response Generation
      ↓
Evaluation Against Ground Truth
      ↓
Per-Response Scores
      ↓
Aggregate Benchmark Score
```

## Approach

Directly generating a reply from a customer email can cause an LLM to miss important concerns or invent unsupported information.

The system therefore first converts the email into a structured **Response Contract**:

```json
{
  "intent": "duplicate_charge",
  "customerNeeds": [
    "resolve duplicate charge",
    "request refund"
  ],
  "requiredPoints": [
    "acknowledge the duplicate charge",
    "acknowledge the customer's request",
    "provide a safe next step"
  ],
  "forbiddenClaims": [
    "claim that a refund was already processed",
    "invent refund timelines",
    "invent company policies"
  ]
}
```

The response generator receives both the original email and this contract.

It is instructed to:

- Address all required points.
- Avoid all forbidden claims.
- Never claim that an action was performed without supporting context.
- Avoid inventing policies, timelines, prices, or account information.
- Provide a safe and useful next step.
- Keep the response professional and concise.

For unseen emails, the contract is extracted dynamically.

For benchmark evaluation, fixed manually reviewed annotations are used as ground truth.

## Dataset

The project includes a purpose-built benchmark dataset containing 20 customer-support emails from multiple categories, including:

- Billing and refunds (4 examples)
- Account and authentication (4 examples)
- Technical issues (4 examples)
- Subscription and cancellation (4 examples)
- Complaints and general support (4 examples)

Each benchmark example contains:

```json
{
  "id": "billing_01",
  "category": "billing",
  "email": "I was charged twice for my subscription. Please refund the duplicate payment.",
  "groundTruth": {
    "intent": "duplicate_charge",
    "customerNeeds": [
      "resolve duplicate charge",
      "request refund"
    ],
    "requiredPoints": [
      "acknowledge the duplicate charge",
      "acknowledge the refund request",
      "provide a safe next step"
    ],
    "forbiddenClaims": [
      "claim the refund was already processed",
      "invent refund timelines",
      "invent company policies"
    ]
  }
}
```

The benchmark annotations are fixed before evaluation and are not generated dynamically during benchmark execution.

AI may be used to assist initial dataset drafting, but all included examples and annotations are manually reviewed.

The dataset is used only for evaluation. The application can accept arbitrary customer emails that are not present in the dataset.

## Evaluation Methodology

Open-ended email responses cannot be reliably evaluated using exact string matching because multiple differently worded responses may be equally correct.

Instead, every generated response is evaluated against explicit expected behavior using four dimensions:

| Metric | Weight | What It Measures |
|---|---:|---|
| Issue Coverage | 30% | Whether the response addresses the customer's needs and required response points |
| Grounding | 30% | Whether the response avoids unsupported actions, policies, timelines, or facts |
| Actionability | 20% | Whether the customer receives a useful and safe next step |
| Tone & Clarity | 20% | Whether the response is professional, concise, and understandable |

Each metric receives a score from `0` to `10` along with a short justification.

The final score is calculated as:

```text
Overall Score =
    0.30 × Issue Coverage
  + 0.30 × Grounding
  + 0.20 × Actionability
  + 0.20 × Tone & Clarity
```

The result is converted to a `0–100` scale.

### Why These Metrics?

**Issue Coverage and Grounding receive the highest weights** because the two most important failure modes are:

1. Failing to address the customer's actual problem.
2. Providing fabricated or unsupported information.

A professional-sounding response should not receive a high score if it ignores customer requirements or falsely claims that refunds, cancellations, account changes, or other actions have already occurred.

**Actionability** measures whether the customer knows what to do next.

**Tone & Clarity** ensures that the response remains professional and understandable without allowing writing quality alone to dominate the final score.

## Why the Evaluation Is More Reliable

LLM-based evaluation is not perfectly objective. This system uses several design choices to make evaluation more constrained, consistent, and inspectable.

- **Explicit evaluation targets:** The evaluator judges against `requiredPoints` and `forbiddenClaims` instead of answering a vague "is this response good?" prompt.

- **Multi-dimensional scoring:** Coverage, grounding, actionability, and communication quality are scored independently. Fluent writing cannot hide missing requirements or hallucinated claims.

- **Fixed benchmark ground truth:** Benchmark annotations exist before evaluation and are not generated by the evaluator during benchmark execution.

- **Fixed scoring rubric:** The same criteria and scoring guidelines are used for every response.

- **Low-randomness evaluation:** The evaluator uses a low-randomness configuration where supported to reduce unnecessary scoring variation.

- **Structured output validation:** Evaluator outputs are schema-validated before entering the scoring pipeline. Invalid outputs are rejected or retried.

- **Deterministic aggregation:** The LLM does not calculate the overall score. The final weighted score is calculated in application code.

- **Inspectable results:** Per-response scores and reasons are stored alongside aggregate benchmark results.

These measures do not eliminate LLM evaluator bias, but they make the evaluation methodology more reproducible, explainable, and technically defensible than a single unconstrained LLM-generated score.

## Example Output

```json
{
  "email": "I was charged twice for my subscription. Please refund the duplicate payment.",
  "contract": {
    "intent": "duplicate_charge",
    "customerNeeds": ["resolve duplicate charge", "request refund"],
    "requiredPoints": ["acknowledge the duplicate charge", "acknowledge the refund request", "provide a safe next step"],
    "forbiddenClaims": ["claim refund already processed", "invent refund timelines"]
  },
  "generatedResponse": "Subject: Re: Duplicate Charge on Subscription\n\nDear [Customer's Name],\n\nI apologize for the inconvenience you've experienced with being charged twice for your subscription...",
  "evaluation": {
    "issueCoverage": {
      "score": 10,
      "reason": "The response successfully addresses all required points: it acknowledges the duplicate charge, acknowledges the refund request, and provides a safe next step for the customer."
    },
    "grounding": {
      "score": 10,
      "reason": "The response avoids all forbidden claims. It does not claim the refund has been processed, invent timelines, or invent company policies."
    },
    "actionability": {
      "score": 10,
      "reason": "The response provides a clear, specific, and safe next step by directing the customer to contact the dedicated support team."
    },
    "toneClarity": {
      "score": 10,
      "reason": "The response maintains an excellent professional and empathetic tone throughout. It is clear, concise, easy to understand, and free from jargon."
    }
  },
  "qualityScore": 100
}
```

## Benchmark Evaluation

The benchmark runner evaluates every example in the fixed dataset.

```text
For Each Benchmark Example:

Customer Email
      +
Fixed Ground Truth
      ↓
Response Generation
      ↓
Evaluation Against Ground Truth
      ↓
Per-Metric Scores + Reasons
      ↓
Deterministic Overall Score

After All Examples:

Average Metric Scores
      ↓
Overall Benchmark Score
```

Detailed per-response results are saved so the aggregate score remains inspectable.

Example benchmark summary (from actual run):

```json
{
  "examplesEvaluated": 15,
  "averageScores": {
    "issueCoverage": 10,
    "grounding": 10,
    "actionability": 9.93,
    "toneClarity": 9.93
  },
  "overallBenchmarkScore": 99.73
}
```

> Benchmark scores are reported only after running the evaluation pipeline. The overall benchmark score represents performance on this fixed dataset and should not be interpreted as universal real-world accuracy.

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| AI Services | Python 3.11 (virtual environment) |
| Contract Extraction | Llama 3.1 8B Instant (Groq) |
| Response Generation | Llama 3.3 70B Versatile (Groq) |
| Rubric Evaluation | Llama 3.1 8B Instant (Groq) |
| Schema Validation | Zod |
| Dataset | Version-controlled JSON |
| Score Calculation | JavaScript |

## How to Run

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_PROJECT_NAME>
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Set Up Python Virtual Environment

```bash
cd server/ai_services
python -m venv venv
venv\Scripts\activate  # On Windows
# or source venv/bin/activate  # On Linux/Mac
pip install -r requirements.txt
cd ../..
```

A virtual environment has been created at `server/ai_services/venv` with the required Python packages already installed.

### 4. Configure Environment Variables

Create a `.env` file using `.env.example`.

```env
PORT=5000

GROQ_API_KEY=

EXTRACTOR_MODEL=llama-3.1-8b-instant
GENERATOR_MODEL=llama-3.3-70b-versatile
EVALUATOR_MODEL=llama-3.1-8b-instant
```

Never commit API keys or the `.env` file.

**Note**: You can obtain a Groq API key from: https://console.groq.com/keys

### 5. Start the Backend

```bash
cd server
npm start
```

### 6. Start the Frontend

```bash
cd ../client
npm install
npm run dev
```

## Running the Benchmark

```bash
cd server
npm run benchmark
```

The benchmark runner:

1. Loads the fixed dataset.
2. Generates a response for every benchmark email.
3. Evaluates each response against its fixed ground truth.
4. Calculates deterministic per-response scores.
5. Calculates aggregate metric scores and the overall benchmark score.
6. Saves detailed results for inspection.

Results are saved to:

```text
server/results/benchmark-results.json
```

## Limitations

- LLM-as-a-judge evaluation can still contain bias or scoring inconsistencies.
- The system has no access to real company systems and therefore cannot verify or perform business actions.
- The system does not know company-specific policies unless they are explicitly provided as context.
- The benchmark dataset is intentionally small (20 examples) due to the challenge time constraint.
- Benchmark results measure performance on the included dataset, not universal real-world accuracy.
- Free tier API quotas may limit the number of benchmark evaluations that can be performed in a single day.

## Conclusion

The core idea of this project is to evaluate AI-generated customer-support responses against **explicit expected behavior rather than fluency alone**.

The system:

```text
Extracts Requirements
        ↓
Generates a Grounded Response
        ↓
Evaluates Coverage + Grounding + Actionability + Communication Quality
        ↓
Produces Explainable Per-Response Scores
        ↓
Measures Aggregate Performance on a Fixed Benchmark
```

This creates a simple, explainable, and technically defensible pipeline for generating and evaluating customer-support email responses.