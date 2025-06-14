import { useCallback, useState } from 'react';

export interface MultiSelectionConfig {
  allowSelectAll?: boolean;
  maxSelections?: number;
  minSelections?: number;
}

export interface MultiSelectionResult<T> {
  selectedItems: T[];
  isSelected: (item: T) => boolean;
  toggleSelection: (item: T) => void;
  selectAll: (items: T[]) => void;
  deselectAll: () => void;
  isAllSelected: (items: T[]) => boolean;
  selectMultiple: (items: T[]) => void;
  getSelectedCount: () => number;
  canSelectMore: () => boolean;
  getItemId: (item: T) => string;
}

export const useMultiSelection = <T>(
  getItemId: (item: T) => string,
  config: MultiSelectionConfig = {}
): MultiSelectionResult<T> => {
  const {
    allowSelectAll = true,
    maxSelections = Infinity,
    minSelections = 0
  } = config;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isSelected = useCallback(
    (item: T): boolean => {
      return selectedIds.has(getItemId(item));
    },
    [selectedIds, getItemId]
  );

  const toggleSelection = useCallback(
    (item: T) => {
      const itemId = getItemId(item);
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        
        if (newSet.has(itemId)) {
          // Deselecting - check minimum
          if (newSet.size > minSelections) {
            newSet.delete(itemId);
          }
        } else {
          // Selecting - check maximum
          if (newSet.size < maxSelections) {
            newSet.add(itemId);
          }
        }
        
        return newSet;
      });
    },
    [getItemId, maxSelections, minSelections]
  );

  const selectAll = useCallback(
    (items: T[]) => {
      if (!allowSelectAll) return;
      
      const itemsToSelect = items.slice(0, maxSelections);
      const newSelectedIds = new Set(itemsToSelect.map(getItemId));
      setSelectedIds(newSelectedIds);
    },
    [allowSelectAll, maxSelections, getItemId]
  );

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = useCallback(
    (items: T[]): boolean => {
      if (items.length === 0) return false;
      return items.every(item => selectedIds.has(getItemId(item)));
    },
    [selectedIds, getItemId]
  );

  const selectMultiple = useCallback(
    (items: T[]) => {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        
        items.forEach(item => {
          const itemId = getItemId(item);
          if (newSet.size < maxSelections && !newSet.has(itemId)) {
            newSet.add(itemId);
          }
        });
        
        return newSet;
      });
    },
    [getItemId, maxSelections]
  );

  const getSelectedCount = useCallback(
    (): number => selectedIds.size,
    [selectedIds]
  );

  const canSelectMore = useCallback(
    (): boolean => selectedIds.size < maxSelections,
    [selectedIds, maxSelections]
  );

  const selectedItems = useCallback(
    (allItems: T[]): T[] => {
      return allItems.filter(item => selectedIds.has(getItemId(item)));
    },
    [selectedIds, getItemId]
  );

  return {
    selectedItems: [], // This will be computed externally
    isSelected,
    toggleSelection,
    selectAll,
    deselectAll,
    isAllSelected,
    selectMultiple,
    getSelectedCount,
    canSelectMore,
    getItemId,
  };
};
