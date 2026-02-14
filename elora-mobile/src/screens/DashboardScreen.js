import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { theme } = useTheme();

  const fetchStats = async () => {
    try {
      // Try multiple endpoints to match web app
      let data;
      try {
        const response = await api.get('/dashboard/stats');
        data = response.data;
      } catch (error) {
        // Fallback to analytics endpoint
        const response = await api.get('/analytics');
        data = response.data;
      }
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Set default stats to prevent crashes
      setStats({
        kpi: { totalStores: 0, recceDoneTotal: 0, installationDoneTotal: 0, newStoresToday: 0 },
        statusBreakdown: [],
        recentStores: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const StatCard = ({ title, value, trend, color = theme.colors.primary, icon }) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface, width: cardWidth }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <Text style={[styles.statIconText, { color }]}>{icon}</Text>
        </View>
        <Text style={[styles.statValue, { color: theme.colors.text }]}>
          {value || '0'}
        </Text>
      </View>
      <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
        {title}
      </Text>
      {trend && (
        <Text style={[styles.statTrend, { color: '#10B981' }]}>
          {trend}
        </Text>
      )}
    </View>
  );

  const QuickAction = ({ title, onPress, icon, color = theme.colors.primary }) => (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Text style={[styles.actionIconText, { color }]}>{icon}</Text>
      </View>
      <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: theme.colors.text }]}>
          Welcome back, {user?.name || 'User'}!
        </Text>
        <Text style={[styles.role, { color: theme.colors.textSecondary }]}>
          {user?.roles?.[0]?.name || user?.role?.name || 'User'}
        </Text>
      </View>

      {/* KPI Cards */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Stores"
          value={stats?.kpi?.totalStores || stats?.totalStores}
          trend={stats?.kpi?.newStoresToday ? `+${stats.kpi.newStoresToday} today` : null}
          icon="🏪"
          color="#F59E0B"
        />
        <StatCard
          title="Recce Done"
          value={stats?.kpi?.recceDoneTotal || stats?.totalRecce}
          trend={stats?.kpi?.recceDoneToday ? `+${stats.kpi.recceDoneToday} today` : null}
          icon="📋"
          color="#3B82F6"
        />
        <StatCard
          title="Installations"
          value={stats?.kpi?.installationDoneTotal || stats?.totalInstallations}
          trend={stats?.kpi?.installationDoneToday ? `+${stats.kpi.installationDoneToday} today` : null}
          icon="🔧"
          color="#10B981"
        />
        <StatCard
          title="Enquiries"
          value={stats?.kpi?.totalEnquiries || stats?.totalEnquiries}
          icon="💬"
          color="#8B5CF6"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Quick Actions
        </Text>
        <View style={styles.actionsGrid}>
          <QuickAction
            title="Stores"
            icon="🏪"
            onPress={() => navigation.navigate('Stores')}
            color="#F59E0B"
          />
          <QuickAction
            title="Users"
            icon="👥"
            onPress={() => navigation.navigate('Users')}
            color="#3B82F6"
          />
          <QuickAction
            title="Recce"
            icon="📋"
            onPress={() => navigation.navigate('Recce')}
            color="#10B981"
          />
          <QuickAction
            title="Installation"
            icon="🔧"
            onPress={() => navigation.navigate('Installation')}
            color="#EF4444"
          />
          <QuickAction
            title="Enquiries"
            icon="💬"
            onPress={() => navigation.navigate('Enquiries')}
            color="#8B5CF6"
          />
          <QuickAction
            title="Reports"
            icon="📊"
            onPress={() => navigation.navigate('Reports')}
            color="#F97316"
          />
        </View>
      </View>

      {/* Status Breakdown */}
      {stats?.statusBreakdown && stats.statusBreakdown.length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            📊 Status Breakdown
          </Text>
          {stats.statusBreakdown.slice(0, 5).map((item, index) => (
            <View key={index} style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>
                {item._id?.replace(/_/g, ' ') || 'Unknown'}
              </Text>
              <Text style={[styles.statusValue, { color: theme.colors.text }]}>
                {item.count}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Stores */}
      {stats?.recentStores && stats.recentStores.length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            🏪 Recent Stores
          </Text>
          {stats.recentStores.slice(0, 5).map((store, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.recentStoreItem}
              onPress={() => navigation.navigate('Stores')}
              activeOpacity={0.7}
            >
              <View style={styles.storeInfo}>
                <Text style={[styles.storeName, { color: theme.colors.text }]}>
                  {store.storeName || store.name}
                </Text>
                <Text style={[styles.storeLocation, { color: theme.colors.textSecondary }]}>
                  {store.location?.city || store.city} • {store.dealerCode || store.code}
                </Text>
              </View>
              <Text style={[styles.storeStatus, { color: theme.colors.textSecondary }]}>
                {store.currentStatus?.replace(/_/g, ' ') || store.status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
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
  scrollContent: {
    paddingBottom: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    padding: 16,
    borderRadius: 12,
    minHeight: 100,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statIconText: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  statTrend: {
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    width: (width - 56) / 3,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 80,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIconText: {
    fontSize: 16,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  chartCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    textTransform: 'capitalize',
    flex: 1,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentStoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
  },
  storeLocation: {
    fontSize: 12,
    marginTop: 2,
  },
  storeStatus: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});