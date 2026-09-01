import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, createEvent, getPendingApplications, updateApplicationStatus, ApplicationItem, updateClubDetails } from '../services/clubSyncService';
import ScannerScreen from './ScannerScreen';

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768; // Standard tablet/desktop breakpoint
  const user = getCurrentUser();

  // Sidebar Menu Items
  const menuItems = [
    { id: 'overview', title: 'Overview', icon: 'stats-chart' },
    { id: 'events', title: 'Manage Events', icon: 'calendar' },
    { id: 'scanner', title: 'Scan Tickets', icon: 'qr-code' },
    { id: 'members', title: 'Members & Hiring', icon: 'people' },
    { id: 'settings', title: 'Club Settings', icon: 'settings' }
  ];

  const [activeMenu, setActiveMenu] = React.useState('overview');
  const [showScanner, setShowScanner] = useState(false);

  // Form State (Events)
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventPrice, setEventPrice] = useState('');
  const [eventVertical, setEventVertical] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hiring State
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);

  // Settings State
  const [clubDesc, setClubDesc] = useState('We are the premier tech club of the college, focused on open-source and hackathons.');
  const [clubInsta, setClubInsta] = useState('@vit_club');
  const [clubLinkedin, setClubLinkedin] = useState('linkedin.com/company/vit-club');
  const [clubTagline, setClubTagline] = useState('Innovate, Build, Scale');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (activeMenu === 'members') {
      loadApplications();
    }
  }, [activeMenu]);

  const loadApplications = async () => {
    setIsLoadingApps(true);
    try {
      const apps = await getPendingApplications();
      setApplications(apps);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoadingApps(false);
    }
  };

  const handleApprove = async (id: string) => {
    await updateApplicationStatus(id, 'ACCEPTED');
    loadApplications();
  };

  const handleReject = async (id: string) => {
    await updateApplicationStatus(id, 'REJECTED');
    loadApplications();
  };

  const handleUpdateSettings = async () => {
    setIsSavingSettings(true);
    // Hardcoding a demo club ID since this is an admin view
    const result = await updateClubDetails('VIT_GEDIT', {
      description: clubDesc,
      tagline: clubTagline,
      instagram: clubInsta,
      linkedin: clubLinkedin
    });
    setIsSavingSettings(false);

    if (result.success) {
      Alert.alert('Settings Saved', 'Your club profile has been successfully updated.');
    } else {
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  const handleCreateEvent = async () => {
    if (!eventTitle || !eventDate || !eventTime || !eventVenue) {
      Alert.alert('Missing Fields', 'Please fill in all required fields (Title, Date, Time, Venue).');
      return;
    }

    setIsSubmitting(true);
    const newEvent = {
      title: eventTitle,
      date: eventDate,
      time: eventTime,
      venue: eventVenue,
      description: eventDescription || 'Join us for this amazing event!',
      ticketPrice: parseInt(eventPrice) || 0,
      clubName: user?.collegeName ? `Club at ${user.collegeName}` : 'ClubSync Org',
      collegeName: user?.collegeName || 'VIT Pune',
      vertical: eventVertical || 'General',
      scope: 'intra',
      isHackathon: false,
      status: 'UPCOMING' as const,
      registeredCount: 0,
      bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop', // Default placeholder banner
    };

    const result = await createEvent(newEvent);
    setIsSubmitting(false);

    if (result.success) {
      Alert.alert('Event Published!', 'Your event is now live and students can RSVP.');
      // Reset form
      setEventTitle(''); setEventDate(''); setEventTime(''); setEventVenue(''); 
      setEventDescription(''); setEventPrice(''); setEventVertical('');
      setActiveMenu('overview');
    } else {
      Alert.alert('Error', 'Failed to create event. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Committee Dashboard</Text>
          <Text style={styles.headerSub}>Welcome back, {user?.name || 'Admin'}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{user?.collegeName || 'VIT Pune'}</Text>
        </View>
      </View>

      <View style={[styles.contentWrapper, isDesktop ? styles.row : styles.column]}>
        {/* SIDEBAR (Only visible on Desktop, or as top horizontal scroll on mobile) */}
        {isDesktop ? (
          <View style={styles.sidebar}>
            {menuItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.sidebarItem, activeMenu === item.id && styles.sidebarItemActive]}
                onPress={() => setActiveMenu(item.id)}
              >
                <Ionicons 
                  name={item.icon as any} 
                  size={20} 
                  color={activeMenu === item.id ? '#fff' : '#475569'} 
                />
                <Text style={[styles.sidebarText, activeMenu === item.id && styles.sidebarTextActive]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mobileTabs}>
            {menuItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.mobileTab, activeMenu === item.id && styles.mobileTabActive]}
                onPress={() => setActiveMenu(item.id)}
              >
                <Text style={[styles.mobileTabText, activeMenu === item.id && styles.mobileTabTextActive]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* MAIN CONTENT AREA */}
        <ScrollView style={styles.mainContent} contentContainerStyle={{ padding: 20 }}>
          {activeMenu === 'overview' && (
            <>
              <View style={styles.welcomeCard}>
                <Text style={styles.welcomeTitle}>Dashboard Overview</Text>
                <Text style={styles.welcomeText}>
                  This is the new responsive workspace. It automatically adapts to {isDesktop ? 'desktop' : 'mobile'} screens.
                </Text>
              </View>

              <View style={[styles.statsGrid, isDesktop ? styles.statsGridDesktop : styles.statsGridMobile]}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>12</Text>
                  <Text style={styles.statLabel}>Active Events</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>48</Text>
                  <Text style={styles.statLabel}>Pending Requests</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>350+</Text>
                  <Text style={styles.statLabel}>Total Members</Text>
                </View>
              </View>
            </>
          )}

          {activeMenu === 'events' && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Create New Event</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Event Title *</Text>
                <TextInput style={styles.input} placeholder="e.g., CodeRush 2026" value={eventTitle} onChangeText={setEventTitle} />
              </View>

              <View style={[styles.inputRow, isDesktop ? { flexDirection: 'row', gap: 16 } : { flexDirection: 'column' }]}>
                <View style={[styles.inputGroup, isDesktop && { flex: 1 }]}>
                  <Text style={styles.label}>Date *</Text>
                  <TextInput style={styles.input} placeholder="e.g., Oct 25, 2026" value={eventDate} onChangeText={setEventDate} />
                </View>
                <View style={[styles.inputGroup, isDesktop && { flex: 1 }]}>
                  <Text style={styles.label}>Time *</Text>
                  <TextInput style={styles.input} placeholder="e.g., 10:00 AM" value={eventTime} onChangeText={setEventTime} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Venue / Location *</Text>
                <TextInput style={styles.input} placeholder="e.g., Main Auditorium, VIT Pune" value={eventVenue} onChangeText={setEventVenue} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  placeholder="Describe your event..." 
                  multiline={true} 
                  numberOfLines={4}
                  value={eventDescription}
                  onChangeText={setEventDescription}
                />
              </View>

              <View style={[styles.inputRow, isDesktop ? { flexDirection: 'row', gap: 16 } : { flexDirection: 'column' }]}>
                <View style={[styles.inputGroup, isDesktop && { flex: 1 }]}>
                  <Text style={styles.label}>Ticket Price (₹)</Text>
                  <TextInput style={styles.input} placeholder="0 for Free" keyboardType="numeric" value={eventPrice} onChangeText={setEventPrice} />
                </View>
                <View style={[styles.inputGroup, isDesktop && { flex: 1 }]}>
                  <Text style={styles.label}>Event Vertical</Text>
                  <TextInput style={styles.input} placeholder="e.g., tech, cult, sports" value={eventVertical} onChangeText={setEventVertical} />
                </View>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateEvent} disabled={isSubmitting}>
                <Text style={styles.submitBtnText}>{isSubmitting ? 'Publishing...' : 'Publish Event'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeMenu === 'scanner' && (
            <View style={styles.placeholderCard}>
              <Ionicons name="qr-code-outline" size={48} color="#0C447C" />
              <Text style={styles.placeholderTitle}>Ticket Scanner</Text>
              <Text style={styles.placeholderText}>Use your device camera to scan student QR codes at the door. Check-ins are synced to the database instantly.</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowScanner(true)}>
                <Text style={styles.actionBtnText}>Launch Camera Scanner</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeMenu === 'members' && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Review Applications</Text>
              
              {isLoadingApps ? (
                <ActivityIndicator size="large" color="#0C447C" style={{ margin: 40 }} />
              ) : applications.length === 0 ? (
                <View style={styles.placeholderCard}>
                  <Ionicons name="checkmark-done-circle" size={48} color="#10B981" />
                  <Text style={styles.placeholderTitle}>All Caught Up!</Text>
                  <Text style={styles.placeholderText}>There are no pending applications for your club right now.</Text>
                </View>
              ) : (
                applications.map((app) => (
                  <View key={app.id} style={styles.appCard}>
                    <View style={styles.appHeader}>
                      <View>
                        <Text style={styles.appName}>{app.applicantName}</Text>
                        <Text style={styles.appPrn}>{app.prn} • {app.appliedRole}</Text>
                      </View>
                      <View style={[styles.statusBadge, app.status === 'SHORTLISTED' && styles.statusBadgeWarn]}>
                        <Text style={[styles.statusText, app.status === 'SHORTLISTED' && styles.statusTextWarn]}>{app.status}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.appActions}>
                      <TouchableOpacity style={[styles.appBtn, styles.appBtnReject]} onPress={() => handleReject(app.id)}>
                        <Ionicons name="close" size={16} color="#EF4444" />
                        <Text style={styles.appBtnTextReject}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.appBtn, styles.appBtnApprove]} onPress={() => handleApprove(app.id)}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={styles.appBtnTextApprove}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {activeMenu === 'settings' && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Edit Club Profile</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Club Tagline</Text>
                <TextInput 
                  style={styles.input} 
                  value={clubTagline} 
                  onChangeText={setClubTagline} 
                  placeholder="e.g. Innovate, Build, Scale" 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  value={clubDesc} 
                  onChangeText={setClubDesc} 
                  multiline 
                  numberOfLines={4} 
                  placeholder="What does your club do?" 
                />
              </View>

              <View style={[styles.inputRow, isDesktop ? { flexDirection: 'row', gap: 16 } : { flexDirection: 'column' }]}>
                <View style={[styles.inputGroup, isDesktop && { flex: 1 }]}>
                  <Text style={styles.label}>Instagram Handle</Text>
                  <TextInput style={styles.input} value={clubInsta} onChangeText={setClubInsta} />
                </View>
                <View style={[styles.inputGroup, isDesktop && { flex: 1 }]}>
                  <Text style={styles.label}>LinkedIn Page</Text>
                  <TextInput style={styles.input} value={clubLinkedin} onChangeText={setClubLinkedin} />
                </View>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleUpdateSettings} disabled={isSavingSettings}>
                <Text style={styles.submitBtnText}>{isSavingSettings ? 'Saving...' : 'Save Settings'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
      
      {/* FULL-SCREEN CAMERA SCANNER MODAL */}
      {showScanner && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setShowScanner(false)}>
          <ScannerScreen onClose={() => setShowScanner(false)} />
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#E6F1FB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#0C447C',
    fontWeight: '600',
    fontSize: 12,
  },
  contentWrapper: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  sidebar: {
    width: 250,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    padding: 16,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sidebarItemActive: {
    backgroundColor: '#0C447C',
  },
  sidebarText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  sidebarTextActive: {
    color: '#fff',
  },
  mobileTabs: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    flexGrow: 0,
  },
  mobileTab: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  mobileTabActive: {
    borderBottomColor: '#0C447C',
  },
  mobileTabText: {
    color: '#64748B',
    fontWeight: '600',
  },
  mobileTabTextActive: {
    color: '#0C447C',
  },
  mainContent: {
    flex: 1,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  welcomeText: {
    color: '#475569',
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statsGridDesktop: {
    justifyContent: 'flex-start',
  },
  statsGridMobile: {
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
    minWidth: 140,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0C447C',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  placeholderCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 400,
    lineHeight: 22,
  },
  actionBtn: {
    backgroundColor: '#0C447C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    // dynamically set inline
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#0C447C',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  appCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  appPrn: {
    fontSize: 13,
    color: '#64748B',
  },
  statusBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeWarn: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  statusTextWarn: {
    color: '#D97706',
  },
  appActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  appBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  appBtnReject: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  appBtnApprove: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  appBtnTextReject: {
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 6,
  },
  appBtnTextApprove: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  }
});
