comment lancer ce projet 
SkillSwap - Skill Exchange Platform
A React Native application for exchanging skills between users, built with Expo, Node.js, and MongoDB.

🚀 Quick Start
Prerequisites
Node.js (v16 or later)
MongoDB (installed and running)
Git
One-Command Setup
make setup
Start Development
# Start MongoDB
make mongo

# Start both frontend and backend
make dev
That's it! Your SkillSwap app should be running! 🎉

📱 What is SkillSwap?
SkillSwap is a mobile application that connects people who want to exchange skills. Users can:

Teach Skills: Share what you're good at (guitar, coding, cooking, etc.)
Learn Skills: Find people who can teach you what you want to learn
Match with People: AI-powered matching based on skills and location
Chat in Real-time: Communicate with your matches
Schedule Sessions: Plan and manage learning sessions
Rate & Review: Build trust through user ratings
🛠 Tech Stack
Frontend
React Native with Expo
TypeScript for type safety
React Navigation for navigation
Redux Toolkit for state management
React Native Paper for UI components
Expo Notifications for push notifications
Expo Location for geolocation
Expo Camera for profile photos
Backend
Node.js with Express
MongoDB with Mongoose
Socket.io for real-time messaging
JWT for authentication
bcryptjs for password hashing
📖 Detailed Setup Instructions
1. Clone the Repository
git clone <your-repo-url>
cd SkillSwap
2. Install Dependencies
# Install all dependencies (frontend + backend)
make install

# Or install separately
make install-frontend
make install-backend
3. Setup MongoDB
Make sure MongoDB is installed and running:

# Start MongoDB service
make mongo

# Check MongoDB status
make db-status
4. Environment Configuration
The Makefile will create the necessary environment files, but you can customize them:

Backend Environment (backend/.env):

MONGODB_URI=mongodb://localhost:27017/skillswap
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3000
NODE_ENV=development
🎮 Available Commands
Essential Commands
make help              # Show all available commands
make setup             # Complete project setup
make dev               # Start development environment
make mongo             # Start MongoDB
make clean             # Clean project
make reset             # Complete reset and reinstall
Development
make frontend          # Start only React Native app
make backend           # Start only Node.js server
make android           # Start Android development
make ios               # Start iOS development  
make web               # Start web development
Database Management
make db-start          # Start MongoDB
make db-stop           # Stop MongoDB
make db-status         # Check MongoDB status
make db-reset          # Reset database (⚠️ deletes all data)
Utilities
make check             # Check project health
make logs-backend      # Show backend logs
make test              # Run tests
make build             # Build for production
🏗 Project Structure
SkillSwap/
├── src/                          # Frontend source code
│   ├── components/               # Reusable UI components
│   │   ├── UserCard.tsx         # User profile card
│   │   ├── SkillCard.tsx        # Skill display card
│   │   └── SessionCard.tsx      # Session information card
│   ├── screens/                 # Screen components
│   │   ├── auth/                # Authentication screens
│   │   ├── chat/                # Chat functionality
│   │   ├── profile/             # Profile management
│   │   ├── skills/              # Skill management
│   │   └── sessions/            # Session management
│   ├── services/                # API and external services
│   │   ├── apiService.ts        # Core API communication
│   │   ├── authService.ts       # Authentication
│   │   ├── messageService.ts    # Real-time messaging
│   │   ├── notificationService.ts # Push notifications
│   │   └── locationService.ts   # Geolocation
│   ├── store/                   # Redux state management
│   │   └── slices/              # Redux slices
│   ├── navigation/              # App navigation
│   └── types/                   # TypeScript definitions
├── backend/                     # Backend source code
│   ├── models/                  # MongoDB models
│   │   ├── User.js              # User model
│   │   ├── Skill.js             # Skill model
│   │   ├── Match.js             # Match model
│   │   ├── Session.js           # Session model
│   │   └── Chat.js              # Chat & Message models
│   ├── routes/                  # API routes
│   │   ├── auth.js              # Authentication endpoints
│   │   ├── users.js             # User management
│   │   ├── skills.js            # Skill management
│   │   ├── matches.js           # Matchmaking
│   │   ├── sessions.js          # Session management
│   │   ├── chats.js             # Chat management
│   │   └── messages.js          # Message handling
│   ├── middleware/              # Express middleware
│   └── server.js                # Main server file
└── Makefile                     # Project automation
🎯 Key Features
User Management
User registration and authentication
Profile creation with skills and bio
Profile photo upload
Location-based user discovery
Skill Exchange
Add skills to teach and learn
Categorize skills (technology, music, cooking, etc.)
Skill level tracking (beginner to expert)
Skill-based user matching
Matchmaking
AI-powered compatibility scoring
Location-based matching
Skill intersection analysis
Match recommendations
Communication
Real-time chat with Socket.io
Message history
Chat notifications
Session planning through chat
Session Management
Schedule learning sessions
Session status tracking
Calendar integration
Session reminders
Native Features
Push notifications
Geolocation services
Camera integration
Offline support
🔧 Development Workflow
Day-to-day Development
Start your development session:

make mongo    # Start MongoDB
make dev      # Start both servers
Work on features using your preferred editor

Test changes on device/simulator

Clean up when needed:

make clean    # Clean caches
make reset    # Complete reset if needed
Testing on Devices
# For Android
make android

# For iOS  
make ios

# For Web
make web
📱 Using the App
First Time Setup
Register a new account
Complete your profile with bio and location
Add skills you can teach
Add skills you want to learn
Start finding matches!
Finding Matches
Use the search to find specific skills
Browse nearby users
Check your matches in the Matches tab
Start conversations with interesting people
Scheduling Sessions
Chat with your matches
Propose meeting times and locations
Confirm sessions
Get reminders before sessions
🐛 Troubleshooting
Common Issues
MongoDB Connection Issues:

make db-status    # Check if MongoDB is running
make mongo        # Try to start MongoDB
Frontend Won't Start:

make clean        # Clean node_modules and caches
make install-frontend
make frontend
Backend API Errors:

make logs-backend # Check backend logs
make check        # Run health checks
Complete Reset:

make reset        # Nuclear option - clean everything and reinstall
Port Conflicts
If you get port conflicts:

Frontend runs on: http://localhost:8081
Backend runs on: http://localhost:3000
MongoDB runs on: mongodb://localhost:27017
Change ports in:

Frontend: Expo will automatically find available ports
Backend: Edit backend/.env PORT variable
MongoDB: Edit backend/.env MONGODB_URI
🚀 Production Deployment
Backend Deployment
Set up MongoDB Atlas or dedicated MongoDB server
Configure environment variables for production
Deploy to your preferred platform (Heroku, AWS, etc.)
Frontend Deployment
make build                    # Build for web
npx expo build:android       # Build Android APK
npx expo build:ios          # Build iOS IPA
🤝 Contributing
Fork the repository
Create a feature branch
Make your changes
Test thoroughly with make test
Submit a pull request
📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Built with Expo and React Native
UI components from React Native Paper
Backend powered by Express and MongoDB
Real-time features with Socket.io
Happy skill swapping! 🎓✨

For support or questions, please open an issue on GitHub.


