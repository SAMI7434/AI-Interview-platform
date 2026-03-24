# Local LLM Service Setup

This service replaces the Google Gemini API with a local LLM model for generating interview questions.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- At least 8GB RAM (16GB recommended)
- 10GB+ free disk space for model storage
- Optional: CUDA-compatible GPU for faster inference

## Setup Instructions

### Windows
```bash
setup_llm.bat
```

### Linux/Mac
```bash
chmod +x setup_llm.sh
./setup_llm.sh
```

### Manual Setup
```bash
pip install -r requirements.txt
```

## Model Configuration

The service uses HuggingFace transformers. By default, it tries to load:
1. **Primary**: `meta-llama/Llama-2-7b-chat-hf` (requires HuggingFace access)
2. **Fallback**: `gpt2` (small, fast, no access required)

**Note**: The original request was for `TheBloke/Llama-2-7b-Chat-GGML`, but GGML models require `llama.cpp` instead of `transformers`. If you need GGML support, you'll need to modify the Python script to use `llama-cpp-python` instead.

To use a different model, edit `llm_service.py` and change the `PRIMARY_MODEL` constant.

## Usage

The service is automatically called by the Node.js backend when generating questions. No manual intervention needed.

## Troubleshooting

### Model Download Fails
- Check internet connection
- Ensure you have enough disk space
- For Llama models, you may need to accept the model license on HuggingFace

### Out of Memory Errors
- Use the fallback model (gpt2) which is smaller
- Reduce `MAX_LENGTH` in `llm_service.py`
- Close other applications to free RAM

### Python Not Found
- Ensure Python 3 is in your PATH
- On Windows, try `python` instead of `python3`
- On Linux/Mac, install Python 3: `sudo apt install python3` or `brew install python3`

### Slow Generation
- Install CUDA and PyTorch with CUDA support for GPU acceleration
- Use a smaller model (gpt2)
- Reduce `MAX_LENGTH` parameter

## Safety Features

- Automatic model fallback if primary model fails
- JSON parsing with error handling
- Timeout protection (5 minutes)
- Input validation
- Error logging
