import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function InstallationScreen({ navigation }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const { theme } = useTheme();
  const { user } = useAuth();

  const isAdmin = user?.roles?.some(role => 
    role?.code === 'SUPER_ADMIN' || role?.code === 'ADMIN'
  );

  const fetchStores = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      
      if (filterStatus !== 'ALL') {
        params.append('status', filterStatus);
      } else {
        params.append('status', 'INSTALLATION_ASSIGNED,INSTALLATION_SUBMITTED,COMPLETED');
      }

      const { data } = await api.get(`/stores?${params.toString()}`);
      
      const installationStores = data.stores.filter(store => 
        store.currentStatus === 'INSTALLATION_ASSIGNED' ||
        store.currentStatus === 'INSTALLATION_SUBMITTED' ||
        store.currentStatus === 'COMPLETED'
      );
      setStores(installationStores);
    } catch (error) {
      console.error('Failed to fetch installation stores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [searchQuery, filterStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStores();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'INSTALLATION_ASSIGNED': return '#F59E0B';
      case 'INSTALLATION_SUBMITTED': return '#3B82F6';
      case 'COMPLETED': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    return status.replace('INSTALLATION_', '').replace('_', ' ');
  };

  const StoreCard = ({ store }) => {
    const isDone = store.currentStatus === 'COMPLETED' || store.currentStatus === 'INSTALLATION_SUBMITTED';
    
    return (
      <TouchableOpacity
        style={[styles.storeCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => navigation.navigate('InstallationDetails', { storeId: store._id })}
      >
        <View style={[
          styles.statusBar,
          { backgroundColor: getStatusColor(store.currentStatus) }
        ]} />
        
        <View style={styles.cardContent}>
          <View style={styles.storeHeader}>
            <View style={styles.storeInfo}>
              <Text style={[styles.storeName, { color: theme.colors.text }]}>
                {store.storeName}
              </Text>
              <Text style={[styles.dealerCode, { color: theme.colors.textSecondary }]}>
                {store.dealerCode}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(store.currentStatus) }
            ]}>
              <Text style={styles.statusText}>
                {getStatusText(store.currentStatus)}
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text 
              style={[styles.locationText, { color: theme.colors.textSecondary }]}
              numberOfLines={2}
            >
              {store.location.address || store.location.city}
            </Text>
          </View>

          {(isAdmin ? store.workflow?.installationAssignedTo : store.workflow?.installationAssignedBy) && (
            <Text style={[styles.assignedText, { color: theme.colors.textSecondary }]}>
              {isAdmin ? 'Assigned To: ' : 'Assigned By: '}
              <Text style={{ color: theme.colors.text }}>
                {isAdmin 
                  ? store.workflow?.installationAssignedTo?.name 
                  : store.workflow?.installationAssignedBy?.name
                }
              </Text>
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: isDone ? '#10B981' : '#3B82F6' }
            ]}
            onPress={() => navigation.navigate('InstallationDetails', { storeId: store._id })}
          >
            <Text style={styles.actionButtonText}>
              {isDone ? '✓ View Details' : '🔧 Upload Proof'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search and Filter */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          placeholder="Search store name, city..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <View style={styles.filterButtons}>
          {['ALL', 'INSTALLATION_ASSIGNED', 'INSTALLATION_SUBMITTED', 'COMPLETED'].map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                {
                  backgroundColor: filterStatus === status 
                    ? theme.colors.primary 
                    : theme.colors.surface,
                },
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: filterStatus === status 
                      ? '#000' 
                      : theme.colors.text,
                  },
                ]}
              >
                {status === 'ALL' ? 'All' : getStatusText(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={stores}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <StoreCard store={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    padding: 16,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  storeCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  statusBar: {
    height: 4,
  },
  cardContent: {
    padding: 16,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  storeInfo: {
    flex: 1,
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
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  assignedText: {
    fontSize: 12,
    marginBottom: 12,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});