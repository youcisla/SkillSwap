import { useCallback, useMemo, useState } from 'react';

export interface SearchFilters {
  query?: string;
  category?: string;
  level?: string;
  location?: string;
  minRating?: number;
  maxDistance?: number;
  skillTypes?: ('teach' | 'learn')[];
  sortBy?: 'relevance' | 'rating' | 'distance' | 'newest';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  filters: SearchFilters;
}

export const useAdvancedSearch = <T extends Record<string, any>>(
  items: T[],
  searchFields: (keyof T)[],
  initialFilters: SearchFilters = {}
) => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search function
  const searchItems = useCallback(
    (searchFilters: SearchFilters): SearchResult<T> => {
      setIsLoading(true);

      try {
        let filteredItems = [...items];

        // Text search across specified fields
        if (searchFilters.query && searchFilters.query.trim()) {
          const query = searchFilters.query.toLowerCase().trim();
          filteredItems = filteredItems.filter(item =>
            searchFields.some(field => {
              const fieldValue = item[field];
              if (typeof fieldValue === 'string') {
                return fieldValue.toLowerCase().includes(query);
              }
              if (Array.isArray(fieldValue)) {
                return fieldValue.some((val: any) => 
                  typeof val === 'string' && val.toLowerCase().includes(query)
                );
              }
              return false;
            })
          );
        }

        // Category filter
        if (searchFilters.category) {
          filteredItems = filteredItems.filter(item => {
            const category = item.category || item.skillCategory;
            return category && category.toLowerCase() === searchFilters.category?.toLowerCase();
          });
        }

        // Level filter
        if (searchFilters.level) {
          filteredItems = filteredItems.filter(item => {
            const level = item.level || item.skillLevel;
            return level && level.toLowerCase() === searchFilters.level?.toLowerCase();
          });
        }

        // Location filter
        if (searchFilters.location) {
          filteredItems = filteredItems.filter(item => {
            const location = item.city || item.location;
            return location && location.toLowerCase().includes(searchFilters.location?.toLowerCase() || '');
          });
        }

        // Rating filter
        if (searchFilters.minRating !== undefined) {
          filteredItems = filteredItems.filter(item => {
            const rating = item.rating || item.averageRating;
            return rating && rating >= (searchFilters.minRating || 0);
          });
        }

        // Distance filter (if location coordinates are available)
        if (searchFilters.maxDistance !== undefined && searchFilters.location) {
          // This would require actual geolocation calculation
          // For now, we'll skip this filter
        }

        // Skill types filter
        if (searchFilters.skillTypes && searchFilters.skillTypes.length > 0) {
          filteredItems = filteredItems.filter(item => {
            const skillType = item.type || item.skillType;
            return skillType && searchFilters.skillTypes?.includes(skillType);
          });
        }

        // Sorting
        if (searchFilters.sortBy) {
          filteredItems.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (searchFilters.sortBy) {
              case 'rating':
                aValue = a.rating || a.averageRating || 0;
                bValue = b.rating || b.averageRating || 0;
                break;
              case 'distance':
                aValue = a.distance || 0;
                bValue = b.distance || 0;
                break;
              case 'newest':
                aValue = new Date(a.createdAt || a.updatedAt || 0).getTime();
                bValue = new Date(b.createdAt || b.updatedAt || 0).getTime();
                break;
              case 'relevance':
              default:
                // For relevance, we could implement a scoring system
                // For now, maintain original order
                return 0;
            }

            const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            return searchFilters.sortOrder === 'desc' ? -comparison : comparison;
          });
        }

        return {
          items: filteredItems,
          totalCount: filteredItems.length,
          hasMore: false, // For simple filtering, we get all results at once
          filters: searchFilters,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [items, searchFields]
  );

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const results = useMemo(() => searchItems(filters), [searchItems, filters]);

  // Quick search without updating state
  const quickSearch = useCallback(
    (query: string): T[] => {
      if (!query.trim()) return items;
      
      const searchQuery = query.toLowerCase().trim();
      return items.filter(item =>
        searchFields.some(field => {
          const fieldValue = item[field];
          if (typeof fieldValue === 'string') {
            return fieldValue.toLowerCase().includes(searchQuery);
          }
          if (Array.isArray(fieldValue)) {
            return fieldValue.some((val: any) => 
              typeof val === 'string' && val.toLowerCase().includes(searchQuery)
            );
          }
          return false;
        })
      );
    },
    [items, searchFields]
  );

  return {
    results,
    filters,
    updateFilters,
    clearFilters,
    quickSearch,
    isLoading,
    setFilters,
  };
};

// Helper function to highlight search terms in text
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

// Predefined filter presets
export const searchPresets = {
  skills: {
    beginner: { level: 'beginner', sortBy: 'relevance' as const },
    advanced: { level: 'advanced', sortBy: 'rating' as const },
    teaching: { skillTypes: ['teach' as const], sortBy: 'rating' as const },
    learning: { skillTypes: ['learn' as const], sortBy: 'newest' as const },
    highRated: { minRating: 4.0, sortBy: 'rating' as const, sortOrder: 'desc' as const },
  },
  users: {
    nearby: { maxDistance: 10, sortBy: 'distance' as const },
    topRated: { minRating: 4.5, sortBy: 'rating' as const, sortOrder: 'desc' as const },
    recent: { sortBy: 'newest' as const, sortOrder: 'desc' as const },
  },
  sessions: {
    upcoming: { sortBy: 'newest' as const },
    completed: { sortBy: 'newest' as const, sortOrder: 'desc' as const },
  },
} as const;

export default useAdvancedSearch;
