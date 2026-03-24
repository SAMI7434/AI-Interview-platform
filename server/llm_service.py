#!/usr/bin/env python3
"""
Local LLM Service using Llama-2-7b-Chat-GGML
Generates interview questions as JSON
"""

import json
import sys
import os
import traceback
from pathlib import Path

try:
    from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
    import torch
except ImportError as e:
    print(f"ERROR: Missing required package: {e}", file=sys.stderr)
    print("Please install: pip install transformers torch", file=sys.stderr)
    sys.exit(1)

# Model configuration
# Note: GGML models require llama.cpp, not transformers
# Using a compatible model for transformers instead
PRIMARY_MODEL = "meta-llama/Llama-2-7b-chat-hf"  # Requires HuggingFace access
FALLBACK_MODEL = "gpt2"  # Small, fast fallback model
MODEL_CACHE_DIR = Path.home() / ".cache" / "huggingface" / "transformers"
MAX_RETRIES = 3
MAX_LENGTH = 2048
TEMPERATURE = 0.7

# Global model and tokenizer (loaded once)
_model = None
_tokenizer = None
_pipeline = None


def download_model_if_needed():
    """Download model if not present in cache"""
    try:
        print(f"Checking for models in cache...", file=sys.stderr)
        print(f"Cache directory: {MODEL_CACHE_DIR}", file=sys.stderr)
        print(f"Models will be downloaded automatically on first use", file=sys.stderr)
        return True
    except Exception as e:
        print(f"ERROR checking model: {e}", file=sys.stderr)
        return False


def load_model():
    """Load the model and tokenizer (lazy loading)"""
    global _model, _tokenizer, _pipeline
    
    if _pipeline is not None:
        return _pipeline
    
    try:
        print("Loading model...", file=sys.stderr)
        
        # Try to load primary model, fallback to smaller model if it fails
        models_to_try = [
            (PRIMARY_MODEL, "Primary model"),
            (FALLBACK_MODEL, "Fallback model (faster, smaller)")
        ]
        
        for model_name, description in models_to_try:
            try:
                print(f"Attempting to load {description}: {model_name}", file=sys.stderr)
                
                tokenizer = AutoTokenizer.from_pretrained(
                    model_name,
                    cache_dir=str(MODEL_CACHE_DIR),
                    trust_remote_code=True
                )
                
                # Set pad token if not present
                if tokenizer.pad_token is None:
                    tokenizer.pad_token = tokenizer.eos_token
                
                model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    cache_dir=str(MODEL_CACHE_DIR),
                    trust_remote_code=True,
                    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                    device_map="auto" if torch.cuda.is_available() else None,
                    low_cpu_mem_usage=True
                )
                
                _pipeline = pipeline(
                    "text-generation",
                    model=model,
                    tokenizer=tokenizer,
                    device=0 if torch.cuda.is_available() else -1,
                    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
                )
                
                print(f"✅ {description} loaded successfully", file=sys.stderr)
                return _pipeline
                
            except Exception as e:
                print(f"⚠️ Failed to load {model_name}: {e}", file=sys.stderr)
                if model_name == models_to_try[-1][0]:  # Last model
                    print("All models failed to load", file=sys.stderr)
                    raise
                continue
            
    except Exception as e:
        print(f"ERROR loading model: {e}", file=sys.stderr)
        traceback.print_exc()
        raise


def generate_questions(category: str, job_role: str, experience_level: str, 
                       company: str, skills: list = None) -> dict:
    """
    Generate interview questions using local LLM
    
    Args:
        category: DSA, Tech Stack, or Core Subjects
        job_role: Job role name
        experience_level: Experience level
        company: Target company
        skills: List of skills (optional)
    
    Returns:
        dict with 'questions' array or 'error' message
    """
    try:
        # Build category-specific context
        category_context = ""
        if category == "DSA":
            category_context = "Data Structures and Algorithms questions covering arrays, linked lists, trees, graphs, dynamic programming, and algorithm complexity."
        elif category == "Tech Stack":
            skills_str = ", ".join(skills) if skills else "general web development technologies"
            category_context = f"Technology Stack questions focused on: {skills_str}."
        elif category == "Core Subjects":
            category_context = "Core Computer Science subjects including Operating Systems, Object-Oriented Programming, System Design, Database Management, and Computer Networks."
        
        # Build prompt
        prompt = f"""You are an expert technical interviewer. Generate exactly 5 {category} interview questions as a JSON object.

Context:
- Job Role: {job_role}
- Experience Level: {experience_level}
- Target Company: {company}
- Category: {category}
- Category Focus: {category_context}
{f"- Tech Stack: {', '.join(skills)}" if skills else ""}

Requirements:
1. Generate EXACTLY 5 detailed questions (no more, no less)
2. Questions should be tailored to {experience_level} experience level candidates
3. Questions should be relevant to {job_role} position
4. Each question must be clear, specific, and interview-appropriate
5. Mix of conceptual, scenario-based, and practical questions

Output Format (MUST be valid JSON only, no markdown, no code blocks, no explanations):
{{
  "questions": [
    {{
      "type": "Conceptual",
      "technology": "Technology or topic name",
      "question": "Detailed question text here"
    }},
    {{
      "type": "Scenario",
      "technology": "Technology or topic name",
      "question": "Detailed question text here"
    }},
    {{
      "type": "Practical",
      "technology": "Technology or topic name",
      "question": "Detailed question text here"
    }}
  ]
}}

CRITICAL: 
- Return ONLY the JSON object starting with {{ and ending with }}
- Do NOT include markdown code blocks (```json or ```)
- Do NOT include any explanations or additional text
- Ensure all 5 questions are present in the array

Generate the JSON now:"""

        # Load model if needed
        pipe = load_model()
        
        if pipe is None:
            return {"error": "Model failed to load", "questions": []}
        
        # Generate response
        print(f"Generating questions for {category}...", file=sys.stderr)
        
        try:
            outputs = pipe(
                prompt,
                max_length=MAX_LENGTH,
                temperature=TEMPERATURE,
                top_p=0.95,
                top_k=40,
                do_sample=True,
                num_return_sequences=1,
                pad_token_id=pipe.tokenizer.eos_token_id if hasattr(pipe, 'tokenizer') else None
            )
            
            # Extract generated text
            if isinstance(outputs, list) and len(outputs) > 0:
                generated_text = outputs[0].get('generated_text', '')
                # Remove the prompt from the response
                if prompt in generated_text:
                    response_text = generated_text[len(prompt):].strip()
                else:
                    response_text = generated_text.strip()
            else:
                response_text = str(outputs)
            
            print(f"Generated response length: {len(response_text)}", file=sys.stderr)
            
            # Parse JSON from response
            questions_data = extract_json_from_response(response_text)
            
            if questions_data and 'questions' in questions_data:
                questions = questions_data['questions']
                # Ensure exactly 5 questions
                if len(questions) > 5:
                    questions = questions[:5]
                elif len(questions) < 5:
                    print(f"WARNING: Only {len(questions)} questions generated, expected 5", file=sys.stderr)
                
                return {"questions": questions}
            else:
                print("WARNING: Failed to extract valid questions from response", file=sys.stderr)
                return {"error": "Failed to parse questions", "questions": []}
                
        except Exception as gen_error:
            print(f"ERROR during generation: {gen_error}", file=sys.stderr)
            traceback.print_exc()
            return {"error": str(gen_error), "questions": []}
            
    except Exception as e:
        print(f"ERROR in generate_questions: {e}", file=sys.stderr)
        traceback.print_exc()
        return {"error": str(e), "questions": []}


def extract_json_from_response(text: str) -> dict:
    """Extract JSON object from response text"""
    try:
        # Remove markdown code blocks
        text = text.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        
        # Find JSON object boundaries
        first_brace = text.find('{')
        last_brace = text.rfind('}')
        
        if first_brace == -1 or last_brace == -1 or last_brace <= first_brace:
            print("No JSON object found in response", file=sys.stderr)
            return None
        
        json_str = text[first_brace:last_brace + 1]
        
        # Parse JSON
        try:
            data = json.loads(json_str)
            return data
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}", file=sys.stderr)
            print(f"Attempted to parse: {json_str[:500]}", file=sys.stderr)
            return None
            
    except Exception as e:
        print(f"Error extracting JSON: {e}", file=sys.stderr)
        return None


def main():
    """Main entry point for the script"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        category = input_data.get('category', '')
        job_role = input_data.get('job_role', '')
        experience_level = input_data.get('experience_level', '')
        company = input_data.get('company', '')
        skills = input_data.get('skills', [])
        
        if not all([category, job_role, experience_level, company]):
            result = {
                "error": "Missing required fields",
                "questions": []
            }
        else:
            # Download model if needed (check only)
            download_model_if_needed()
            
            # Generate questions
            result = generate_questions(
                category=category,
                job_role=job_role,
                experience_level=experience_level,
                company=company,
                skills=skills if isinstance(skills, list) else []
            )
        
        # Output result as JSON
        print(json.dumps(result))
        
    except json.JSONDecodeError as e:
        error_result = {
            "error": f"Invalid JSON input: {e}",
            "questions": []
        }
        print(json.dumps(error_result))
        sys.exit(1)
    except Exception as e:
        error_result = {
            "error": f"Unexpected error: {e}",
            "questions": []
        }
        print(json.dumps(error_result))
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
