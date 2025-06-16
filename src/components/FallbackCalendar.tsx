import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Title } from 'react-native-paper';

// Fallback Calendar Component for when react-native-calendars is not available
interface FallbackCalendarProps {
  current?: string;
  onDayPress?: (day: { dateString: string }) => void;
  markedDates?: any;
  theme?: any;
}

export const FallbackCalendar: React.FC<FallbackCalendarProps> = ({ 
  current, 
  onDayPress, 
  markedDates = {},
  theme 
}) => {
  const currentDate = current ? new Date(current) : new Date();
  const today = new Date();
  
  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (null | {
      day: number;
      dateString: string;
      isToday: boolean;
      isMarked: boolean;
      isSelected: boolean;
    })[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateString === today.toISOString().split('T')[0];
      const isMarked = markedDates[dateString]?.marked || false;
      const isSelected = markedDates[dateString]?.selected || false;
      
      days.push({
        day,
        dateString,
        isToday,
        isMarked,
        isSelected
      });
    }
    
    return days;
  };

  const days = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDayPress = (day: any) => {
    if (day && onDayPress) {
      onDayPress({ dateString: day.dateString });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={[styles.monthTitle, { color: theme?.monthTextColor || '#6200ea' }]}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Title>
      </View>
      
      <View style={styles.weekHeader}>
        {dayNames.map(dayName => (
          <Text key={dayName} style={[styles.dayName, { color: theme?.textSectionTitleColor || '#b6c1cd' }]}>
            {dayName}
          </Text>
        ))}
      </View>
      
      <View style={styles.calendar}>
        {days.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCell,
              day?.isToday && styles.todayCell,
              day?.isSelected && styles.selectedCell,
              { backgroundColor: day?.isSelected ? (theme?.selectedDayBackgroundColor || '#6200ea') : 'transparent' }
            ]}
            onPress={() => handleDayPress(day)}
            disabled={!day}
          >
            {day && (
              <>
                <Text style={[
                  styles.dayText,
                  day.isToday && { color: theme?.todayTextColor || '#6200ea' },
                  day.isSelected && { color: theme?.selectedDayTextColor || '#ffffff' }
                ]}>
                  {day.day}
                </Text>
                {day.isMarked && (
                  <View style={[
                    styles.marker,
                    { backgroundColor: theme?.dotColor || '#6200ea' }
                  ]} />
                )}
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dayName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    width: 40,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  todayCell: {
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedCell: {
    borderRadius: 20,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  marker: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default FallbackCalendar;
