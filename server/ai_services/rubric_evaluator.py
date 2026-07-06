#!/usr/bin/env python3
import sys
import json
import os
from dotenv import load_dotenv
from groq import Groq

# Load .env from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Initialize Groq
client = Groq(api_key=os.getenv('GROQ_API_KEY'))
MODEL_NAME = 'llama-3.1-8b-instant'  # Using Groq model for evaluation

EVALUATOR_PROMPT = """
You are an impartial evaluator of customer support responses. Your task is to judge the quality of a generated response using fixed criteria.

CUSTOMER EMAIL:
{email}

RESPONSE CONTRACT:
{contract}

GENERATED RESPONSE:
{response}

Evaluate the response on these 4 metrics (0-10 scale):

1. ISSUE COVERAGE (30%):
Measures whether the response addresses the customer's actual needs and all requiredPoints.
- 10: All important requirements addressed
- 7-9: Mostly complete; minor omission
- 4-6: Important requirements missing
- 1-3: Mostly fails to address the issue
- 0: Irrelevant

2. GROUNDING (30%):
Measures whether the response avoids unsupported claims.
Penalize: claiming refunds/actions were completed, inventing company policies, inventing timelines, inventing account/order status, inventing prices, inventing technical explanations.
- 10: Fully grounded
- 7-9: Minor unsupported implication
- 4-6: Meaningful unsupported claim
- 1-3: Major fabrication
- 0: Fundamentally fabricated/unsafe

3. ACTIONABILITY (20%):
Measures whether the customer knows what to do next.
Check: Is a useful next step provided? Is the guidance specific enough? Is only necessary information requested? Does the response avoid requesting sensitive credentials?
- 10: Clear, specific, safe next step
- 7-9: Useful next step but could be more specific
- 4-6: Vague or incomplete guidance
- 1-3: Unhelpful or confusing
- 0: No next step or unsafe

4. TONE & CLARITY (20%):
Measures whether the response is professional, respectful, concise, easy to understand, appropriately empathetic, and free from unnecessary jargon.
- 10: Excellent tone and clarity
- 7-9: Good tone and clarity
- 4-6: Acceptable but could be improved
- 1-3: Poor tone or unclear
- 0: Unprofessional or confusing

Return ONLY valid JSON in this exact format:
{{
  "issueCoverage": {{
    "score": number (0-10),
    "reason": "string explaining the score"
  }},
  "grounding": {{
    "score": number (0-10),
    "reason": "string explaining the score"
  }},
  "actionability": {{
    "score": number (0-10),
    "reason": "string explaining the score"
  }},
  "toneClarity": {{
    "score": number (0-10),
    "reason": "string explaining the score"
  }}
}}
"""

def evaluate_response(email, contract, response):
    prompt = EVALUATOR_PROMPT.format(
        email=email,
        contract=json.dumps(contract, indent=2),
        response=response
    )
    # Convert double braces back to single braces for JSON format
    prompt = prompt.replace('{{', '{').replace('}}', '}')
    
    try:
        completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a JSON API. Always respond with valid JSON only, no additional text."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=MODEL_NAME,
            temperature=0.1,
            max_tokens=2048,
            response_format={"type": "json_object"}
        )
        
        result_text = completion.choices[0].message.content.strip()
        
        # Try to extract JSON from response
        if '```json' in result_text:
            result_text = result_text.split('```json')[1].split('```')[0].strip()
        elif '```' in result_text:
            result_text = result_text.split('```')[1].split('```')[0].strip()
        
        evaluation = json.loads(result_text)
        return evaluation
    except Exception as e:
        print(f"Error in evaluation: {e}", file=sys.stderr)
        print(f"Raw response: {result_text if 'result_text' in locals() else 'No response text'}", file=sys.stderr)
        raise

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python rubric_evaluator.py '<email>' '<contract_json>' '<response>'", file=sys.stderr)
        sys.exit(1)
    
    email = sys.argv[1]
    contract = json.loads(sys.argv[2])
    response = sys.argv[3]
    evaluation = evaluate_response(email, contract, response)
    print(json.dumps(evaluation))
