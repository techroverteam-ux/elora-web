import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';

export default function RolesScreen() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();

  const fetchRoles = async () => {
    try {
      const { data } = await api.get('/roles');
      setRoles(data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRoles();
    setRefreshing(false);
  };

  const RoleCard = ({ role }) => (
    <View style={[styles.roleCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.roleHeader}>
        <Text style={[styles.roleName, { color: theme.colors.text }]}>
          {role.name}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: role.status === 'active' ? '#10B981' : '#EF4444' }
        ]}>
          <Text style={styles.statusText}>{role.status}</Text>
        </View>
      </View>
      
      <Text style={[styles.roleDescription, { color: theme.colors.textSecondary }]}>
        {role.description || 'No description provided'}
      </Text>
      
      <View style={styles.roleStats}>
        <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
          Code: {role.code}
        </Text>
        <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
          Users: {role.userCount || 0}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={roles}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <RoleCard role={item} />}
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
  listContainer: {
    padding: 16,
  },
  roleCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  roleDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  roleStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 12,
  },
});