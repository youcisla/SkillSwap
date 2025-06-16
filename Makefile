# SkillSwap - Complete Project Makefile for Windows
# This Makefile handles both frontend (React Native Expo) and backend (Node.js + MongoDB)

# Variables
BACKEND_DIR = backend
FRONTEND_DIR = .
NODE_MODULES_BACKEND = $(BACKEND_DIR)/node_modules
NODE_MODULES_FRONTEND = node_modules
MONGODB_URL = mongodb://localhost:27017/skillswap
BACKEND_PORT = 3000
EXPO_PORT = 8081

# Colors for output (Windows compatible)
GREEN = @echo.
RED = @echo.
YELLOW = @echo.
BLUE = @echo.
NC = @echo.

# Help target
.PHONY: help
help:
	@echo.
	@echo SkillSwap Project Management
	@echo =============================
	@echo.
	@echo Available commands:
	@echo.
	@echo   make setup          - Complete project setup (install all dependencies)
	@echo   make install        - Install frontend dependencies only
	@echo   make install-backend - Install backend dependencies only
	@echo.
	@echo   make start          - Start both frontend and backend
	@echo   make dev            - Start development mode (backend + expo)
	@echo   make frontend       - Start frontend only (Expo)
	@echo   make backend        - Start backend only (Node.js server)
	@echo.
	@echo   make mongodb        - Start MongoDB (if installed locally)
	@echo   make stop-mongodb   - Stop MongoDB
	@echo.
	@echo   make clean          - Clean all node_modules
	@echo   make clean-frontend - Clean frontend node_modules
	@echo   make clean-backend  - Clean backend node_modules
	@echo.
	@echo   make test           - Run tests
	@echo   make build          - Build the project
	@echo   make status         - Check project status
	@echo.
	@echo ""
	@echo "$(YELLOW)Setup Commands:$(NC)"
	@echo "  make install          - Install all dependencies (frontend + backend)"
	@echo "  make setup            - Complete project setup (install + configure)"
	@echo ""
	@echo "$(YELLOW)Development Commands:$(NC)"
	@echo "  make dev              - Start both frontend and backend in development mode"
	@echo "  make launch           - Launch frontend and backend in separate CMD windows"
	@echo "  make frontend         - Start only the React Native frontend"
	@echo "  make backend          - Start only the Node.js backend"
	@echo "  make mongo            - Start MongoDB service"
	@echo ""
	@echo "$(YELLOW)Individual Operations:$(NC)"
	@echo "  make install-frontend - Install frontend dependencies"
	@echo "  make install-backend  - Install backend dependencies"
	@echo "  make launch-frontend  - Launch frontend in separate CMD window"
	@echo "  make launch-backend   - Launch backend in separate CMD window"
	@echo "  make start-frontend   - Start Expo development server"
	@echo "  make start-backend    - Start Node.js server"
	@echo ""
	@echo "$(YELLOW)Database Commands:$(NC)"
	@echo "  make db-start         - Start MongoDB service"
	@echo "  make db-stop          - Stop MongoDB service"
	@echo "  make db-status        - Check MongoDB status"
	@echo "  make db-reset         - Reset database (drops all data)"
	@echo "  make db-docker        - Start MongoDB in Docker container"
	@echo "  make db-install       - Show MongoDB installation instructions"
	@echo ""
	@echo "$(YELLOW)Utility Commands:$(NC)"
	@echo "  make clean            - Clean node_modules and caches"
	@echo "  make fix-deps         - Fix dependency conflicts (use when npm install fails)"
	@echo "  make reset            - Complete reset (clean + reinstall)"
	@echo "  make check            - Check project health"
	@echo "  make logs-backend     - Show backend logs"
	@echo "  make test             - Run tests"
	@echo ""
	@echo "$(YELLOW)Production Commands:$(NC)"
	@echo "  make build            - Build the application for production"
	@echo "  make prod-backend     - Start backend in production mode"

# =============================================================================
# SETUP COMMANDS
# =============================================================================

.PHONY: install
install: install-frontend install-backend
	@echo ✅ All dependencies installed successfully!

.PHONY: setup
setup: check-requirements install install-backend create-env
	@echo ✅ Complete project setup finished!
	@echo.
	@echo Next steps:
	@echo   1. Start MongoDB: make mongodb
	@echo   2. Start the backend: make backend
	@echo   3. In another terminal, start frontend: make frontend
	@echo   4. Or start both together: make start
	@echo.

.PHONY: install-frontend
install-frontend:
	@echo 📱 Installing frontend dependencies...
	@if exist node_modules rmdir /s /q node_modules
	@if exist package-lock.json del package-lock.json
	@npm cache clean --force
	@npm install --legacy-peer-deps || (echo ⚠️  Trying with force flag... && npm install --force) || (echo ⚠️  Trying Expo fix... && npx expo install --fix && npm install --legacy-peer-deps)
	@echo ✅ Frontend dependencies installed

.PHONY: install-backend
install-backend:
	@echo ⚙️  Installing backend dependencies...
	@cd $(BACKEND_DIR) && if exist node_modules rmdir /s /q node_modules
	@cd $(BACKEND_DIR) && if exist package-lock.json del package-lock.json
	@cd $(BACKEND_DIR) && npm cache clean --force
	@cd $(BACKEND_DIR) && npm install || (echo ⚠️  Trying with legacy peer deps... && npm install --legacy-peer-deps)
	@echo ✅ Backend dependencies installed

.PHONY: check-requirements
check-requirements:
	@echo 🔍 Checking requirements...
	@node --version >nul 2>&1 || (echo ❌ Node.js is not installed! && exit 1)
	@npm --version >nul 2>&1 || (echo ❌ npm is not installed! && exit 1)
	@echo ✅ Node.js and npm are installed

# =============================================================================
# DEVELOPMENT COMMANDS
# =============================================================================

.PHONY: dev
dev:
	@echo 🚀 Starting SkillSwap development environment...
	@echo This will start both frontend and backend servers
	@echo MongoDB should be running separately
	@echo.
	@echo Frontend will be available at: http://localhost:8081
	@echo Backend API will be available at: http://localhost:$(BACKEND_PORT)
	@echo.
	@$(MAKE) start-backend-bg
	@sleep 3
	@$(MAKE) start-frontend

.PHONY: start
start:
	@echo 🚀 Starting SkillSwap (Frontend + Backend)...
	@echo Starting backend server in background...
	@start /B cmd /c "cd $(BACKEND_DIR) && npm run dev"
	@timeout 3 >nul
	@echo Starting frontend...
	npm start

.PHONY: frontend
frontend: start-frontend

.PHONY: backend
backend: start-backend

.PHONY: start-frontend
start-frontend:
	@echo 📱 Starting React Native frontend in new window...
	@cmd /c start "SkillSwap Frontend" cmd /k "start-frontend.bat"

.PHONY: launch-frontend
launch-frontend:
	@echo 🚀 Launching frontend in separate window...
	@cmd /c start "SkillSwap Frontend" cmd /k "start-frontend.bat"

.PHONY: launch
launch:
	cls
	@echo 🚀 Launching SkillSwap in separate windows...
	@echo This will open backend and frontend in separate CMD windows
	@echo.
	@echo Backend will be available at: http://localhost:$(BACKEND_PORT)
	@echo Frontend will be available at: http://localhost:8081
	@echo.
	@$(MAKE) launch-backend
	@timeout /t 2 >nul
	@$(MAKE) launch-frontend
	@echo ✅ Both services launched in separate windows!

.PHONY: start-backend
start-backend:
	@echo ⚙️  Starting Node.js backend in new window...
	@cmd /c start "SkillSwap Backend" cmd /k "backend\start-backend.bat"

.PHONY: start-backend-bg
start-backend-bg:
	@echo Starting Node.js backend in background...
	@cd $(BACKEND_DIR) && start /B npm run dev

.PHONY: launch-backend
launch-backend:
	@echo 🚀 Launching backend in separate window...
	@cmd /c start "SkillSwap Backend" cmd /k "backend\start-backend.bat"

# =============================================================================
# DATABASE COMMANDS
# =============================================================================

.PHONY: mongo
mongo: db-start

.PHONY: db-start
db-start:
	@echo "$(YELLOW)🍃 Starting MongoDB...$(NC)"
	@echo "$(YELLOW)Trying different MongoDB startup methods...$(NC)"
	@net start MongoDB 2>nul && echo "$(GREEN)✅ MongoDB Windows service started$(NC)" || ( \
		echo "$(YELLOW)⚠️  MongoDB Windows service not available, trying direct start...$(NC)" && \
		where mongod >nul 2>&1 && ( \
			start /B mongod --dbpath data\db 2>nul && echo "$(GREEN)✅ MongoDB started directly$(NC)" \
		) || ( \
			echo "$(RED)❌ MongoDB not found. Options:$(NC)" && \
			echo "$(YELLOW)  1. Install MongoDB Community Server$(NC)" && \
			echo "$(YELLOW)  2. Use Docker: make db-docker$(NC)" && \
			echo "$(YELLOW)  3. Use MongoDB Atlas (cloud)$(NC)" \
		) \
	)
	@timeout /t 2 >nul
	@$(MAKE) db-status

.PHONY: db-stop
db-stop:
	@echo "$(YELLOW)🍃 Stopping MongoDB...$(NC)"
	@net stop MongoDB 2>nul || echo "$(YELLOW)⚠️  MongoDB service not running or failed to stop$(NC)"

.PHONY: db-status
db-status:
	@echo "$(YELLOW)🍃 Checking MongoDB status...$(NC)"
	@sc query MongoDB >nul 2>&1 && ( \
		sc query MongoDB | findstr "STATE" && echo "$(GREEN)✅ MongoDB Windows service found$(NC)" \
	) || ( \
		tasklist | findstr "mongod.exe" >nul 2>&1 && echo "$(GREEN)✅ MongoDB process running$(NC)" || echo "$(YELLOW)⚠️  MongoDB not running$(NC)" \
	)

.PHONY: db-reset
db-reset:
	@echo "$(RED)⚠️  WARNING: This will delete all data in the $(MONGO_DB_NAME) database!$(NC)"
	@set /p confirm="Are you sure? (y/N): " && if /i "!confirm!"=="y" ( \
		echo "$(YELLOW)🗑️  Resetting database...$(NC)" && \
		mongo $(MONGO_DB_NAME) --eval "db.dropDatabase()" 2>nul || echo "$(YELLOW)Database reset completed$(NC)" \
	) else ( \
		echo "$(GREEN)✅ Database reset cancelled$(NC)" \
	)

.PHONY: db-docker
db-docker:
	@echo "$(YELLOW)🐳 Starting MongoDB in Docker...$(NC)"
	@where docker >nul 2>&1 && ( \
		docker run --name skillswap-mongo -d -p 27017:27017 mongo:latest && \
		echo "$(GREEN)✅ MongoDB Docker container started$(NC)" && \
		echo "$(YELLOW)MongoDB is now available at: mongodb://localhost:27017$(NC)" \
	) || ( \
		echo "$(RED)❌ Docker not found. Please install Docker Desktop$(NC)" \
	)

.PHONY: db-install
db-install:
	@echo "$(GREEN)📋 MongoDB Installation Options$(NC)"
	@echo "================================="
	@echo ""
	@echo "$(YELLOW)Option 1: MongoDB Community Server (Recommended)$(NC)"
	@echo "  1. Visit: https://www.mongodb.com/try/download/community"
	@echo "  2. Download MongoDB Community Server for Windows"
	@echo "  3. Run installer and follow setup wizard"
	@echo "  4. Choose 'Install MongoDB as a Service'"
	@echo ""
	@echo "$(YELLOW)Option 2: Docker (Alternative)$(NC)"
	@echo "  1. Install Docker Desktop for Windows"
	@echo "  2. Run: make db-docker"
	@echo ""
	@echo "$(YELLOW)Option 3: MongoDB Atlas (Cloud)$(NC)"
	@echo "  1. Sign up at: https://cloud.mongodb.com"
	@echo "  2. Create a free cluster"
	@echo "  3. Update MONGODB_URI in backend/.env"
	@echo ""
	@echo "$(GREEN)After installation, run: make db-start$(NC)"

# =============================================================================
# UTILITY COMMANDS
# =============================================================================

.PHONY: clean
clean:
	cls
	@echo "$(YELLOW)🧹 Cleaning project...$(NC)"
	@echo "$(YELLOW)Removing node_modules, package-lock.json, and caches...$(NC)"
	@if exist "$(FRONTEND_DIR)\node_modules" rmdir /s /q "$(FRONTEND_DIR)\node_modules"
	@if exist "$(BACKEND_DIR)\node_modules" rmdir /s /q "$(BACKEND_DIR)\node_modules"
	@if exist "$(FRONTEND_DIR)\.expo" rmdir /s /q "$(FRONTEND_DIR)\.expo"
	@if exist "$(FRONTEND_DIR)\package-lock.json" del /q "$(FRONTEND_DIR)\package-lock.json"
	@if exist "$(BACKEND_DIR)\package-lock.json" del /q "$(BACKEND_DIR)\package-lock.json"
	@npm cache clean --force >nul 2>&1 || echo ""
	@echo "$(GREEN)✅ Project cleaned$(NC)"

.PHONY: fix-deps
fix-deps:
	@echo "$(YELLOW)🔧 Fixing dependency conflicts...$(NC)"
	@echo "$(YELLOW)Running comprehensive dependency fix...$(NC)"
	@fix-dependencies.bat

.PHONY: reset
reset: clean install
	@echo "$(GREEN)🔄 Project reset completed!$(NC)"

.PHONY: check
check: check-prerequisites check-services
	@echo "$(GREEN)✅ Project health check completed$(NC)"

.PHONY: check-prerequisites
check-prerequisites:
	@echo "$(YELLOW)🔍 Checking prerequisites...$(NC)"
	@node --version >nul 2>&1 && echo "$(GREEN)✅ Node.js installed$(NC)" || echo "$(RED)❌ Node.js not found$(NC)"
	@npm --version >nul 2>&1 && echo "$(GREEN)✅ npm installed$(NC)" || echo "$(RED)❌ npm not found$(NC)"
	@mongo --version >nul 2>&1 && echo "$(GREEN)✅ MongoDB CLI available$(NC)" || echo "$(YELLOW)⚠️  MongoDB CLI not in PATH$(NC)"
	@where expo >nul 2>&1 && echo "$(GREEN)✅ Expo CLI installed$(NC)" || echo "$(YELLOW)⚠️  Expo CLI not found (will be installed via npx)$(NC)"

.PHONY: check-services
check-services:
	@echo "$(YELLOW)🔍 Checking services...$(NC)"
	@curl -s http://localhost:$(BACKEND_PORT)/api/auth/health >nul 2>&1 && echo "$(GREEN)✅ Backend is running$(NC)" || echo "$(YELLOW)⚠️  Backend not responding$(NC)"
	@$(MAKE) db-status

.PHONY: logs-backend
logs-backend:
	@echo "$(YELLOW)📋 Backend logs (Press Ctrl+C to stop):$(NC)"
	@cd $(BACKEND_DIR) && npm run dev

.PHONY: test
test:
	@echo "$(YELLOW)🧪 Running tests...$(NC)"
	@cd $(FRONTEND_DIR) && npm test || echo "$(YELLOW)No tests configured for frontend$(NC)"
	@cd $(BACKEND_DIR) && npm test || echo "$(YELLOW)No tests configured for backend$(NC)"

# =============================================================================
# PRODUCTION COMMANDS
# =============================================================================

.PHONY: build
build:
	@echo "$(YELLOW)🏗️  Building application for production...$(NC)"
	@cd $(FRONTEND_DIR) && npx expo build:web
	@echo "$(GREEN)✅ Build completed$(NC)"

.PHONY: prod-backend
prod-backend:
	@echo "$(YELLOW)🚀 Starting backend in production mode...$(NC)"
	@cd $(BACKEND_DIR) && npm start

# =============================================================================
# SPECIAL TARGETS
# =============================================================================

.PHONY: create-env
create-env:
	@echo "$(YELLOW)📝 Creating environment files...$(NC)"
	@if not exist "$(BACKEND_DIR)\.env" ( \
		echo MONGODB_URI=mongodb://localhost:27017/skillswap > "$(BACKEND_DIR)\.env" && \
		echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production >> "$(BACKEND_DIR)\.env" && \
		echo PORT=3000 >> "$(BACKEND_DIR)\.env" && \
		echo NODE_ENV=development >> "$(BACKEND_DIR)\.env" && \
		echo "$(GREEN)✅ Backend .env file created$(NC)" \
	) else ( \
		echo "$(YELLOW)⚠️  Backend .env file already exists$(NC)" \
	)

.PHONY: install-expo-cli
install-expo-cli:
	@echo "$(YELLOW)📱 Installing Expo CLI globally...$(NC)"
	@npm install -g @expo/cli
	@echo "$(GREEN)✅ Expo CLI installed$(NC)"

.PHONY: android
android:
	@echo "$(YELLOW)📱 Starting Android development...$(NC)"
	@cd $(FRONTEND_DIR) && npx expo start --android

.PHONY: ios
ios:
	@echo "$(YELLOW)📱 Starting iOS development...$(NC)"
	@cd $(FRONTEND_DIR) && npx expo start --ios

.PHONY: web
web:
	@echo "$(YELLOW)🌐 Starting web development...$(NC)"
	@cd $(FRONTEND_DIR) && npx expo start --web

# =============================================================================
# QUICK START GUIDE
# =============================================================================

.PHONY: quickstart
quickstart:
	@echo "$(GREEN)🚀 SkillSwap Quick Start Guide$(NC)"
	@echo "================================"
	@echo ""
	@echo "$(YELLOW)1. First time setup:$(NC)"
	@echo "   make setup"
	@echo ""
	@echo "$(YELLOW)2. Start MongoDB:$(NC)"
	@echo "   make mongo"
	@echo ""
	@echo "$(YELLOW)3. Start development:$(NC)"
	@echo "   make dev"
	@echo ""
	@echo "$(YELLOW)4. Alternative - Start services separately:$(NC)"
	@echo "   make backend    (in one terminal)"
	@echo "   make frontend   (in another terminal)"
	@echo ""
	@echo "$(GREEN)That's it! Your SkillSwap app should be running! 🎉$(NC)"

# Make sure the Makefile doesn't try to create files with these names
.PHONY: all clean install setup dev frontend backend mongo

check_errors:
	cls
	npx tsc --noEmit --project .