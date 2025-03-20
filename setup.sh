#!/bin/bash

set -e # Exit on error

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Ocean Voyager Setup Script ===${NC}"
echo -e "${YELLOW}This script will set up the Ocean Voyager application${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js (v14 or higher).${NC}"
    echo "Visit https://nodejs.org/en/download/ for installation instructions."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install npm.${NC}"
    exit 1
fi

# Display versions
echo -e "${GREEN}Using:${NC}"
echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"

# Install dependencies
echo -e "\n${GREEN}Installing application dependencies...${NC}"
npm install

# Check if Python is installed (for backend)
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Python 3 is not installed. The multiplayer backend requires Python.${NC}"
    echo "If you plan to use multiplayer features, please install Python 3."
else
    echo -e "\n${GREEN}Setting up Python backend...${NC}"
    echo "Python: $(python3 --version)"

    # Check if pip is available
    if command -v pip3 &> /dev/null; then
        echo "Installing Python dependencies..."
        pip3 install flask flask-socketio python-socketio
    else
        echo -e "${YELLOW}pip3 not found. Please install Python dependencies manually:${NC}"
        echo "pip3 install flask flask-socketio python-socketio"
    fi
fi

# Create necessary directories if they don't exist
echo -e "\n${GREEN}Creating necessary directories...${NC}"
mkdir -p public/sounds
mkdir -p public/models
mkdir -p public/images

# Start the multiplayer server (in background)
start_backend() {
    echo -e "\n${GREEN}Starting multiplayer backend server...${NC}"
    if [ -f "backend/server.py" ]; then
        python3 backend/server.py &
        BACKEND_PID=$!
        echo "Backend server started with PID: $BACKEND_PID"
    else
        echo -e "${YELLOW}Backend server script not found. Skipping server start.${NC}"
    fi
}

# Start the frontend development server
start_frontend() {
    echo -e "\n${GREEN}Starting frontend development server...${NC}"
    npm run dev
}

# Setup complete
echo -e "\n${GREEN}Setup complete!${NC}"
echo -e "${YELLOW}To start the application:${NC}"
echo "1. Start multiplayer backend: python3 backend/server.py"
echo "2. Start frontend: npm run dev"
echo -e "${YELLOW}Then open your browser at:${NC} http://localhost:3000"

# Ask if user wants to start servers
echo -e "\n${GREEN}Would you like to start the servers now? (y/n)${NC}"
read -r START_SERVERS

if [[ $START_SERVERS == "y" || $START_SERVERS == "Y" ]]; then
    start_backend
    start_frontend
else
    echo -e "${GREEN}You can start the application later using the commands above.${NC}"
fi

echo -e "\n${GREEN}Thank you for setting up Ocean Voyager!${NC}"
