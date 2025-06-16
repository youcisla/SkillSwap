import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from './index';

// Common layout styles used across all screens
export const commonStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  safeContainer: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    paddingTop: spacing.md,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    padding: spacing.xl,
  },
  
  // Content styles
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  contentWithoutPadding: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  
  // Card styles
  card: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  cardWithoutPadding: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  cardContent: {
    padding: spacing.xl,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTitle: {
    ...typography.h3,
    color: colors.neutral[900],
    fontWeight: '600',
  },
  
  // Text styles
  title: {
    ...typography.h2,
    color: colors.neutral[900],
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.h4,
    color: colors.neutral[800],
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.neutral[800],
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
  body: {
    ...typography.body1,
    color: colors.neutral[700],
    lineHeight: 24,
  },
  caption: {
    ...typography.caption,
    color: colors.neutral[600],
  },
  
  // Input styles
  input: {
    marginBottom: spacing.xl,
    backgroundColor: '#ffffff',
  },
  inputLabel: {
    ...typography.body2,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  
  // Button styles
  primaryButton: {
    marginVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  secondaryButton: {
    marginVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  buttonGroupItem: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  
  // List styles
  listContainer: {
    paddingVertical: spacing.md,
  },
  listItem: {
    backgroundColor: '#ffffff',
    marginHorizontal: spacing.xl,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  
  // FAB styles
  fab: {
    position: 'absolute',
    margin: spacing.xl,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary.main,
  },
  fabExtended: {
    position: 'absolute',
    margin: spacing.xl,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
  },
  
  // Avatar and image styles
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.neutral[100],
  },
  avatarMedium: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.neutral[100],
  },
  avatarSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[100],
  },
  
  // Layout helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Spacing helpers
  marginTop: { marginTop: spacing.xl },
  marginBottom: { marginBottom: spacing.xl },
  marginVertical: { marginVertical: spacing.xl },
  marginHorizontal: { marginHorizontal: spacing.xl },
  paddingTop: { paddingTop: spacing.xl },
  paddingBottom: { paddingBottom: spacing.xl },
  paddingVertical: { paddingVertical: spacing.xl },
  paddingHorizontal: { paddingHorizontal: spacing.xl },
  
  // Search and filter styles
  searchContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  searchBar: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
  },
  
  // Empty state styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyStateIcon: {
    marginBottom: spacing.xl,
    backgroundColor: colors.neutral[100],
  },
  emptyStateTitle: {
    ...typography.h4,
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyStateText: {
    ...typography.body1,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Stats and metrics styles
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.primary.main,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: colors.neutral[600],
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  
  // Skill and tag styles
  skillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: spacing.md,
  },
  skillChip: {
    marginRight: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.primary.surface,
  },
  
  // Modal and overlay styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    margin: spacing.xl,
    maxWidth: '90%',
    ...shadows.lg,
  },
  
  // Error and success states
  errorContainer: {
    backgroundColor: colors.error.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    marginVertical: spacing.md,
  },
  errorText: {
    ...typography.body2,
    color: colors.error.main,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: colors.success.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    marginVertical: spacing.md,
  },
  successText: {
    ...typography.body2,
    color: colors.success.main,
    textAlign: 'center',
  },
});

// Text style variants for consistency
export const textStyles = StyleSheet.create({
  h1: {
    ...typography.h1,
    color: colors.neutral[900],
  },
  h2: {
    ...typography.h2,
    color: colors.neutral[900],
  },
  h3: {
    ...typography.h3,
    color: colors.neutral[800],
  },
  h4: {
    ...typography.h4,
    color: colors.neutral[800],
  },
  h5: {
    ...typography.h5,
    color: colors.neutral[800],
  },
  h6: {
    ...typography.h6,
    color: colors.neutral[700],
  },
  body1: {
    ...typography.body1,
    color: colors.neutral[700],
  },
  body2: {
    ...typography.body2,
    color: colors.neutral[600],
  },
  caption: {
    ...typography.caption,
    color: colors.neutral[600],
  },
  overline: {
    ...typography.overline,
    color: colors.neutral[600],
  },
});

export default commonStyles;
