# AI Customer Email Response Generator & Evaluation System

A GenAI system that generates professional, grounded customer support email responses and evaluates them using a comprehensive rubric-based approach.

## Overview

This system accepts customer support emails, generates professional responses, and evaluates them across multiple quality dimensions. It includes both a live mode for handling arbitrary emails and a benchmark mode for measuring system performance on a fixed dataset.

## Architecture

The system uses a pipeline approach with two operating modes:

### Live Mode
```
Customer Email → Contract Extractor → Response Generator → Rubric Evaluator → Score Calculation
```

### Benchmark Mode
```
Benchmark Dataset → Response Generator (using ground truth) → Rubric Evaluator → Score Calculation → Aggregate Results
```

## Tech Stack

### Backend
- **Node.js + Express.js**: REST API server
- **Zod**: Input validation and schema validation
- **Python AI Services**: AI model interactions using Python scripts

### AI Models
- **Contract Extraction**: Gemini Flash (via Google Generative AI)
- **Response Generation**: Llama 3 70B (via Groq)
- **Rubric Evaluation**: Gemini Flash (via Google Generative AI)

### Frontend
- **React + Vite**: Minimal single-page interface
- **Axios**: HTTP client for API communication

## Evaluation Methodology

### Metrics (Weighted)

1. **Issue Coverage (30%)**: Measures whether the response addresses the customer's actual needs and all required points from the extracted contract.
   - 10: All important requirements addressed
   - 7-9: Mostly complete; minor omission
   - 4-6: Important requirements missing
   - 1-3: Mostly fails to address the issue
   - 0: Irrelevant

2. **Grounding (30%)**: Measures whether the response avoids unsupported claims, hallucinations, and invented information.
   - Penalizes: claiming actions were completed, inventing company policies, inventing timelines, inventing account/order status
   - 10: Fully grounded
   - 7-9: Minor unsupported implication
   - 4-6: Meaningful unsupported claim
   - 1-3: Major fabrication
   - 0: Fundamentally fabricated/unsafe

3. **Actionability (20%)**: Measures whether the customer knows what to do next.
   - Checks for: useful next steps, specific guidance, requesting only necessary information, avoiding sensitive credential requests
   - 10: Clear, specific, safe next step
   - 7-9: Useful next step but could be more specific
   - 4-6: Vague or incomplete guidance
   - 1-3: Unhelpful or confusing
   - 0: No next step or unsafe

4. **Tone & Clarity (20%)**: Measures whether the response is professional, respectful, concise, easy to understand, appropriately empathetic, and free from unnecessary jargon.
   - 10: Excellent tone and clarity
   - 7-9: Good tone and clarity
   - 4-6: Acceptable but could be improved
   - 1-3: Poor tone or unclear
   - 0: Unprofessional or confusing

### Score Calculation

The overall score is calculated deterministically in JavaScript (not by the LLM):

```
Overall Score = (Issue Coverage × 0.30) + (Grounding × 0.30) + (Actionability × 0.20) + (Tone & Clarity × 0.20)
```

Final score is scaled to 0-100 range.

## Why This Evaluation Approach Is Appropriate

1. **Explicit Requirements**: The evaluator receives explicit `requiredPoints` and `forbiddenClaims` from the contract, making evaluation criteria concrete rather than subjective.

2. **Multi-Dimensional Analysis**: Response quality is split into independent dimensions, preventing a single aspect from dominating the evaluation.

3. **Grounding Separation**: Grounding is scored separately, ensuring that fluent but hallucinated responses are penalized appropriately.

4. **Fixed Rubric**: A fixed rubric defines what different scores mean, reducing arbitrary evaluation.

5. **Low Randomness**: Evaluator randomness is kept low where supported by the model, improving consistency.

6. **Structured Validation**: All LLM outputs are validated using Zod schemas, with retry logic for malformed outputs.

7. **Deterministic Aggregation**: Final score calculation is done in JavaScript, ensuring consistent results.

8. **Fixed Ground Truth**: Benchmark ground truth is fixed before execution, avoiding circular evaluation.

9. **Inspectable Results**: Per-response results are saved, making aggregate scores inspectable and debuggable.

10. **Conceptual Separation**: Live quality scores are kept conceptually separate from benchmark performance, avoiding confusion about what the scores represent.

**Limitation**: LLM-as-a-judge evaluation is not perfectly objective. These measures reduce arbitrary evaluation and improve consistency, explainability, and inspectability, but do not eliminate evaluator bias entirely.

## Dataset

The benchmark dataset contains 20 manually curated customer support emails across 5 categories:

- **Billing (4 examples)**: Duplicate charges, unauthorized charges, invoice requests, refund status
- **Account (4 examples)**: Login issues, email changes, account deletion, security concerns
- **Technical (4 examples)**: App crashes, upload errors, missing features, sync issues
- **Subscription (4 examples)**: Cancellations, plan upgrades, unexpected charges, access issues
- **Complaints (4 examples)**: Support delays, service outages, quality concerns, missing discounts

Each example includes:
- Customer email
- Fixed ground truth contract (intent, requiredPoints, forbiddenClaims)
- Category classification

The dataset is versioned with the repository and used for consistent performance measurement. It is not used to restrict live inputs—the system handles arbitrary unseen customer emails.

## Installation

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- npm or yarn
- API keys for Google Generative AI (Gemini) and Groq

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Install Python dependencies:
```bash
cd ai_services
venv\Scripts\activate  # On Windows
# or source venv/bin/activate  # On Linux/Mac
pip install -r requirements.txt
cd ..
```

**Note**: A virtual environment has been created at `server/ai_services/venv` with the required Python packages already installed. You can activate it using the commands above. The Node.js services are configured to use the virtual environment's Python interpreter automatically.

4. Create environment variables:
```bash
cp .env.example .env
```

5. Edit `.env` and add your API keys:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
EXTRACTOR_MODEL=gemini-1.5-flash
GENERATOR_MODEL=llama3-70b-8192
EVALUATOR_MODEL=gemini-1.5-flash
```

**Note**: You can obtain API keys from:
- Google Generative AI: https://makersuite.google.com/app/apikey
- Groq: https://console.groq.com/keys

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Start the Backend Server

```bash
cd server
npm start
```

The server will start on `http://localhost:5000`

### Start the Frontend (Optional)

```bash
cd client
npm run dev
```

The frontend will be available at `http://localhost:3000`

### API Endpoint

**POST /api/analyze**

Request body:
```json
{
  "email": "I was charged twice for my subscription. Please refund the duplicate payment."
}
```

Response:
```json
{
  "email": "I was charged twice for my subscription. Please refund the duplicate payment.",
  "contract": {
    "intent": "duplicate_charge",
    "customerNeeds": ["resolve duplicate charge", "request refund"],
    "requiredPoints": ["acknowledge the duplicate charge", "acknowledge the refund request", "provide a safe next step"],
    "forbiddenClaims": ["claim refund already processed", "invent refund timelines"]
  },
  "generatedResponse": "Dear customer, I understand you've been charged twice...",
  "evaluation": {
    "issueCoverage": { "score": 9, "reason": "All important requirements were addressed." },
    "grounding": { "score": 10, "reason": "No unsupported claims were made." },
    "actionability": { "score": 8, "reason": "Clear next step provided." },
    "toneClarity": { "score": 9, "reason": "Professional and concise." }
  },
  "qualityScore": 91
}
```

### Running the Benchmark

To evaluate system performance on the fixed dataset:

```bash
cd server
npm run benchmark
```

This will:
1. Load the benchmark dataset from `server/data/benchmark.json`
2. Generate responses for each example using ground truth contracts
3. Evaluate each response using the rubric evaluator
4. Calculate aggregate scores
5. Save detailed results to `server/results/benchmark-results.json`

The benchmark skips the contract extraction step and uses the fixed ground truth contracts to measure response generation quality under known expected behavior.

## Project Structure

```
challenge/
├── client/                      # React frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                      # Node.js backend
│   ├── ai_services/            # Python AI services
│   │   ├── contract_extractor.py
│   │   ├── response_generator.py
│   │   ├── rubric_evaluator.py
│   │   └── requirements.txt
│   ├── data/
│   │   └── benchmark.json      # Fixed benchmark dataset
│   ├── results/
│   │   └── benchmark-results.json  # Generated benchmark results
│   ├── scripts/
│   │   └── runBenchmark.js     # Benchmark runner
│   ├── src/
│   │   ├── controllers/
│   │   │   └── analyze.controller.js
│   │   ├── routes/
│   │   │   └── analyze.routes.js
│   │   ├── services/
│   │   │   ├── analyze.service.js
│   │   │   ├── contractExtractor.js
│   │   │   ├── responseGenerator.js
│   │   │   └── rubricEvaluator.js
│   │   ├── prompts/
│   │   │   ├── extractor.prompt.js
│   │   │   ├── generator.prompt.js
│   │   │   └── evaluator.prompt.js
│   │   ├── schemas/
│   │   │   ├── contract.schema.js
│   │   │   ├── evaluation.schema.js
│   │   │   └── email.schema.js
│   │   ├── utils/
│   │   │   └── calculateScore.js
│   │   └── app.js
│   ├── package.json
│   └── .env.example
├── .env.example
├── .gitignore
└── README.md
```

## Key Design Decisions

1. **Separate Contract Extraction**: The system extracts requirements before generating responses, ensuring structured control over what the response should and shouldn't include.

2. **Python for AI Services**: AI model interactions are handled by Python scripts called from Node.js, leveraging Python's superior AI/ML ecosystem while maintaining a JavaScript-based API server.

3. **Fixed Benchmark Ground Truth**: The benchmark uses manually curated ground truth contracts rather than dynamically extracted ones, avoiding circular evaluation and ensuring consistent performance measurement.

4. **Deterministic Scoring**: Score calculation is done in JavaScript rather than by the LLM, ensuring consistent and reproducible results.

5. **Schema Validation**: All LLM outputs are validated using Zod schemas with retry logic, ensuring structured outputs and graceful error handling.

6. **Multi-Provider Approach**: Using different AI providers (Gemini for extraction/evaluation, Groq for generation) leverages the strengths of each model while keeping model names configurable for flexibility.

## Security Considerations

- API keys are stored in environment variables and never committed to the repository
- The system is configured to never request sensitive credentials (passwords, OTPs, CVVs, full payment card numbers)
- Input validation prevents malicious or malformed inputs
- The system is designed to avoid hallucinations and unsupported claims that could mislead customers

## Future Improvements

Potential enhancements for production use:
- Add authentication and rate limiting
- Implement response caching for similar emails
- Add support for multiple languages
- Include customer context/history in responses
- Implement A/B testing for different response strategies
- Add monitoring and analytics for response quality over time
- Fine-tune models on company-specific data and policies

## License

This project is part of a challenge submission and is provided as-is for evaluation purposes.
