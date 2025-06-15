import React, { useEffect, useState } from 'react';
import { Animated, FlatList, FlatListProps, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

interface VirtualizedListProps<T> extends Omit<FlatListProps<T>, 'getItemLayout'> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
  estimatedItemSize: number;
  windowSize?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  removeClippedSubviews?: boolean;
  style?: ViewStyle;
}

export function VirtualizedList<T>({
  data,
  renderItem,
  estimatedItemSize,
  windowSize = 10,
  maxToRenderPerBatch = 5,
  updateCellsBatchingPeriod = 50,
  removeClippedSubviews = true,
  style,
  ...props
}: VirtualizedListProps<T>) {
  const theme = useTheme();
  const [viewableItems, setViewableItems] = useState<string[]>([]);

  const getItemLayout = (data: ArrayLike<T> | null | undefined, index: number) => ({
    length: estimatedItemSize,
    offset: estimatedItemSize * index,
    index,
  });

  const onViewableItemsChanged = ({ viewableItems: items }: any) => {
    setViewableItems(items.map((item: any) => item.key || item.index.toString()));
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300,
  };

  const optimizedRenderItem = ({ item, index }: { item: T; index: number }) => {
    return (
      <OptimizedListItem
        key={`item-${index}`}
        isVisible={viewableItems.includes(index.toString())}
      >
        {renderItem({ item, index })}
      </OptimizedListItem>
    );
  };

  // Generate a key extractor to ensure unique keys
  const keyExtractor = (item: T, index: number) => {
    // Try to use item.id, item._id, or fallback to index
    if (item && typeof item === 'object') {
      const obj = item as any;
      return obj.id || obj._id || `item-${index}`;
    }
    return `item-${index}`;
  };

  return (
    <FlatList
      data={data}
      renderItem={optimizedRenderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      windowSize={windowSize}
      maxToRenderPerBatch={maxToRenderPerBatch}
      updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      removeClippedSubviews={removeClippedSubviews}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      style={[{ backgroundColor: theme.colors.background }, style]}
      {...props}
    />
  );
}

interface OptimizedListItemProps {
  children: React.ReactNode;
  isVisible: boolean;
}

const OptimizedListItem: React.FC<OptimizedListItemProps> = React.memo(
  ({ children, isVisible }) => {
    const opacity = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(opacity, {
        toValue: isVisible ? 1 : 0.7,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }, [isVisible, opacity]);

    return (
      <Animated.View style={{ opacity }}>
        {children}
      </Animated.View>
    );
  }
);

// Infinite scroll hook
export function useInfiniteScroll<T>(
  fetchMoreData: () => Promise<T[]>,
  hasNextPage: boolean,
  threshold = 0.8
) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const onEndReached = async () => {
    if (hasNextPage && !isLoadingMore) {
      setIsLoadingMore(true);
      try {
        await fetchMoreData();
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  return {
    onEndReached,
    onEndReachedThreshold: threshold,
    isLoadingMore,
  };
}
