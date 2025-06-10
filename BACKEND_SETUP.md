# SkillSwap Backend Setup

This guide will help you set up the MongoDB backend for SkillSwap.

## Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB installation
- npm or yarn

## Quick Setup

### 1. Create Backend Project
```bash
mkdir skillswap-backend
cd skillswap-backend
npm init -y
```

### 2. Install Dependencies
```bash
npm install express mongoose cors dotenv bcryptjs jsonwebtoken helmet express-rate-limit
npm install -D nodemon @types/node typescript ts-node
```

### 3. Environment Variables
Create a `.env` file in the backend directory:
```env
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillswap?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 4. MongoDB Atlas Setup
1. Create account at https://cloud.mongodb.com
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address
5. Get connection string and update MONGODB_URI in .env

### 5. Project Structure
```
skillswap-backend/
├── src/
│   ├── models/
│   │   ├── User.js
│   │   ├── Skill.js
│   │   ├── Match.js
│   │   ├── Session.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── skills.js
│   │   ├── matches.js
│   │   ├── sessions.js
│   │   └── messages.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── controllers/
│   └── utils/
├── package.json
├── .env
└── server.js
```

### 6. Start Development Server
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/search` - Search users
- `GET /api/users/nearby` - Get nearby users

### Skills
- `GET /api/skills/user/:userId` - Get user skills
- `POST /api/skills/teach` - Add teaching skill
- `POST /api/skills/learn` - Add learning skill
- `PUT /api/skills/:id` - Update skill
- `DELETE /api/skills/:id` - Delete skill

### Matches
- `GET /api/matches/user/:userId` - Get user matches
- `POST /api/matches` - Create match
- `GET /api/matches/find/:userId` - Find potential matches

### Sessions
- `GET /api/sessions/user/:userId` - Get user sessions
- `POST /api/sessions` - Create session
- `PUT /api/sessions/:id/status` - Update session status

### Messages
- `GET /api/chats/user/:userId` - Get user chats
- `GET /api/chats/:chatId/messages` - Get chat messages
- `POST /api/messages` - Send message

## Frontend Configuration

Update your React Native app's `src/services/apiService.ts`:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:3000/api'  // Android Emulator
  : 'https://your-deployed-backend.herokuapp.com/api';
```

For iOS Simulator, use: `http://localhost:3000/api`
For Android Emulator, use: `http://10.0.2.2:3000/api`
For physical device, use your computer's IP: `http://192.168.1.x:3000/api`

## Deployment

### Heroku Deployment
1. Install Heroku CLI
2. Create Heroku app: `heroku create skillswap-backend`
3. Set environment variables in Heroku dashboard
4. Deploy: `git push heroku main`

### Vercel Deployment
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`
3. Set environment variables in Vercel dashboard

## Testing
Use tools like Postman or Insomnia to test your API endpoints.

## Security Considerations
- Always use HTTPS in production
- Implement proper input validation
- Use rate limiting
- Keep JWT secrets secure
- Validate file uploads
- Implement proper CORS policy
