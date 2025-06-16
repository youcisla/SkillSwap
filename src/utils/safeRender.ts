/**
 * Fix Common React Native Text and Key Errors
 * This file contains common fixes for text rendering and key prop issues
 */

// Utility function to safely render text
export const safeRenderText = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'object') {
    if (value.name) {
      return String(value.name);
    }
    if (value.title) {
      return String(value.title);
    }
    // For objects without obvious text properties, return empty string to avoid errors
    return '';
  }
  return String(value);
};

// Utility function to safely get a key for list items
export const safeGetKey = (item: any, index: number, prefix?: string): string => {
  const prefixStr = prefix ? `${prefix}-` : '';
  
  if (item?.id) {
    return `${prefixStr}${item.id}`;
  }
  if (item?._id) {
    return `${prefixStr}${item._id}`;
  }
  if (typeof item === 'string' || typeof item === 'number') {
    return `${prefixStr}${item}`;
  }
  return `${prefixStr}${index}`;
};

// Utility function to safely render skill names
export const safeRenderSkill = (skill: any): string => {
  if (typeof skill === 'string') {
    return skill;
  }
  if (skill?.name) {
    return String(skill.name);
  }
  return 'Unknown Skill';
};

// Utility function to safely render user names
export const safeRenderUserName = (user: any): string => {
  if (typeof user === 'string') {
    return user;
  }
  if (user?.name) {
    return String(user.name);
  }
  if (user?.firstName && user?.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user?.firstName) {
    return String(user.firstName);
  }
  return 'Unknown User';
};

// Utility function to safely handle profile images
export const safeGetProfileImage = (user: any): { uri: string } | undefined => {
  if (user?.profileImage && typeof user.profileImage === 'string') {
    return { uri: user.profileImage };
  }
  return undefined;
};

// Utility function to safely render session status
export const safeRenderStatus = (status: any): string => {
  if (typeof status === 'string') {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
  return 'Unknown';
};

// Utility function to format dates safely
export const safeFormatDate = (date: any): string => {
  try {
    if (!date) return 'No date';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    return dateObj.toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
};

// Utility function to format time safely
export const safeFormatTime = (date: any): string => {
  try {
    if (!date) return 'No time';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid time';
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Invalid time';
  }
};

export default {
  safeRenderText,
  safeGetKey,
  safeRenderSkill,
  safeRenderUserName,
  safeGetProfileImage,
  safeRenderStatus,
  safeFormatDate,
  safeFormatTime,
};
