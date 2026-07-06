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
MODEL_NAME = 'llama-3.3-70b-versatile'  # Hardcoded to avoid environment variable issues

GENERATOR_PROMPT = """
You are a professional customer support representative. Your task is to write a helpful, professional, and grounded response to a customer email.

CUSTOMER EMAIL:
{email}

RESPONSE CONTRACT:
{contract}

REQUIREMENTS:
- Address ALL requiredPoints from the contract
- Avoid ALL forbiddenClaims from the contract
- Never claim an action was performed unless supported by input context
- Never invent company policies
- Never invent refund, shipping, or resolution timelines
- Never invent account/order status
- Never request passwords, OTPs, CVVs, or full payment card numbers
- Provide a useful and safe next step
- Be concise and professional
- Be appropriately empathetic

Write a customer-support email reply that satisfies these requirements.
"""

def generate_response(email, contract):
    prompt = GENERATOR_PROMPT.format(
        email=email,
        contract=json.dumps(contract, indent=2)
    )
    
    try:
        completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=MODEL_NAME,
            temperature=0.3,
            max_tokens=2048,
        )
        
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Error in response generation: {e}", file=sys.stderr)
        raise

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python response_generator.py '<email>' '<contract_json>'", file=sys.stderr)
        sys.exit(1)
    
    email = sys.argv[1]
    contract = json.loads(sys.argv[2])
    response = generate_response(email, contract)
    print(response)
