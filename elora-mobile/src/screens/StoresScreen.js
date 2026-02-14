import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function StoresScreen({ navigation }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { theme } = useTheme();

  const fetchStores = async (pageNum = 1, search = '', reset = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', '20');
      if (search) params.append('search', search);

      const { data } = await api.get(`/stores?${params.toString()}`);
      
      const newStores = data.stores || data || [];
      
      if (reset || pageNum === 1) {
        setStores(newStores);
        if (pageNum === 1 && newStores.length > 0) {
          Toast.show({
            type: 'success',
            text1: 'Stores Loaded',
            text2: `Found ${newStores.length} stores`,
          });
        }
      } else {
        setStores(prev => [...prev, ...newStores]);
        if (newStores.length > 0) {
          Toast.show({
            type: 'info',
            text1: 'More Stores Loaded',
            text2: `${newStores.length} more stores added`,
          });
        }
      }
      
      setHasMore(newStores.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Stores',
        text2: error.response?.data?.message || 'Please try again',
      });
      if (pageNum === 1) setStores([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStores(1, searchQuery, true);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStores(1, searchQuery, true);
    setRefreshing(false);
    Toast.show({
      type: 'success',
      text1: 'Refreshed',
      text2: 'Store list updated',
    });
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchStores(page + 1, searchQuery);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'active': '#10B981',
      'inactive': '#EF4444',
      'pending': '#F59E0B',
      'RECCE_ASSIGNED': '#3B82F6',
      'RECCE_SUBMITTED': '#F59E0B',
      'RECCE_APPROVED': '#10B981',
      'INSTALLATION_ASSIGNED': '#F59E0B',
      'INSTALLATION_SUBMITTED': '#3B82F6',
      'COMPLETED': '#10B981',
    };
    return statusColors[status] || '#6B7280';
  };

  const handleStorePress = (store) => {
    Toast.show({
      type: 'info',
      text1: 'Store Selected',
      text2: store.storeName || store.name,
    });
    // Navigate to store details if route exists
    // navigation.navigate('StoreDetails', { storeId: store._id });
  };

  const StoreCard = ({ store }) => (
    <TouchableOpacity
      style={[styles.storeCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleStorePress(store)}
      activeOpacity={0.7}
    >
      <View style={styles.storeHeader}>
        <View style={styles.storeInfo}>
          <Text style={[styles.storeName, { color: theme.colors.text }]} numberOfLines={1}>
            {store.storeName || store.name}
          </Text>
          <Text style={[styles.dealerCode, { color: theme.colors.textSecondary }]}>
            {store.dealerCode || store.code}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(store.status || store.currentStatus) }
        ]}>
          <Text style={styles.statusText}>
            {(store.status || store.currentStatus || 'active').replace(/_/g, ' ')}
          </Text>
        </View>
      </View>
      
      <View style={styles.locationRow}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text 
          style={[styles.locationText, { color: theme.colors.textSecondary }]}
          numberOfLines={2}
        >
          {store.location?.address || store.location?.city || store.address || store.city || 'Location not specified'}
        </Text>
      </View>
      
      <View style={styles.contactInfo}>
        <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
          👤 {store.contactPerson || store.contact || 'N/A'}
        </Text>
        <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
          📞 {store.phone || store.mobile || 'N/A'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading more stores...
        </Text>
      </View>
    );
  };

  if (loading && stores.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading stores...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.background }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          placeholder="Search stores..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={stores}
        keyExtractor={(item) => item._id || item.id}
        renderItem={({ item }) => <StoreCard store={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏪</Text>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                {searchQuery ? 'No Stores Found' : 'No Stores Available'}
              </Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Stores will appear here when available'
                }
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  storeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  storeInfo: {
    flex: 1,
    marginRight: 12,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dealerCode: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  contactInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactText: {
    fontSize: 12,
    flex: 1,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});