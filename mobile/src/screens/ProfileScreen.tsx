import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CURRENT_USER } from '../services/clubSyncService';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>PV</Text>
        </View>
        <Text style={styles.userName}>{CURRENT_USER.name}</Text>
        <Text style={styles.userEmail}>{CURRENT_USER.email}</Text>
        <Text style={styles.userSub}>{CURRENT_USER.branch} · {CURRENT_USER.year}</Text>

        <View style={styles.collegeBadge}>
          <Ionicons name="school" size={13} color="#fff" />
          <Text style={styles.collegeBadgeText}>{CURRENT_USER.collegeName}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Student Passport Card */}
        <View style={styles.passportCard}>
          <View style={styles.passportTop}>
            <Text style={styles.passportTitle}>CLUBSYNC STUDENT PASSPORT</Text>
            <View style={styles.verifiedTag}>
              <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
              <Text style={styles.verifiedText}>VIT VERIFIED</Text>
            </View>
          </View>

          <View style={styles.passportGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>PRN / Roll No</Text>
              <Text style={styles.gridValue}>{CURRENT_USER.prn}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Academic Year</Text>
              <Text style={styles.gridValue}>2026–27</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Cumulative CGPA</Text>
              <Text style={[styles.gridValue, { color: '#16a34a' }]}>{CURRENT_USER.cgpa} / 10.0</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Core Committee</Text>
              <Text style={[styles.gridValue, { color: '#0C447C' }]}>Eligible (≥ 7.0 ✓)</Text>
            </View>
          </View>
        </View>

        {/* Engagement Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>4</Text>
            <Text style={styles.statLabel}>Events Attended</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#D97706' }]}>1</Text>
            <Text style={styles.statLabel}>Trophies Won</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#0C447C' }]}>2</Text>
            <Text style={styles.statLabel}>Club Roles</Text>
          </View>
        </View>

        {/* Action Menu */}
        <Text style={styles.menuHeading}>Student Activity Records</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconBox}>
              <Ionicons name="ribbon-outline" size={18} color="#0C447C" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Digital Certificates & Merits</Text>
              <Text style={styles.menuDesc}>View and download verified event certificates</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconBox}>
              <Ionicons name="document-text-outline" size={18} color="#0C447C" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Annual Activity Transcript</Text>
              <Text style={styles.menuDesc}>Generate PDF for college accreditation / NAAC</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconBox}>
              <MaterialCommunityIcons name="shield-account-outline" size={18} color="#0C447C" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Switch to Club Lead Portal</Text>
              <Text style={styles.menuDesc}>Manage event proposals, budgets & scanner</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0C447C',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 22,
    alignItems: 'center',
  },
  avatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#378ADD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 1,
  },
  userEmail: {
    color: '#B5D4F4',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  userSub: {
    color: '#E0E7FF',
    fontSize: 12,
    marginBottom: 8,
  },
  collegeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  collegeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    padding: 14,
  },
  passportCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  passportTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  passportTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0C447C',
    letterSpacing: 0.8,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  passportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '46%',
  },
  gridLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  menuHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E6F1FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 1,
  },
  menuDesc: {
    fontSize: 11,
    color: '#64748b',
  },
});
