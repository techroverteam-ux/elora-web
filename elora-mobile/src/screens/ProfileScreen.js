import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { theme, darkMode, toggleTheme } = useTheme();

  const ProfileItem = ({ label, value }) => (
    <View style={[styles.profileItem, { borderBottomColor: theme.colors.border }]}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: theme.colors.text }]}>
        {value || 'Not provided'}
      </Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {user?.name}
        </Text>
        <Text style={[styles.role, { color: theme.colors.textSecondary }]}>
          {user?.roles?.[0]?.name || 'User'}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Personal Information
        </Text>
        <ProfileItem label="Name" value={user?.name} />
        <ProfileItem label="Email" value={user?.email} />
        <ProfileItem label="Phone" value={user?.phone} />
        <ProfileItem label="Status" value={user?.status} />
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Settings
        </Text>
        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
          onPress={toggleTheme}
        >
          <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
            Dark Mode
          </Text>
          <Text style={[styles.settingValue, { color: theme.colors.primary }]}>
            {darkMode ? 'On' : 'Off'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#000',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
  },
  section: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  profileItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});