#!/usr/bin/env python3
"""
Test script to verify API keys are working correctly for both Gemini and Groq.
"""
import os
import sys
from dotenv import load_dotenv

# Load .env from parent server directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

print("Testing API Keys...")
print("=" * 50)

# Test Gemini API
print("\n1. Testing Gemini API...")
try:
    import google.generativeai as genai
    
    gemini_key = os.getenv('GEMINI_API_KEY')
    if not gemini_key:
        print("X GEMINI_API_KEY not found in .env file")
    else:
        print(f"OK GEMINI_API_KEY found: {gemini_key[:10]}...{gemini_key[-4:]}")
        
        try:
            genai.configure(api_key=gemini_key)
            model_name = os.getenv('EXTRACTOR_MODEL', 'gemini-2.5-flash')
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Hello, just testing the API connection.")
            print(f"OK Gemini API connection successful with {model_name}!")
            print(f"  Response: {response.text[:100]}...")
        except Exception as e:
            print(f"X Gemini API connection failed: {e}")
            
except ImportError:
    print("X google-generativeai package not installed")
except Exception as e:
    print(f"X Gemini test failed: {e}")

# Test Groq API
print("\n2. Testing Groq API...")
try:
    from groq import Groq
    
    groq_key = os.getenv('GROQ_API_KEY')
    if not groq_key:
        print("X GROQ_API_KEY not found in .env file")
    else:
        print(f"OK GROQ_API_KEY found: {groq_key[:10]}...{groq_key[-4:]}")
        
        try:
            client = Groq(api_key=groq_key)
            completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": "Hello, just testing the API connection."
                    }
                ],
                model="llama-3.3-70b-versatile",
                max_tokens=50,
            )
            print("OK Groq API connection successful!")
            print(f"  Response: {completion.choices[0].message.content[:100]}...")
        except Exception as e:
            print(f"X Groq API connection failed: {e}")
            
except ImportError:
    print("X groq package not installed")
except Exception as e:
    print(f"X Groq test failed: {e}")

# Check model configurations
print("\n3. Checking Model Configurations...")
print(f"EXTRACTOR_MODEL: {os.getenv('EXTRACTOR_MODEL', 'Not set')}")
print(f"GENERATOR_MODEL: {os.getenv('GENERATOR_MODEL', 'Not set')}")
print(f"EVALUATOR_MODEL: {os.getenv('EVALUATOR_MODEL', 'Not set')}")

print("\n" + "=" * 50)
print("API Key Test Complete")
