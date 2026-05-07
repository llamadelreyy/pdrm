#!/bin/bash

# PDRM Accident Reporting System - Startup Script
# This script starts both the FastAPI backend and React frontend

# Define base directory
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/react-frontend"

echo "🚀 Starting PDRM Accident Reporting System..."
echo "================================================"
echo "Base directory: $BASE_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend server stopped${NC}"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend server stopped${NC}"
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites found${NC}"

# Check if ports are available
if port_in_use 8000; then
    echo -e "${YELLOW}⚠️  Port 8000 is already in use. Attempting to kill existing process...${NC}"
    pkill -f "uvicorn main:app" 2>/dev/null || true
    sleep 2
fi

if port_in_use 5173; then
    echo -e "${YELLOW}⚠️  Port 5173 is already in use. Attempting to kill existing process...${NC}"
    pkill -f "vite" 2>/dev/null || true
    sleep 2
fi

# Create uploads directory if it doesn't exist
mkdir -p "$BACKEND_DIR/uploads"

# Initialize database
echo -e "${BLUE}🗄️  Initializing database...${NC}"
cd "$BACKEND_DIR" && python3 -c "from database import create_tables; create_tables()" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database initialized${NC}"
else
    echo -e "${YELLOW}⚠️  Database may already be initialized${NC}"
fi

# Install Python dependencies if needed
if [ ! -f "$BACKEND_DIR/.venv_initialized" ]; then
    echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
    cd "$BACKEND_DIR" && python3 -m pip install -r requirements.txt > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        touch .venv_initialized
        echo -e "${GREEN}✅ Python dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install Python dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Python dependencies already installed${NC}"
fi

# Install Node.js dependencies if needed
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${BLUE}📦 Installing Node.js dependencies...${NC}"
    cd "$FRONTEND_DIR"
    npm install > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Node.js dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install Node.js dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Node.js dependencies already installed${NC}"
fi

# Start backend server
echo -e "${BLUE}🔧 Starting FastAPI backend server...${NC}"
cd "$BACKEND_DIR" && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000 > "$BASE_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend server started successfully${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend server failed to start${NC}"
        echo -e "${YELLOW}📋 Backend logs:${NC}"
        tail -n 20 "$BASE_DIR/backend.log"
        cleanup
        exit 1
    fi
    sleep 1
done

# Start frontend server
echo -e "${BLUE}🎨 Starting React frontend server...${NC}"
cd "$FRONTEND_DIR"
npm run dev > "$BASE_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo -e "${YELLOW}⏳ Waiting for frontend to start...${NC}"
for i in {1..60}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend server started successfully${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}❌ Frontend server failed to start${NC}"
        echo -e "${YELLOW}📋 Frontend logs:${NC}"
        tail -n 20 "$BASE_DIR/frontend.log"
        cleanup
        exit 1
    fi
    sleep 2
done

# Success message
echo -e "\n${GREEN}🎉 PDRM Accident Reporting System is now running!${NC}"
echo -e "================================================"
echo -e "${BLUE}📱 Frontend:${NC} http://localhost:5173"
echo -e "${BLUE}🔧 Backend API:${NC} http://localhost:8000"
echo -e "${BLUE}📚 API Documentation:${NC} http://localhost:8000/docs"
echo -e "\n${YELLOW}💡 Demo Account:${NC}"
echo -e "   Citizen: citizen@demo.com / password"
echo -e "\n${YELLOW}📋 Logs:${NC}"
echo -e "   Backend: tail -f backend.log"
echo -e "   Frontend: tail -f frontend.log"
echo -e "\n${RED}🛑 Press Ctrl+C to stop all servers${NC}"
echo -e "================================================\n"

# Keep script running and monitor processes
while true; do
    # Check if backend is still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend server stopped unexpectedly${NC}"
        cleanup
        exit 1
    fi
    
    # Check if frontend is still running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend server stopped unexpectedly${NC}"
        cleanup
        exit 1
    fi
    
    sleep 5
done
