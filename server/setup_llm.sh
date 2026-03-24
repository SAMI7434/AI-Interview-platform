#!/bin/bash
# Setup script for local LLM service

echo "Setting up local LLM service..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "Python version: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "ERROR: pip3 is not installed. Please install pip."
    exit 1
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Make Python script executable
chmod +x llm_service.py

echo "✅ Setup complete!"
echo ""
echo "Note: The model will be downloaded automatically on first use."
echo "This may take several minutes and require several GB of disk space."
