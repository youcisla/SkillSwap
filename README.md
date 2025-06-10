# SkillSwap - Skill Exchange Platform

A React Native application for exchanging skills between users, built with Expo, Node.js, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or later)
- MongoDB (installed and running)
- Git

### One-Command Setup
```bash
make setup
```

### Start Development
```bash
# Start MongoDB
make mongo

# Start both frontend and backend
make dev
```

That's it! Your SkillSwap app should be running! 🎉

## 📱 What is SkillSwap?

SkillSwap is a mobile application that connects people who want to exchange skills. Users can:

- **Teach Skills**: Share what you're good at (guitar, coding, cooking, etc.)
- **Learn Skills**: Find people who can teach you what you want to learn
- **Match with People**: AI-powered matching based on skills and location
- **Chat in Real-time**: Communicate with your matches
- **Schedule Sessions**: Plan and manage learning sessions
- **Rate & Review**: Build trust through user ratings

## 🛠 Tech Stack

### Frontend
- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Redux Toolkit** for state management
- **React Native Paper** for UI components
- **Expo Notifications** for push notifications
- **Expo Location** for geolocation
- **Expo Camera** for profile photos

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.io** for real-time messaging
- **JWT** for authentication
- **bcryptjs** for password hashing

## 📖 Detailed Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd ProjetRN
```

### 2. Install Dependencies
```bash
# Install all dependencies (frontend + backend)
make install

# Or install separately
make install-frontend
make install-backend
```

### 3. Setup MongoDB
Make sure MongoDB is installed and running:
```bash
# Start MongoDB service
make mongo

# Check MongoDB status
make db-status
```

### 4. Environment Configuration
The Makefile will create the necessary environment files, but you can customize them:

**Backend Environment** (`backend/.env`):
```env
MONGODB_URI=mongodb://localhost:27017/skillswap
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3000
NODE_ENV=development
```

## 🎮 Available Commands

### Essential Commands
```bash
make help              # Show all available commands
make setup             # Complete project setup
make dev               # Start development environment
make mongo             # Start MongoDB
make clean             # Clean project
make reset             # Complete reset and reinstall
```

### Development
```bash
make frontend          # Start only React Native app
make backend           # Start only Node.js server
make android           # Start Android development
make ios               # Start iOS development  
make web               # Start web development
```

### Database Management
```bash
make db-start          # Start MongoDB
make db-stop           # Stop MongoDB
make db-status         # Check MongoDB status
make db-reset          # Reset database (⚠️ deletes all data)
```

### Utilities
```bash
make check             # Check project health
make logs-backend      # Show backend logs
make test              # Run tests
make build             # Build for production
```

## 🏗 Project Structure

```
ProjetRN/
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
```

## 🎯 Key Features

### User Management
- User registration and authentication
- Profile creation with skills and bio
- Profile photo upload
- Location-based user discovery

### Skill Exchange
- Add skills to teach and learn
- Categorize skills (technology, music, cooking, etc.)
- Skill level tracking (beginner to expert)
- Skill-based user matching

### Matchmaking
- AI-powered compatibility scoring
- Location-based matching
- Skill intersection analysis
- Match recommendations

### Communication
- Real-time chat with Socket.io
- Message history
- Chat notifications
- Session planning through chat

### Session Management
- Schedule learning sessions
- Session status tracking
- Calendar integration
- Session reminders

### Native Features
- Push notifications
- Geolocation services
- Camera integration
- Offline support

## 🔧 Development Workflow

### Day-to-day Development
1. **Start your development session:**
   ```bash
   make mongo    # Start MongoDB
   make dev      # Start both servers
   ```

2. **Work on features** using your preferred editor

3. **Test changes** on device/simulator

4. **Clean up when needed:**
   ```bash
   make clean    # Clean caches
   make reset    # Complete reset if needed
   ```

### Testing on Devices
```bash
# For Android
make android

# For iOS  
make ios

# For Web
make web
```

## 📱 Using the App

### First Time Setup
1. Register a new account
2. Complete your profile with bio and location
3. Add skills you can teach
4. Add skills you want to learn
5. Start finding matches!

### Finding Matches
- Use the search to find specific skills
- Browse nearby users
- Check your matches in the Matches tab
- Start conversations with interesting people

### Scheduling Sessions
- Chat with your matches
- Propose meeting times and locations
- Confirm sessions
- Get reminders before sessions

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Issues:**
```bash
make db-status    # Check if MongoDB is running
make mongo        # Try to start MongoDB
```

**Frontend Won't Start:**
```bash
make clean        # Clean node_modules and caches
make install-frontend
make frontend
```

**Backend API Errors:**
```bash
make logs-backend # Check backend logs
make check        # Run health checks
```

**Complete Reset:**
```bash
make reset        # Nuclear option - clean everything and reinstall
```

### Port Conflicts
If you get port conflicts:
- Frontend runs on: `http://localhost:8081`
- Backend runs on: `http://localhost:3000`
- MongoDB runs on: `mongodb://localhost:27017`

Change ports in:
- Frontend: Expo will automatically find available ports
- Backend: Edit `backend/.env` PORT variable
- MongoDB: Edit `backend/.env` MONGODB_URI

## 🚀 Production Deployment

### Backend Deployment
1. Set up MongoDB Atlas or dedicated MongoDB server
2. Configure environment variables for production
3. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment
```bash
make build                    # Build for web
npx expo build:android       # Build Android APK
npx expo build:ios          # Build iOS IPA
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with `make test`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Expo and React Native
- UI components from React Native Paper
- Backend powered by Express and MongoDB
- Real-time features with Socket.io

---

**Happy skill swapping! 🎓✨**

For support or questions, please open an issue on GitHub.
