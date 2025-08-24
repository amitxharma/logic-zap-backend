#!/bin/bash

echo "🚀 Starting Resume Builder Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ .env file created from template."
        echo "📝 Please edit .env file with your configuration before continuing."
        echo "   - Set your MongoDB connection string"
        echo "   - Set your JWT secret"
        echo "   - Set your Google OAuth credentials (optional)"
        echo ""
        read -p "Press Enter after configuring .env file..."
    else
        echo "❌ env.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies."
    exit 1
fi

echo "✅ Dependencies installed successfully."

# Check if MongoDB is running (optional)
echo "🔍 Checking MongoDB connection..."
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.runCommand('ping')" &> /dev/null; then
        echo "✅ MongoDB is running."
    else
        echo "⚠️  MongoDB might not be running. Make sure MongoDB is started."
    fi
else
    echo "ℹ️  MongoDB client not found. Skipping connection check."
fi

echo ""
echo "🎯 Starting the server..."
echo "📱 Backend will be available at: http://localhost:5001"
echo "🔍 Health check: http://localhost:5001/api/health"
echo "📚 API documentation: Check README.md"
echo ""
echo "Press Ctrl+C to stop the server."
echo ""

# Start the server
npm run dev
