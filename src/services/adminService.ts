import { ApiService } from './apiService';

export interface AdminDashboardData {
  statistics: {
    users: { total: number; active: number; inactive: number };
    skills: { total: number; active: number };
    sessions: { total: number; pending: number; completed: number };
    matches: { total: number; active: number };
    communication: { chats: number; messages: number };
  };
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    city: string;
    createdAt: string;
    isActive: boolean;
  }>;
  topSkills: Array<{ _id: string; count: number }>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  city: string;
  role: 'user' | 'admin' | 'super-admin';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  lastActive: string;
  skillsToTeach: Array<{ name: string; category: string }>;
  skillsToLearn: Array<{ name: string; category: string }>;
  totalSessions: number;
  rating: number;
}

export interface AdminSkill {
  id: string;
  name: string;
  category: string;
  level: string;
  type: 'teach' | 'learn';
  description: string;
  isActive: boolean;
  userId: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface AdminSession {
  id: string;
  teacherId: {
    id: string;
    name: string;
    email: string;
  };
  studentId: {
    id: string;
    name: string;
    email: string;
  };
  skillId: {
    id: string;
    name: string;
    category: string;
  };
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
  feedback?: any;
}

export interface AdminAnalytics {
  userGrowth: Array<{ _id: string; count: number }>;
  skillDistribution: Array<{ _id: string; count: number }>;
  sessionStats: Array<{ _id: string; count: number }>;
  topUsers: Array<{
    id: string;
    name: string;
    email: string;
    totalSessions: number;
    rating: number;
  }>;
  engagementMetrics: {
    activeUsers: number;
    messagesThisWeek: number;
  };
}

class AdminService {
  // Dashboard
  async getDashboard(): Promise<AdminDashboardData> {
    const response = await ApiService.get<{ success: boolean; data: AdminDashboardData }>('/admin/dashboard');
    return response.data;
  }

  // User Management
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
  } = {}): Promise<{ users: AdminUser[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, String(value));
    });
    
    const response = await ApiService.get<{ success: boolean; data: { users: AdminUser[]; pagination: any } }>(
      `/admin/users?${queryParams.toString()}`
    );
    return response.data;
  }

  async updateUser(userId: string, updates: {
    isActive?: boolean;
    role?: string;
    permissions?: string[];
  }): Promise<AdminUser> {
    const response = await ApiService.put<{ success: boolean; data: AdminUser }>(
      `/admin/users/${userId}`,
      updates
    );
    return response.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await ApiService.delete(`/admin/users/${userId}`);
  }

  // Skills Management
  async getSkills(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    type?: string;
    status?: string;
  } = {}): Promise<{ skills: AdminSkill[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, String(value));
    });
    
    const response = await ApiService.get<{ success: boolean; data: { skills: AdminSkill[]; pagination: any } }>(
      `/admin/skills?${queryParams.toString()}`
    );
    return response.data;
  }

  async updateSkill(skillId: string, updates: Partial<AdminSkill>): Promise<AdminSkill> {
    const response = await ApiService.put<{ success: boolean; data: AdminSkill }>(
      `/admin/skills/${skillId}`,
      updates
    );
    return response.data;
  }

  async deleteSkill(skillId: string): Promise<void> {
    await ApiService.delete(`/admin/skills/${skillId}`);
  }

  // Sessions Management
  async getSessions(params: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<{ sessions: AdminSession[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, String(value));
    });
    
    const response = await ApiService.get<{ success: boolean; data: { sessions: AdminSession[]; pagination: any } }>(
      `/admin/sessions?${queryParams.toString()}`
    );
    return response.data;
  }

  async updateSession(sessionId: string, updates: Partial<AdminSession>): Promise<AdminSession> {
    const response = await ApiService.put<{ success: boolean; data: AdminSession }>(
      `/admin/sessions/${sessionId}`,
      updates
    );
    return response.data;
  }

  // Analytics
  async getAnalytics(period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<AdminAnalytics> {
    const response = await ApiService.get<{ success: boolean; data: AdminAnalytics }>(
      `/admin/analytics?period=${period}`
    );
    return response.data;
  }

  // Bulk Actions
  async performBulkAction(params: {
    action: 'delete' | 'activate' | 'update';
    type: 'users' | 'skills' | 'sessions';
    ids: string[];
    data?: any;
  }): Promise<{ success: boolean; processed: number }> {
    const response = await ApiService.post<{ success: boolean; processed: number }>(
      '/admin/bulk-actions',
      params
    );
    return response;
  }

  // Content Moderation
  async getReports(params: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
    type?: string;
  } = {}): Promise<{ reports: any[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, String(value));
    });
    
    const response = await ApiService.get<{ success: boolean; data: { reports: any[]; pagination: any } }>(
      `/admin/reports?${queryParams.toString()}`
    );
    return response.data;
  }

  async updateReport(reportId: string, updates: {
    status?: string;
    action?: string;
    notes?: string;
  }): Promise<any> {
    const response = await ApiService.put<{ success: boolean; data: any }>(
      `/admin/reports/${reportId}`,
      updates
    );
    return response.data;
  }

  // System Settings
  async getSystemSettings(): Promise<any> {
    const response = await ApiService.get<{ success: boolean; data: any }>('/admin/system-settings');
    return response.data;
  }

  async updateSystemSettings(settings: any): Promise<any> {
    const response = await ApiService.put<{ success: boolean; data: any }>(
      '/admin/system-settings',
      settings
    );
    return response.data;
  }

  // Enhanced Analytics
  async getChartsData(params: {
    period?: '7d' | '30d' | '90d' | '1y';
    type?: 'users' | 'skills' | 'sessions';
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, String(value));
    });
    
    const response = await ApiService.get<{ success: boolean; data: any }>(
      `/admin/analytics/charts?${queryParams.toString()}`
    );
    return response.data;
  }

  // System Health
  async getSystemHealth(): Promise<any> {
    const response = await ApiService.get<{ success: boolean; data: any }>('/admin/health');
    return response.data;
  }
}

export const adminService = new AdminService();
