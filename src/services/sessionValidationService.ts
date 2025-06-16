// Session Validation Service - Centralized validation for session creation
interface SessionData {
  teacherId: string;
  studentId: string;
  skillId: string;
  scheduledAt: Date;
  location: string;
  notes?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
  warnings?: { [key: string]: string };
}

export class SessionValidationService {
  /**
   * Validate session data before submission
   */
  static validateSessionData(sessionData: SessionData): ValidationResult {
    const errors: { [key: string]: string } = {};
    const warnings: { [key: string]: string } = {};

    // Date validation - must be in the future and during reasonable hours
    const now = new Date();
    const sessionDate = new Date(sessionData.scheduledAt);
    
    if (isNaN(sessionDate.getTime())) {
      errors.date = 'Invalid date format';
    } else if (sessionDate <= now) {
      errors.date = 'Session must be scheduled for a future date and time';
    } else if (sessionDate < new Date(now.getTime() + 30 * 60 * 1000)) {
      warnings.date = 'Sessions scheduled within 30 minutes may be difficult to prepare for';
    }

    // Check if session is during reasonable hours (6 AM - 11 PM)
    if (!isNaN(sessionDate.getTime())) {
      const hour = sessionDate.getHours();
      if (hour < 6 || hour > 23) {
        warnings.time = 'Sessions outside of 6 AM - 11 PM may be inconvenient for participants';
      }
    }

    // Check if session is on a weekend
    if (!isNaN(sessionDate.getTime())) {
      const dayOfWeek = sessionDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        warnings.weekend = 'Weekend sessions may have different availability';
      }
    }

    // Location validation
    if (!sessionData.location?.trim()) {
      errors.location = 'Location is required';
    } else if (sessionData.location.trim().length < 3) {
      errors.location = 'Please provide a more detailed location';
    } else if (sessionData.location.trim().length > 200) {
      errors.location = 'Location description is too long (max 200 characters)';
    }

    // Participants validation
    if (!sessionData.teacherId || !sessionData.studentId) {
      errors.participants = 'Invalid session participants';
    } else if (sessionData.teacherId === sessionData.studentId) {
      errors.participants = 'Teacher and student cannot be the same person';
    }

    // Skill validation
    if (!sessionData.skillId) {
      errors.skill = 'Skill is required';
    }

    // Notes validation (optional but length check)
    if (sessionData.notes && sessionData.notes.length > 500) {
      errors.notes = 'Notes are too long (max 500 characters)';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings: Object.keys(warnings).length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate session time conflicts (would require fetching existing sessions)
   */
  static async validateTimeConflicts(
    sessionData: SessionData,
    existingSessions: any[]
  ): Promise<ValidationResult> {
    const errors: { [key: string]: string } = {};
    const warnings: { [key: string]: string } = {};

    const sessionDate = new Date(sessionData.scheduledAt);
    const sessionStart = sessionDate.getTime();
    const sessionEnd = sessionStart + (2 * 60 * 60 * 1000); // Assume 2-hour sessions

    // Check for conflicts with existing sessions
    const conflicts = existingSessions.filter(session => {
      if (session.status === 'cancelled') return false;
      
      const existingStart = new Date(session.scheduledAt).getTime();
      const existingEnd = existingStart + (2 * 60 * 60 * 1000);
      
      // Check if sessions overlap
      return (sessionStart < existingEnd && sessionEnd > existingStart);
    });

    if (conflicts.length > 0) {
      errors.timeConflict = `You have ${conflicts.length} conflicting session(s) at this time`;
    }

    // Check if user has too many sessions in one day
    const sameDay = existingSessions.filter(session => {
      if (session.status === 'cancelled') return false;
      
      const existingDate = new Date(session.scheduledAt);
      return (
        existingDate.getDate() === sessionDate.getDate() &&
        existingDate.getMonth() === sessionDate.getMonth() &&
        existingDate.getFullYear() === sessionDate.getFullYear()
      );
    });

    if (sameDay.length >= 3) {
      warnings.dailyLimit = 'You already have many sessions scheduled for this day';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings: Object.keys(warnings).length > 0 ? warnings : undefined
    };
  }

  /**
   * Get suggested alternative times if validation fails
   */
  static getSuggestedTimes(
    originalDate: Date,
    existingSessions: any[] = []
  ): Date[] {
    const suggestions: Date[] = [];
    const baseDate = new Date(originalDate);

    // Suggest times for the next 7 days
    for (let day = 0; day < 7; day++) {
      const suggestedDate = new Date(baseDate);
      suggestedDate.setDate(baseDate.getDate() + day);

      // Suggest times at 9 AM, 2 PM, and 7 PM
      [9, 14, 19].forEach(hour => {
        const timeSlot = new Date(suggestedDate);
        timeSlot.setHours(hour, 0, 0, 0);

        // Only suggest future times
        if (timeSlot > new Date()) {
          // Check if this time conflicts with existing sessions
          const hasConflict = existingSessions.some(session => {
            if (session.status === 'cancelled') return false;
            
            const existingTime = new Date(session.scheduledAt);
            const timeDiff = Math.abs(timeSlot.getTime() - existingTime.getTime());
            
            // Consider it a conflict if within 2 hours
            return timeDiff < (2 * 60 * 60 * 1000);
          });

          if (!hasConflict) {
            suggestions.push(timeSlot);
          }
        }
      });
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Format validation errors for display
   */
  static formatErrorMessage(validationResult: ValidationResult): string {
    if (validationResult.isValid) return '';

    const errorMessages = Object.values(validationResult.errors);
    
    if (errorMessages.length === 1) {
      return errorMessages[0];
    }
    
    return `Please fix the following issues:\n• ${errorMessages.join('\n• ')}`;
  }

  /**
   * Format warnings for display
   */
  static formatWarningMessage(validationResult: ValidationResult): string {
    if (!validationResult.warnings) return '';

    const warningMessages = Object.values(validationResult.warnings);
    
    if (warningMessages.length === 1) {
      return warningMessages[0];
    }
    
    return `Please note:\n• ${warningMessages.join('\n• ')}`;
  }
}
