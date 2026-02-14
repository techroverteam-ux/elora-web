import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';

export default function EnquiriesScreen() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);
  const { theme } = useTheme();

  const fetchEnquiries = async () => {
    try {
      const { data } = await api.get('/enquiries');
      const sorted = Array.isArray(data) ? data.sort((a, b) => {
        if (a.status === 'NEW' && b.status !== 'NEW') return -1;
        if (a.status !== 'NEW' && b.status === 'NEW') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }) : [];
      setEnquiries(sorted);
    } catch (error) {
      console.error('Failed to fetch enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEnquiries();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'NEW': return '#3B82F6';
      case 'READ': return '#8B5CF6';
      case 'CONTACTED': return '#F59E0B';
      case 'RESOLVED': return '#10B981';
      default: return '#6B7280';
    }
  };

  const openEnquiry = async (enquiry) => {
    setSelectedEnquiry(enquiry);
    setRemark(enquiry.remark || '');
    
    // Auto-update status to read if it's NEW
    if (enquiry.status === 'NEW') {
      try {
        await api.put(`/enquiries/${enquiry._id}`, { 
          status: 'read', 
          remark: enquiry.remark 
        });
        setEnquiries(prev => 
          prev.map(e => e._id === enquiry._id ? { ...e, status: 'read' } : e)
        );
      } catch (error) {
        console.error('Failed to update status');
      }
    }
  };

  const saveRemark = async () => {
    if (!selectedEnquiry) return;
    
    try {
      setSaving(true);
      const updatedStatus = selectedEnquiry.status === 'NEW' ? 'read' : selectedEnquiry.status;
      
      const { data } = await api.put(`/enquiries/${selectedEnquiry._id}`, {
        status: updatedStatus,
        remark: remark.trim()
      });
      
      setEnquiries(prev => 
        prev.map(e => e._id === selectedEnquiry._id ? data.enquiry : e)
      );
      
      Alert.alert('Success', 'Remark saved successfully');
      setSelectedEnquiry(null);
      setRemark('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save remark');
    } finally {
      setSaving(false);
    }
  };

  const EnquiryCard = ({ enquiry }) => (
    <TouchableOpacity
      style={[styles.enquiryCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => openEnquiry(enquiry)}
    >
      <View style={styles.enquiryHeader}>
        <View style={styles.enquiryInfo}>
          <Text style={[styles.enquiryName, { color: theme.colors.text }]}>
            {enquiry.name}
          </Text>
          <Text style={[styles.enquiryEmail, { color: theme.colors.textSecondary }]}>
            {enquiry.email}
          </Text>
          <Text style={[styles.enquiryPhone, { color: theme.colors.textSecondary }]}>
            {enquiry.phone}
          </Text>
        </View>
        <View style={styles.enquiryMeta}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(enquiry.status) }
          ]}>
            <Text style={styles.statusText}>{enquiry.status}</Text>
          </View>
          <Text style={[styles.enquiryDate, { color: theme.colors.textSecondary }]}>
            {new Date(enquiry.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <Text 
        style={[styles.enquiryMessage, { color: theme.colors.textSecondary }]}
        numberOfLines={2}
      >
        {enquiry.message}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={enquiries}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <EnquiryCard enquiry={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Enquiry Details Modal */}
      <Modal
        visible={!!selectedEnquiry}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedEnquiry(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Enquiry Details
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedEnquiry(null)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: theme.colors.primary }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>

          {selectedEnquiry && (
            <View style={styles.modalContent}>
              <View style={styles.statusRow}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(selectedEnquiry.status) }
                ]}>
                  <Text style={styles.statusText}>{selectedEnquiry.status}</Text>
                </View>
                <Text style={[styles.enquiryDate, { color: theme.colors.textSecondary }]}>
                  {new Date(selectedEnquiry.createdAt).toLocaleString()}
                </Text>
              </View>

              <View style={[styles.userDetails, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  Contact Information
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {selectedEnquiry.name}
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {selectedEnquiry.email}
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {selectedEnquiry.phone}
                </Text>
              </View>

              <View style={styles.messageSection}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  Message
                </Text>
                <Text style={[styles.messageText, { color: theme.colors.text }]}>
                  {selectedEnquiry.message}
                </Text>
              </View>

              <View style={styles.remarkSection}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  Remark (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.remarkInput,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                  value={remark}
                  onChangeText={setRemark}
                  placeholder="Add notes or follow-up actions..."
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                onPress={saveRemark}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Remark'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
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
  enquiryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  enquiryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  enquiryInfo: {
    flex: 1,
  },
  enquiryName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  enquiryEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  enquiryPhone: {
    fontSize: 14,
  },
  enquiryMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  enquiryDate: {
    fontSize: 12,
  },
  enquiryMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userDetails: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    marginBottom: 4,
  },
  messageSection: {
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  remarkSection: {
    marginBottom: 24,
  },
  remarkInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});