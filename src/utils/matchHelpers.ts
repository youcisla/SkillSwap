/**
 * Utility functions for handling match data consistently across the application
 */

import { Match, UserProfile } from '../types';

export interface StandardizedMatch {
  id: string;
  user1: UserProfile;
  user2: UserProfile;
  skills: {
    user1Skills: string[];
    user2Skills: string[];
    sharedSkills: string[];
  };
  compatibility: {
    score: number;
    factors: string[];
  };
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extracts the other user from a match based on current user ID
 */
export const getOtherUserFromMatch = (match: Match, currentUserId: string): UserProfile | null => {
  const matchData = match as any;
  
  // Handle populated match data where user1Id and user2Id are objects
  const user1Data = matchData.user1Id;
  const user2Data = matchData.user2Id;
  
  // Extract actual IDs for comparison (handle both string IDs and populated objects)
  const user1Id = typeof user1Data === 'object' ? user1Data.id || user1Data._id : user1Data;
  const user2Id = typeof user2Data === 'object' ? user2Data.id || user2Data._id : user2Data;
  
  // Determine which user is the "other" user and return the populated data
  if (String(user1Id) === String(currentUserId)) {
    // Current user is user1, so return user2
    return typeof user2Data === 'object' ? user2Data : null;
  } else if (String(user2Id) === String(currentUserId)) {
    // Current user is user2, so return user1
    return typeof user1Data === 'object' ? user1Data : null;
  }
  
  return null;
};

/**
 * Extracts the other user's ID from a match
 */
export const getOtherUserIdFromMatch = (match: Match, currentUserId: string): string | null => {
  const matchData = match as any;
  
  const user1Id = typeof matchData.user1Id === 'object' 
    ? matchData.user1Id.id || matchData.user1Id._id 
    : matchData.user1Id;
  const user2Id = typeof matchData.user2Id === 'object' 
    ? matchData.user2Id.id || matchData.user2Id._id 
    : matchData.user2Id;
  
  if (String(user1Id) === String(currentUserId)) {
    return String(user2Id);
  } else if (String(user2Id) === String(currentUserId)) {
    return String(user1Id);
  }
  
  return null;
};

/**
 * Extracts skills for the current user from a match
 */
export const getUserSkillsFromMatch = (match: Match, currentUserId: string): string[] => {
  const matchData = match as any;
  
  const user1Id = typeof matchData.user1Id === 'object' 
    ? matchData.user1Id.id || matchData.user1Id._id 
    : matchData.user1Id;
  
  const skills = String(user1Id) === String(currentUserId) 
    ? match.user1Skills 
    : match.user2Skills;
  
  return normalizeSkillsArray(skills);
};

/**
 * Extracts skills for the other user from a match
 */
export const getOtherUserSkillsFromMatch = (match: Match, currentUserId: string): string[] => {
  const matchData = match as any;
  
  const user1Id = typeof matchData.user1Id === 'object' 
    ? matchData.user1Id.id || matchData.user1Id._id 
    : matchData.user1Id;
  
  const skills = String(user1Id) === String(currentUserId) 
    ? match.user2Skills 
    : match.user1Skills;
  
  return normalizeSkillsArray(skills);
};

/**
 * Normalizes skills array to always return string array
 */
export const normalizeSkillsArray = (skills: any): string[] => {
  if (!Array.isArray(skills)) {
    return [];
  }
  
  return skills.map(skill => {
    if (typeof skill === 'string') {
      return skill;
    } else if (skill && typeof skill === 'object') {
      return skill.skillName || skill.name || '';
    }
    return '';
  }).filter(skillName => skillName && skillName.length > 0);
};

/**
 * Calculates shared skills between two users in a match
 */
export const getSharedSkills = (match: Match, currentUserId: string): string[] => {
  const userSkills = getUserSkillsFromMatch(match, currentUserId);
  const otherUserSkills = getOtherUserSkillsFromMatch(match, currentUserId);
  
  return userSkills.filter(skill => 
    otherUserSkills.some(otherSkill => 
      skill.toLowerCase() === otherSkill.toLowerCase()
    )
  );
};

/**
 * Standardizes match data structure for consistent use across the app
 */
export const standardizeMatch = (match: Match, currentUserId: string, users: UserProfile[] = []): StandardizedMatch | null => {
  const otherUser = getOtherUserFromMatch(match, currentUserId);
  const otherUserId = getOtherUserIdFromMatch(match, currentUserId);
  
  // If we don't have populated user data, try to find it in the users array
  const finalOtherUser = otherUser || users.find(u => String(u.id) === String(otherUserId));
  
  if (!finalOtherUser) {
    return null;
  }
  
  const userSkills = getUserSkillsFromMatch(match, currentUserId);
  const otherUserSkills = getOtherUserSkillsFromMatch(match, currentUserId);
  const sharedSkills = getSharedSkills(match, currentUserId);
  
  // Find current user data
  const currentUser = users.find(u => String(u.id) === String(currentUserId));
  
  return {
    id: match.id,
    user1: String(currentUserId) === String(getOtherUserIdFromMatch(match, currentUserId)) ? finalOtherUser : (currentUser || finalOtherUser),
    user2: finalOtherUser,
    skills: {
      user1Skills: userSkills,
      user2Skills: otherUserSkills,
      sharedSkills: sharedSkills
    },
    compatibility: {
      score: match.compatibilityScore || 0,
      factors: sharedSkills
    },
    status: match.status || 'pending',
    createdAt: new Date(match.createdAt || Date.now()),
    updatedAt: new Date(match.updatedAt || Date.now())
  };
};

/**
 * Validates if a match has complete data
 */
export const isMatchComplete = (match: Match): boolean => {
  return !!(
    match.id &&
    match.user1Id &&
    match.user2Id &&
    match.compatibilityScore !== undefined
  );
};

/**
 * Sorts matches by compatibility score (descending) and creation date (recent first)
 */
export const sortMatches = (matches: Match[]): Match[] => {
  return [...matches].sort((a, b) => {
    // First sort by compatibility score (higher first)
    const scoreDiff = (b.compatibilityScore || 0) - (a.compatibilityScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    
    // Then by creation date (newer first)
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });
};
