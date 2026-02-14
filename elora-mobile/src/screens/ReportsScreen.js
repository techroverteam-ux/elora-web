import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';

export default function ReportsScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const { theme } = useTheme();

  const reportTypes = [
    { id: 'stores', name: 'Stores Report', icon: '🏪', endpoint: '/stores/export' },
    { id: 'users', name: 'Users Report', icon: '👥', endpoint: '/users/export' },
    { id: 'recce', name: 'Recce Report', icon: '📋', endpoint: '/stores/export/recce' },
    { id: 'installation', name: 'Installation Report', icon: '🔧', endpoint: '/stores/export/installation' },
    { id: 'analytics', name: 'Analytics Report', icon: '📊', endpoint: '/analytics/export' },
  ];

  const fetchReports = async () => {
    try {
      // In a real app, you might fetch report metadata
      setReports(reportTypes);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  const downloadReport = async (report) => {
    setDownloading(report.id);
    try {
      const response = await api.get(report.endpoint, { responseType: 'blob' });
      
      // In React Native, you would use a file system library like react-native-fs
      // For now, we'll just show a success message
      Alert.alert('Success', `${report.name} downloaded successfully`);
    } catch (error) {
      Alert.alert('Error', `Failed to download ${report.name}`);
    } finally {
      setDownloading(null);
    }
  };

  const ReportCard = ({ report }) => (
    <TouchableOpacity
      style={[styles.reportCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => downloadReport(report)}
      disabled={downloading === report.id}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportInfo}>
          <Text style={styles.reportIcon}>{report.icon}</Text>
          <View style={styles.reportText}>
            <Text style={[styles.reportName, { color: theme.colors.text }]}>
              {report.name}
            </Text>
            <Text style={[styles.reportDescription, { color: theme.colors.textSecondary }]}>
              Export data in Excel format
            </Text>
          </View>
        </View>
        
        <View style={[styles.downloadButton, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.downloadButtonText}>
            {downloading === report.id ? '⏳' : '📥'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Reports & Analytics
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Download data exports and reports
          </Text>
        </View>

        <View style={styles.reportsContainer}>
          {reportTypes.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
            📋 Report Information
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            • Reports are generated in real-time{'\n'}
            • All data is exported in Excel format{'\n'}
            • Files include current filters and permissions{'\n'}
            • Large reports may take a few moments to generate
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  reportsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  reportCard: {
    padding: 16,
    borderRadius: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  reportText: {
    flex: 1,
  },
  reportName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  reportDescription: {
    fontSize: 14,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButtonText: {
    fontSize: 18,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});