// User-related types
export interface User {
  id: string;
  email: string;
  name: string;
  city: string;
  profileImage?: string;
  role?: 'user' | 'admin' | 'super-admin';
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  skillsToTeach: Skill[];
  skillsToLearn: Skill[];
  availability: Availability[];
  bio?: string;
  rating?: number;
  totalSessions?: number;
  followersCount?: number;
  followingCount?: number;
}

// Skill-related types
export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  level: SkillLevel;
  userId?: string;
  type: 'teach' | 'learn';
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum SkillCategory {
  TECHNOLOGY = 'technology',
  MUSIC = 'music',
  COOKING = 'cooking',
  SPORTS = 'sports',
  LANGUAGES = 'languages',
  ARTS = 'arts',
  OTHER = 'other'
}

// Availability types
export interface Availability {
  id: string;
  userId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

// Session/Match types
export interface Session {
  id: string;
  teacherId: string;
  studentId: string;
  skillId: string;
  status: SessionStatus;
  scheduledAt: Date;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum SessionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Message types
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  chatId?: string;
  sessionId?: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: Date;
}

// Match types
export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  user1Skills: string[]; // Skills user1 can teach that user2 wants to learn
  user2Skills: string[]; // Skills user2 can teach that user1 wants to learn
  compatibilityScore: number;
  createdAt: Date;
}

// Location types
export interface UserLocation {
  userId: string;
  latitude: number;
  longitude: number;
  city: string;
  updatedAt: Date;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  HomeMain: undefined;
  UserProfile: { userId?: string };
  MatchUserProfile: { userId?: string };
  ProfileMain: { userId?: string };
  EditProfile: undefined;
  SkillManagement: undefined;
  AddSkill: { type: 'teach' | 'learn' };
  AdminDashboard: undefined;
  ContentModeration: undefined;
  SystemSettings: undefined;
  UserList: { skillId?: string };
  Chat: { chatId: string; otherUserId: string; otherUserName?: string };
  MatchChat: { chatId: string; otherUserId: string; otherUserName?: string };
  MessageChat: { chatId: string; otherUserId: string; otherUserName?: string };
  ChatList: undefined;
  SessionDetails: { sessionId: string };
  SessionRequest: { 
    otherUserId: string; 
    skillId: string; 
    skillName: string; 
    isTeaching: boolean; 
  };
  Feedback: { sessionId: string; otherUserName: string };
  Calendar: undefined;
  CalendarMain: undefined;
  Matches: undefined;
  MatchesMain: undefined;
  Messages: undefined;
  MessagesMain: undefined;
  Followers: { userId: string };
  Following: { userId: string };
};

export type TabParamList = {
  Home: undefined;
  Matches: undefined;
  Messages: undefined;
  Profile: undefined;
  Calendar: undefined;
};

// Stack-specific param lists
export type HomeStackParamList = {
  HomeMain: undefined;
  UserList: { skillId?: string };
  UserProfile: { userId?: string };
  HomeChat: { chatId: string; otherUserId: string; otherUserName?: string };
};

export type MatchesStackParamList = {
  MatchesMain: undefined;
  MatchUserProfile: { userId?: string };
  MatchChat: { chatId: string; otherUserId: string; otherUserName?: string };
};

export type MessagesStackParamList = {
  MessagesMain: undefined;
  MessageChat: { chatId: string; otherUserId: string; otherUserName?: string };
};

export type ProfileStackParamList = {
  ProfileMain: { userId?: string };
  EditProfile: undefined;
  SkillManagement: undefined;
  AddSkill: { type: 'teach' | 'learn' };
  Followers: { userId: string };
  Following: { userId: string };
};

export type CalendarStackParamList = {
  CalendarMain: undefined;
  SessionDetails: { sessionId: string };
};

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  city: string;
}

export interface ProfileForm {
  name: string;
  city: string;
  bio: string;
  profileImage?: string;
}

export interface SkillForm {
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  description: string;
}

// Store types
export interface RootState {
  auth: AuthState;
  user: UserState;
  skills: SkillState;
  sessions: SessionState;
  messages: MessageState;
  matches: MatchState;
  follows: FollowState;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface UserState {
  currentUser: UserProfile | null;
  users: UserProfile[];
  loading: boolean;
  error: string | null;
}

export interface SkillState {
  skills: Skill[];
  categories: SkillCategory[];
  loading: boolean;
  error: string | null;
}

export interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  loading: boolean;
  error: string | null;
}

export interface MessageState {
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  loading: boolean;
  error: string | null;
}

export interface MatchState {
  matches: Match[];
  loading: boolean;
  error: string | null;
}

// Follow types
export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FollowUser extends UserProfile {
  followedAt: Date;
}

export interface FollowStats {
  followersCount: number;
  followingCount: number;
}

export interface FollowState {
  followers: FollowUser[];
  following: FollowUser[];
  mutualFollows: UserProfile[];
  followStats: FollowStats | null;
  isFollowing: { [userId: string]: boolean };
  loading: boolean;
  error: string | null;
}
