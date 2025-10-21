#!/bin/bash

# POS Frontend Setup Script
# This script helps set up the environment for the POS frontend application

echo "🚀 Setting up POS Frontend..."
echo ""

# Check if .env file already exists
if [ -f .env ]; then
    echo "✅ .env file already exists"
    echo ""
    echo "Current configuration:"
    cat .env
    echo ""
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file"
        exit 0
    fi
fi

# Copy .env.example to .env
if [ -f .env.example ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo ""
    echo "Default configuration:"
    cat .env
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "You can now run:"
    echo "  npm install  # Install dependencies"
    echo "  npm run dev  # Start development server"
    echo ""
    echo "To customize the API URL, edit the .env file"
else
    echo "❌ Error: .env.example file not found"
    exit 1
fi
