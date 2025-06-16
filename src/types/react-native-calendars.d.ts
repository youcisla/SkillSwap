// Type declarations for react-native-calendars
// This file provides basic TypeScript support when @types/react-native-calendars is not available

declare module 'react-native-calendars' {
  import { Component, ReactElement } from 'react';
    import { ViewStyle } from 'react-native';

  export interface DateData {
    dateString: string;
    day: number;
    month: number;
    year: number;
    timestamp: number;
  }

  export interface MarkedDates {
    [date: string]: {
      selected?: boolean;
      marked?: boolean;
      selectedColor?: string;
      selectedTextColor?: string;
      dotColor?: string;
      activeOpacity?: number;
      disabled?: boolean;
      disableTouchEvent?: boolean;
      customStyles?: any;
    };
  }

  export interface CalendarTheme {
    calendarBackground?: string;
    textSectionTitleColor?: string;
    selectedDayBackgroundColor?: string;
    selectedDayTextColor?: string;
    todayTextColor?: string;
    dayTextColor?: string;
    textDisabledColor?: string;
    dotColor?: string;
    selectedDotColor?: string;
    arrowColor?: string;
    monthTextColor?: string;
    indicatorColor?: string;
    textDayFontFamily?: string;
    textMonthFontFamily?: string;
    textDayHeaderFontFamily?: string;
    textDayFontWeight?: string;
    textMonthFontWeight?: string;
    textDayHeaderFontWeight?: string;
    textDayFontSize?: number;
    textMonthFontSize?: number;
    textDayHeaderFontSize?: number;
  }

  export interface CalendarProps {
    current?: string;
    minDate?: string;
    maxDate?: string;
    onDayPress?: (day: DateData) => void;
    onDayLongPress?: (day: DateData) => void;
    onMonthChange?: (month: DateData) => void;
    onVisibleMonthsChange?: (months: DateData[]) => void;
    markedDates?: MarkedDates;
    markingType?: 'simple' | 'period' | 'multi-dot' | 'multi-period' | 'custom';
    theme?: CalendarTheme;
    style?: ViewStyle;
    hideArrows?: boolean;
    hideExtraDays?: boolean;
    disableMonthChange?: boolean;
    firstDay?: number;
    enableSwipeMonths?: boolean;
    disableArrowLeft?: boolean;
    disableArrowRight?: boolean;
    disabledByDefault?: boolean;
    displayLoadingIndicator?: boolean;
    showScrollIndicator?: boolean;
    scrollEnabled?: boolean;
    dayComponent?: React.ComponentType<any>;
    monthFormat?: string;
    pastScrollRange?: number;
    futureScrollRange?: number;
    showWeekNumbers?: boolean;
    horizontal?: boolean;
    pagingEnabled?: boolean;
    scrollIndicatorInsets?: object;
    contentInsetAdjustmentBehavior?: string;
  }

  export class Calendar extends Component<CalendarProps> {}

  export interface AgendaProps {
    items?: { [date: string]: any[] };
    loadItemsForMonth?: (month: DateData) => void;
    onCalendarToggled?: (enabled: boolean) => void;
    onDayPress?: (day: DateData) => void;
    onDayChange?: (day: DateData) => void;
    selected?: string;
    minDate?: string;
    maxDate?: string;
    pastScrollRange?: number;
    futureScrollRange?: number;
    renderItem?: (item: any, firstItemInDay: boolean) => ReactElement;
    renderDay?: (day: DateData, item: any) => ReactElement;
    renderEmptyDate?: () => ReactElement;
    renderEmptyData?: () => ReactElement;
    rowHasChanged?: (r1: any, r2: any) => boolean;
    markingType?: string;
    markedDates?: MarkedDates;
    theme?: CalendarTheme;
    style?: ViewStyle;
    hideKnob?: boolean;
    showClosingKnob?: boolean;
  }

  export class Agenda extends Component<AgendaProps> {}
}
