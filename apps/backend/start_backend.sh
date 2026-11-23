#!/bin/bash

# Image Slider Feature - Quick Start Guide
# This script will start the backend server and verify the slider endpoints

echo "🚀 Starting Image Slider Feature Setup..."
echo ""

# Check if we're in the backend directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    echo "   cd /home/ankit/Documents/Code/vs/backend"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Starting FastAPI backend server..."
echo "   Backend will be available at: http://localhost:8000"
echo "   Docs available at: http://localhost:8000/docs"
echo ""
echo "📱 Android app should connect to: http://localhost:8000"
echo "🖥️  Frontend connects via: http://localhost:3000/api/backend/..."
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
