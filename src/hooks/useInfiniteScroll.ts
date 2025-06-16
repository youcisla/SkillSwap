import { useCallback, useRef, useState } from 'react';

interface InfiniteScrollOptions {
  threshold?: number;
  initialPageSize?: number;
  pageSize?: number;
  maxPages?: number;
}

interface InfiniteScrollState<T> {
  data: T[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  page: number;
  totalPages: number;
}

export const useInfiniteScroll = <T>(
  fetchFunction: (page: number, pageSize: number) => Promise<{
    data: T[];
    hasMore: boolean;
    totalPages?: number;
  }>,
  options: InfiniteScrollOptions = {}
) => {
  const {
    threshold = 0.8,
    initialPageSize = 20,
    pageSize = 10,
    maxPages = Infinity,
  } = options;

  const [state, setState] = useState<InfiniteScrollState<T>>({
    data: [],
    loading: false,
    hasMore: true,
    error: null,
    page: 0,
    totalPages: 0,
  });

  const isFetching = useRef(false);
  const hasInitialized = useRef(false);

  const loadInitialData = useCallback(async () => {
    if (hasInitialized.current || isFetching.current) return;
    
    hasInitialized.current = true;
    isFetching.current = true;
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await fetchFunction(1, initialPageSize);
      setState(prev => ({
        ...prev,
        data: result.data,
        loading: false,
        hasMore: result.hasMore && prev.page < maxPages,
        page: 1,
        totalPages: result.totalPages || 0,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }));
    } finally {
      isFetching.current = false;
    }
  }, [fetchFunction, initialPageSize, maxPages]);

  const loadMore = useCallback(async () => {
    if (isFetching.current || !state.hasMore || state.loading) return;
    
    isFetching.current = true;
    const nextPage = state.page + 1;
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await fetchFunction(nextPage, pageSize);
      setState(prev => ({
        ...prev,
        data: [...prev.data, ...result.data],
        loading: false,
        hasMore: result.hasMore && nextPage < maxPages,
        page: nextPage,
        totalPages: result.totalPages || prev.totalPages,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load more data',
      }));
    } finally {
      isFetching.current = false;
    }
  }, [fetchFunction, pageSize, state.hasMore, state.loading, state.page, maxPages]);

  const refresh = useCallback(async () => {
    hasInitialized.current = false;
    isFetching.current = false;
    setState({
      data: [],
      loading: false,
      hasMore: true,
      error: null,
      page: 0,
      totalPages: 0,
    });
    await loadInitialData();
  }, [loadInitialData]);

  const onEndReached = useCallback(
    ({ distanceFromEnd }: { distanceFromEnd: number }) => {
      // Calculate if we should load more based on threshold
      const shouldLoadMore = distanceFromEnd < threshold * 100; // Adjust threshold calculation
      
      if (shouldLoadMore && state.hasMore && !state.loading) {
        loadMore();
      }
    },
    [loadMore, state.hasMore, state.loading, threshold]
  );

  // Alternative scroll handler for custom implementations
  const handleScroll = useCallback(
    (contentHeight: number, scrollOffset: number, layoutHeight: number) => {
      const distanceFromEnd = contentHeight - scrollOffset - layoutHeight;
      const shouldLoadMore = distanceFromEnd < threshold * layoutHeight;
      
      if (shouldLoadMore && state.hasMore && !state.loading) {
        loadMore();
      }
    },
    [loadMore, state.hasMore, state.loading, threshold]
  );

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const addItem = useCallback((item: T, position: 'start' | 'end' = 'end') => {
    setState(prev => ({
      ...prev,
      data: position === 'start' ? [item, ...prev.data] : [...prev.data, item],
    }));
  }, []);

  const removeItem = useCallback((predicate: (item: T) => boolean) => {
    setState(prev => ({
      ...prev,
      data: prev.data.filter(item => !predicate(item)),
    }));
  }, []);

  const updateItem = useCallback((predicate: (item: T) => boolean, updater: (item: T) => T) => {
    setState(prev => ({
      ...prev,
      data: prev.data.map(item => predicate(item) ? updater(item) : item),
    }));
  }, []);

  // Initialize data on first mount
  if (!hasInitialized.current && !isFetching.current) {
    loadInitialData();
  }

  return {
    ...state,
    loadMore,
    refresh,
    onEndReached,
    handleScroll,
    clearError,
    addItem,
    removeItem,
    updateItem,
    isInitialized: hasInitialized.current,
  };
};

export default useInfiniteScroll;
