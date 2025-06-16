// Match Data Normalizer - Ensures consistent match data structure across the app

export interface StandardizedUser {
  id: string;
  _id?: string;
  name: string;
  email?: string;
  profileImage?: string;
  city?: string;
  bio?: string;
  rating?: number;
  totalSessions?: number;
  skillsToTeach?: StandardizedSkill[];
  skillsToLearn?: StandardizedSkill[];
}

export interface StandardizedSkill {
  id?: string;
  _id?: string;
  skillId?: string;
  name: string;
  skillName?: string;
  category?: string;
  level?: string;
  description?: string;
}

export interface StandardizedMatch {
  id: string;
  _id?: string;
  user1Id?: StandardizedUser;
  user2Id?: StandardizedUser;
  user?: StandardizedUser; // For dynamic matches
  user1Skills?: StandardizedSkill[];
  user2Skills?: StandardizedSkill[];
  compatibilityScore: number;
  status?: string;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // Dynamic match specific fields
  sharedSkills?: {
    canTeach?: string[];
    canLearnFrom?: string[];
  };
  distance?: number | null;
  matchReasons?: string[];
}

export class MatchDataNormalizer {
  /**
   * Normalize user data to ensure consistent structure
   */
  static normalizeUser(userData: any): StandardizedUser | null {
    if (!userData) return null;
    
    if (typeof userData === 'string') {
      // If it's just an ID, we can't normalize properly
      return null;
    }
    
    if (typeof userData === 'object') {
      return {
        id: userData.id || userData._id?.toString() || '',
        _id: userData._id,
        name: userData.name || 'Unknown User',
        email: userData.email,
        profileImage: userData.profileImage,
        city: userData.city || 'Unknown Location',
        bio: userData.bio,
        rating: typeof userData.rating === 'number' ? userData.rating : 0,
        totalSessions: typeof userData.totalSessions === 'number' ? userData.totalSessions : 0,
        skillsToTeach: userData.skillsToTeach ? this.normalizeSkills(userData.skillsToTeach) : undefined,
        skillsToLearn: userData.skillsToLearn ? this.normalizeSkills(userData.skillsToLearn) : undefined
      };
    }
    
    return null;
  }

  /**
   * Normalize skills array to ensure consistent structure
   */
  static normalizeSkills(skills: any[]): StandardizedSkill[] {
    if (!Array.isArray(skills)) return [];
    
    return skills
      .map(skill => {
        if (typeof skill === 'string') {
          return { name: skill, skillName: skill };
        }
        if (skill && typeof skill === 'object') {
          return {
            id: skill.id || skill._id?.toString(),
            _id: skill._id,
            skillId: skill.skillId,
            name: skill.name || skill.skillName || '',
            skillName: skill.skillName || skill.name,
            category: skill.category,
            level: skill.level,
            description: skill.description
          };
        }
        return null;
      })
      .filter(Boolean) as StandardizedSkill[];
  }

  /**
   * Normalize match data from backend to ensure consistent structure
   */
  static normalizeMatch(matchData: any): StandardizedMatch | null {
    if (!matchData) return null;

    const normalized: StandardizedMatch = {
      id: matchData.id || matchData._id?.toString() || '',
      _id: matchData._id,
      compatibilityScore: matchData.compatibilityScore || 0,
      status: matchData.status || 'pending',
      isActive: matchData.isActive !== false, // Default to true
      createdAt: matchData.createdAt,
      updatedAt: matchData.updatedAt
    };

    // Handle regular matches with user1Id/user2Id structure
    if (matchData.user1Id || matchData.user2Id) {
      normalized.user1Id = this.normalizeUser(matchData.user1Id);
      normalized.user2Id = this.normalizeUser(matchData.user2Id);
      normalized.user1Skills = this.normalizeSkills(matchData.user1Skills || []);
      normalized.user2Skills = this.normalizeSkills(matchData.user2Skills || []);
    }

    // Handle dynamic matches with user structure
    if (matchData.user) {
      normalized.user = this.normalizeUser(matchData.user);
      normalized.sharedSkills = matchData.sharedSkills;
      normalized.distance = matchData.distance;
      normalized.matchReasons = matchData.matchReasons;
    }

    return normalized;
  }

  /**
   * Get the other user from a match (not the current user)
   */
  static getOtherUser(match: StandardizedMatch, currentUserId: string): StandardizedUser | null {
    if (match.user) {
      // Dynamic match format
      return match.user;
    }

    if (match.user1Id && match.user2Id) {
      // Regular match format
      const user1Id = match.user1Id.id || match.user1Id._id;
      const user2Id = match.user2Id.id || match.user2Id._id;
      
      if (String(user1Id) !== String(currentUserId)) {
        return match.user1Id;
      }
      
      if (String(user2Id) !== String(currentUserId)) {
        return match.user2Id;
      }
    }

    return null;
  }

  /**
   * Get the skills for the other user in a match
   */
  static getOtherUserSkills(match: StandardizedMatch, currentUserId: string): StandardizedSkill[] {
    if (match.user) {
      // Dynamic match - return combined skills
      const teachSkills = match.user.skillsToTeach || [];
      const learnSkills = match.user.skillsToLearn || [];
      return [...teachSkills, ...learnSkills];
    }

    if (match.user1Id && match.user2Id) {
      const user1Id = match.user1Id.id || match.user1Id._id;
      
      if (String(user1Id) === String(currentUserId)) {
        return match.user2Skills || [];
      } else {
        return match.user1Skills || [];
      }
    }

    return [];
  }

  /**
   * Extract skill names from a skills array
   */
  static extractSkillNames(skills: StandardizedSkill[]): string[] {
    return skills
      .map(skill => skill.name || skill.skillName || '')
      .filter(Boolean);
  }

  /**
   * Normalize array of matches
   */
  static normalizeMatches(matches: any[]): StandardizedMatch[] {
    if (!Array.isArray(matches)) return [];
    
    return matches
      .map(match => this.normalizeMatch(match))
      .filter(Boolean) as StandardizedMatch[];
  }
}
