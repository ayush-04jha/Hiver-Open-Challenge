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
MODEL_NAME = 'llama-3.1-8b-instant'  # Using Groq model for contract extraction

EXTRACTOR_PROMPT = """
You are a customer support contract extractor. Your task is to analyze a customer email and extract a structured contract that defines requirements for a good response.

Analyze the following customer email and extract:
1. intent: The primary customer intent (e.g., "duplicate_charge", "password_reset", "technical_issue")
2. customerNeeds: Problems, concerns, and explicit requests expressed by the customer
3. requiredPoints: Atomic behaviors that the generated response should satisfy (e.g., "acknowledge the duplicate charge", "provide a safe next step")
4. forbiddenClaims: Claims the response must avoid because they are unsupported (e.g., "claim refund was processed", "invent refund timeline")

IMPORTANT RULES:
- Do NOT invent company policies
- Do NOT invent refund timelines
- Do NOT invent prices
- Do NOT invent account information
- Do NOT invent order status
- Do NOT invent actions already performed
- Do NOT invent technical facts not present in the input

Customer Email:
{email}

Return ONLY valid JSON in this exact format:
{{
  "intent": "string",
  "customerNeeds": ["string"],
  "requiredPoints": ["string"],
  "forbiddenClaims": ["string"]
}}
"""

def extract_contract(email):
    prompt = EXTRACTOR_PROMPT.format(email=email)
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
        
        contract = json.loads(result_text)
        return contract
    except Exception as e:
        print(f"Error in contract extraction: {e}", file=sys.stderr)
        print(f"Raw response: {result_text if 'result_text' in locals() else 'No response text'}", file=sys.stderr)
        raise

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python contract_extractor.py '<email>'", file=sys.stderr)
        sys.exit(1)
    
    email = sys.argv[1]
    contract = extract_contract(email)
    print(json.dumps(contract))
