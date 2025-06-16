// Unified Search Service - Single source of truth for user search
import { UserProfile } from '../types';
import { EnhancedApiService } from './enhancedApiService';

export interface SearchParams {
  query?: string;
  filter?: 'all' | 'teachers' | 'students' | 'recommended';
  currentUserId?: string | null;
  page?: number;
  limit?: number;
  location?: string;
  skillCategories?: string[];
}

export interface SearchResult {
  success: boolean;
  data: UserProfile[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    cached?: boolean;
    responseTime?: number;
    clientFiltered?: boolean;
    note?: string;
    [key: string]: any;
  };
  error?: string;
}

interface SearchFilters {
  city?: string;
  skillsToTeach?: string[];
  skillsToLearn?: string[];
  minRating?: number;
  maxDistance?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Unified Search Service that consolidates all user search functionality
 * This replaces the duplicate logic in userService and EnhancedApiService
 */
class UnifiedSearchService {
  /**
   * Primary search method for users
   */
  async searchUsers(params: SearchParams): Promise<SearchResult> {
    try {
      console.log('🔍 UnifiedSearchService: Searching users with params:', params);
      
      // Validate parameters
      if (!params.currentUserId || params.currentUserId === 'undefined' || params.currentUserId === null) {
        console.warn('UnifiedSearchService: Invalid currentUserId:', params.currentUserId);
        return {
          success: false,
          data: [],
          error: 'Invalid current user ID'
        };
      }

      // Use EnhancedApiService as the underlying implementation
      const result = await EnhancedApiService.searchUsers({
        query: params.query || '',
        filter: params.filter || 'all',
        currentUserId: params.currentUserId,
        page: params.page || 1,
        limit: params.limit || 20
      });

      console.log('🔍 UnifiedSearchService: Search result:', {
        success: result.success,
        dataLength: result.data?.length || 0,
        hasError: !!result.error
      });

      return result;
    } catch (error) {
      console.error('UnifiedSearchService: Search error:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * Advanced search with detailed filters
   */
  async searchWithFilters(params: SearchParams & { filters?: SearchFilters }): Promise<SearchResult> {
    try {
      // For now, delegate to primary search
      // Can be enhanced later with more sophisticated filtering
      const baseResult = await this.searchUsers(params);
      
      if (!baseResult.success || !params.filters) {
        return baseResult;
      }

      // Apply client-side filters if needed
      let filteredData = baseResult.data;

      // Filter by minimum rating
      if (params.filters.minRating && params.filters.minRating > 0) {
        filteredData = filteredData.filter(user => 
          (user.rating || 0) >= params.filters!.minRating!
        );
      }

      // Filter by city (if not already handled by backend)
      if (params.filters.city) {
        filteredData = filteredData.filter(user => 
          user.city?.toLowerCase().includes(params.filters!.city!.toLowerCase())
        );
      }

      return {
        ...baseResult,
        data: filteredData,
        meta: {
          ...baseResult.meta,
          clientFiltered: true
        }
      };
    } catch (error) {
      console.error('UnifiedSearchService: Advanced search error:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Advanced search failed'
      };
    }
  }

  /**
   * Search for users by specific skills
   */
  async searchBySkills(
    skills: string[], 
    currentUserId: string, 
    type: 'teach' | 'learn' | 'both' = 'both'
  ): Promise<SearchResult> {
    try {
      // Convert skills array to search query
      const skillQuery = skills.join(' ');
      
      const filter = type === 'teach' ? 'teachers' : type === 'learn' ? 'students' : 'all';
      
      return await this.searchUsers({
        query: skillQuery,
        filter,
        currentUserId,
        limit: 50
      });
    } catch (error) {
      console.error('UnifiedSearchService: Skill search error:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Skill search failed'
      };
    }
  }

  /**
   * Search for nearby users (requires location)
   */
  async searchNearby(
    currentUserId: string,
    coordinates: { latitude: number; longitude: number },
    radius: number = 10
  ): Promise<SearchResult> {
    try {
      // For now, do a general search and filter by location client-side
      // This can be enhanced with geospatial queries on the backend
      const result = await this.searchUsers({
        query: '',
        currentUserId,
        limit: 100
      });

      if (!result.success) {
        return result;
      }

      // This would be better handled by backend with geospatial queries
      // For now, return all users (location filtering would need proper geospatial implementation)
      return {
        ...result,
        meta: {
          ...result.meta,
          note: 'Location filtering needs backend geospatial implementation'
        }
      };
    } catch (error) {
      console.error('UnifiedSearchService: Nearby search error:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Nearby search failed'
      };
    }
  }

  /**
   * Get search suggestions based on query
   */
  async getSearchSuggestions(query: string, currentUserId: string): Promise<string[]> {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      // Get a small sample of users to extract suggestions
      const result = await this.searchUsers({
        query,
        currentUserId,
        limit: 10
      });

      if (!result.success) {
        return [];
      }

      // Extract skill names and user names as suggestions
      const suggestions: Set<string> = new Set();

      result.data.forEach(user => {
        // Add user name
        if (user.name) {
          suggestions.add(user.name);
        }

        // Add skills
        user.skillsToTeach?.forEach(skill => {
          if (skill.name) {
            suggestions.add(skill.name);
          }
        });

        user.skillsToLearn?.forEach(skill => {
          if (skill.name) {
            suggestions.add(skill.name);
          }
        });
      });

      return Array.from(suggestions).slice(0, 5); // Return top 5 suggestions
    } catch (error) {
      console.error('UnifiedSearchService: Suggestions error:', error);
      return [];
    }
  }

  /**
   * Clear any cached search data
   */
  clearCache(): void {
    EnhancedApiService.invalidateCache('users');
  }
}

// Create and export singleton instance
export const unifiedSearchService = new UnifiedSearchService();

// Export the class for type usage
export { UnifiedSearchService };

// Default export
export default unifiedSearchService;
