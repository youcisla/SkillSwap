import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Chip,
    List,
    Modal,
    Paragraph,
    Portal,
    Surface,
    Text,
    Title
} from 'react-native-paper';

interface ReportedContent {
  id: string;
  type: 'user' | 'skill' | 'message' | 'session';
  reportedBy: {
    id: string;
    name: string;
    email: string;
  };
  reportedItem: any;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  reviewedBy?: {
    id: string;
    name: string;
  };
  reviewedAt?: string;
  actions?: string[];
}

const ContentModerationScreen: React.FC = () => {
  const [reports, setReports] = useState<ReportedContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportedContent | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    loadReports();
  }, [filterStatus, filterSeverity]);

  const loadReports = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration - replace with actual API call
      const mockReports: ReportedContent[] = [
        {
          id: '1',
          type: 'user',
          reportedBy: { id: 'user1', name: 'John Doe', email: 'john@example.com' },
          reportedItem: { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
          reason: 'Inappropriate behavior',
          description: 'User was using offensive language during a session',
          status: 'pending',
          severity: 'medium',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'skill',
          reportedBy: { id: 'user3', name: 'Mike Johnson', email: 'mike@example.com' },
          reportedItem: { id: 'skill1', name: 'Inappropriate Skill', category: 'Other' },
          reason: 'Inappropriate content',
          description: 'Skill contains inappropriate content',
          status: 'reviewed',
          severity: 'high',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          reviewedBy: { id: 'admin1', name: 'Admin User' },
          reviewedAt: new Date().toISOString(),
        },
      ];
      
      let filteredReports = mockReports;
      
      if (filterStatus !== 'all') {
        filteredReports = filteredReports.filter(report => report.status === filterStatus);
      }
      
      if (filterSeverity !== 'all') {
        filteredReports = filteredReports.filter(report => report.severity === filterSeverity);
      }
      
      setReports(filteredReports);
    } catch (error) {
      console.error('Failed to load reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const handleReportAction = async (reportId: string, action: 'approve' | 'dismiss' | 'escalate') => {
    try {
      // Mock action - replace with actual API call
      Alert.alert('Success', `Report ${action}d successfully`);
      setModalVisible(false);
      loadReports();
    } catch (error) {
      Alert.alert('Error', `Failed to ${action} report`);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      case 'critical': return '#9c27b0';
      default: return '#757575';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'reviewed': return '#2196f3';
      case 'resolved': return '#4caf50';
      case 'dismissed': return '#757575';
      default: return '#757575';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with filters */}
      <Surface style={styles.header}>
        <Title>Content Moderation</Title>
        <View style={styles.filters}>
          <View style={styles.filterRow}>
            <Text>Status:</Text>
            <Button
              mode={filterStatus === 'all' ? 'contained' : 'outlined'}
              onPress={() => setFilterStatus('all')}
              compact
            >
              All
            </Button>
            <Button
              mode={filterStatus === 'pending' ? 'contained' : 'outlined'}
              onPress={() => setFilterStatus('pending')}
              compact
            >
              Pending
            </Button>
            <Button
              mode={filterStatus === 'reviewed' ? 'contained' : 'outlined'}
              onPress={() => setFilterStatus('reviewed')}
              compact
            >
              Reviewed
            </Button>
          </View>
          <View style={styles.filterRow}>
            <Text>Severity:</Text>
            <Button
              mode={filterSeverity === 'all' ? 'contained' : 'outlined'}
              onPress={() => setFilterSeverity('all')}
              compact
            >
              All
            </Button>
            <Button
              mode={filterSeverity === 'critical' ? 'contained' : 'outlined'}
              onPress={() => setFilterSeverity('critical')}
              compact
            >
              Critical
            </Button>
            <Button
              mode={filterSeverity === 'high' ? 'contained' : 'outlined'}
              onPress={() => setFilterSeverity('high')}
              compact
            >
              High
            </Button>
          </View>
        </View>
      </Surface>

      {/* Reports List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" />
        ) : (
          <View style={styles.reportsContainer}>
            {reports.map((report) => (
              <Card key={report.id} style={styles.reportCard}>
                <Card.Content>
                  <View style={styles.reportHeader}>
                    <View style={styles.reportInfo}>
                      <Title style={styles.reportTitle}>
                        {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                      </Title>
                      <Paragraph style={styles.reportDate}>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </Paragraph>
                    </View>
                    <View style={styles.reportBadges}>
                      <Chip
                        style={[styles.severityChip, { backgroundColor: getSeverityColor(report.severity) }]}
                        textStyle={{ color: 'white' }}
                        compact
                      >
                        {report.severity.toUpperCase()}
                      </Chip>
                      <Chip
                        style={[styles.statusChip, { backgroundColor: getStatusColor(report.status) }]}
                        textStyle={{ color: 'white' }}
                        compact
                      >
                        {report.status.toUpperCase()}
                      </Chip>
                    </View>
                  </View>

                  <View style={styles.reportBody}>
                    <List.Item
                      title="Reported by"
                      description={`${report.reportedBy.name} (${report.reportedBy.email})`}
                      left={(props) => <List.Icon {...props} icon="account-alert" />}
                    />
                    <List.Item
                      title="Reason"
                      description={report.reason}
                      left={(props) => <List.Icon {...props} icon="alert-circle" />}
                    />
                    <List.Item
                      title="Description"
                      description={report.description}
                      left={(props) => <List.Icon {...props} icon="text" />}
                    />
                  </View>

                  <View style={styles.reportActions}>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setSelectedReport(report);
                        setModalVisible(true);
                      }}
                      icon="eye"
                    >
                      Review
                    </Button>
                    {report.status === 'pending' && (
                      <>
                        <Button
                          mode="contained"
                          onPress={() => handleReportAction(report.id, 'approve')}
                          icon="check"
                          buttonColor="#4caf50"
                        >
                          Resolve
                        </Button>
                        <Button
                          mode="outlined"
                          onPress={() => handleReportAction(report.id, 'dismiss')}
                          icon="close"
                        >
                          Dismiss
                        </Button>
                      </>
                    )}
                  </View>
                </Card.Content>
              </Card>
            ))}

            {reports.length === 0 && !loading && (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <Text style={styles.emptyText}>No reports found</Text>
                </Card.Content>
              </Card>
            )}
          </View>
        )}
      </ScrollView>

      {/* Report Detail Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          {selectedReport && (
            <ScrollView>
              <Title>Report Details</Title>
              
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title>Reported {selectedReport.type}</Title>
                  {selectedReport.type === 'user' && (
                    <List.Item
                      title={selectedReport.reportedItem.name}
                      description={selectedReport.reportedItem.email}
                      left={(props) => <List.Icon {...props} icon="account" />}
                    />
                  )}
                  {selectedReport.type === 'skill' && (
                    <List.Item
                      title={selectedReport.reportedItem.name}
                      description={selectedReport.reportedItem.category}
                      left={(props) => <List.Icon {...props} icon="school" />}
                    />
                  )}
                </Card.Content>
              </Card>

              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title>Report Information</Title>
                  <List.Item
                    title="Reported by"
                    description={`${selectedReport.reportedBy.name} (${selectedReport.reportedBy.email})`}
                    left={(props) => <List.Icon {...props} icon="account-alert" />}
                  />
                  <List.Item
                    title="Reason"
                    description={selectedReport.reason}
                    left={(props) => <List.Icon {...props} icon="alert-circle" />}
                  />
                  <List.Item
                    title="Description"
                    description={selectedReport.description}
                    left={(props) => <List.Icon {...props} icon="text" />}
                  />
                  <List.Item
                    title="Severity"
                    description={selectedReport.severity}
                    left={(props) => <List.Icon {...props} icon="alert" />}
                  />
                  <List.Item
                    title="Status"
                    description={selectedReport.status}
                    left={(props) => <List.Icon {...props} icon="flag" />}
                  />
                </Card.Content>
              </Card>

              {selectedReport.reviewedBy && (
                <Card style={styles.modalCard}>
                  <Card.Content>
                    <Title>Review Information</Title>
                    <List.Item
                      title="Reviewed by"
                      description={selectedReport.reviewedBy.name}
                      left={(props) => <List.Icon {...props} icon="account-check" />}
                    />
                    <List.Item
                      title="Reviewed at"
                      description={new Date(selectedReport.reviewedAt!).toLocaleString()}
                      left={(props) => <List.Icon {...props} icon="clock" />}
                    />
                  </Card.Content>
                </Card>
              )}

              <View style={styles.modalActions}>
                <Button onPress={() => setModalVisible(false)}>Close</Button>
                {selectedReport.status === 'pending' && (
                  <>
                    <Button
                      mode="contained"
                      onPress={() => handleReportAction(selectedReport.id, 'approve')}
                      buttonColor="#4caf50"
                    >
                      Resolve
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => handleReportAction(selectedReport.id, 'dismiss')}
                    >
                      Dismiss
                    </Button>
                  </>
                )}
              </View>
            </ScrollView>
          )}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    elevation: 2,
  },
  filters: {
    marginTop: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 8,
  },
  content: {
    flex: 1,
  },
  reportsContainer: {
    padding: 16,
  },
  reportCard: {
    marginBottom: 16,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reportDate: {
    color: '#666',
    fontSize: 12,
  },
  reportBadges: {
    gap: 8,
  },
  severityChip: {
    alignSelf: 'flex-start',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  reportBody: {
    marginBottom: 16,
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  loader: {
    padding: 20,
  },
  emptyCard: {
    marginTop: 50,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    padding: 20,
    maxHeight: '90%',
  },
  modalCard: {
    marginVertical: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
  },
});

export default ContentModerationScreen;
