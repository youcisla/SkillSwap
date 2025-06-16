import { ApiResponse, Skill, SkillCategory, SkillForm } from '../types';
import { ApiService } from './apiService';

class SkillService {
  async getUserSkills(userId: string): Promise<{ teach: Skill[]; learn: Skill[] }> {
    try {
      const response = await ApiService.get<ApiResponse<{ teach: Skill[]; learn: Skill[] }>>(
        `/skills/user/${userId}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get user skills');
    } catch (error) {
      console.error('Get user skills error:', error);
      throw error;
    }
  }

  async addSkill(userId: string, skillData: SkillForm, type: 'teach' | 'learn'): Promise<Skill> {
    try {
      // Validate required fields
      if (!skillData.name || !skillData.category || !skillData.level) {
        throw new Error('Missing required skill fields: name, category, or level');
      }
      
      if (!userId) {
        throw new Error('User ID is required');
      }

      const payload = { 
        ...skillData, 
        userId,
        // Ensure all required fields are present
        name: skillData.name.trim(),
        category: skillData.category,
        level: skillData.level,
        description: skillData.description || ''
      };
      
      const response = await ApiService.post<ApiResponse<Skill>>(
        `/skills/${type}`,
        payload
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to add skill');
    } catch (error) {
      throw error;
    }
  }

  async updateSkill(skillId: string, skillData: Partial<SkillForm>): Promise<Skill> {
    try {
      const response = await ApiService.put<ApiResponse<Skill>>(
        `/skills/${skillId}`,
        skillData
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to update skill');
    } catch (error) {
      console.error('Update skill error:', error);
      throw error;
    }
  }

  async deleteSkill(skillId: string): Promise<void> {
    try {
      const response = await ApiService.delete<ApiResponse<void>>(`/skills/${skillId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete skill');
      }
    } catch (error) {
      console.error('Delete skill error:', error);
      throw error;
    }
  }

  async searchSkills(query: string, category?: SkillCategory): Promise<Skill[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', query);
      
      if (category) {
        queryParams.append('category', category);
      }

      const response = await ApiService.get<ApiResponse<Skill[]>>(
        `/skills/search?${queryParams.toString()}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to search skills');
    } catch (error) {
      console.error('Search skills error:', error);
      throw error;
    }
  }

  async getPopularSkills(): Promise<Skill[]> {
    try {
      const response = await ApiService.get<ApiResponse<Skill[]>>('/skills/popular');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get popular skills');
    } catch (error) {
      console.error('Get popular skills error:', error);
      throw error;
    }
  }

  async getSkillsByCategory(category: SkillCategory): Promise<Skill[]> {
    try {
      const response = await ApiService.get<ApiResponse<Skill[]>>(
        `/skills/category/${category}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.error || 'Failed to get skills by category');
    } catch (error) {
      console.error('Get skills by category error:', error);
      throw error;
    }
  }

  async getAllCategories(): Promise<SkillCategory[]> {
    return Object.values(SkillCategory);
  }
}

export const skillService = new SkillService();
