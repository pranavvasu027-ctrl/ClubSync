import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Club, CLUBS } from '../data/mockData';

export default function ClubsScreen() {
  const [selectedVertical, setSelectedVertical] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [appliedRoles, setAppliedRoles] = useState<{ [key: string]: boolean }>({});

  const verticals = ['All', 'Technical', 'Entrepreneurship', 'Literary', 'Cultural'];

  const filteredClubs = CLUBS.filter((club) => {
    if (selectedVertical !== 'All' && club.vertical !== selectedVertical) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        club.name.toLowerCase().includes(q) ||
        club.shortName.toLowerCase().includes(q) ||
        club.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApply = (role: string) => {
    setAppliedRoles(prev => ({ ...prev, [role]: true }));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>College Clubs</Text>
        <Text style={styles.headerSub}>Explore 75+ active clubs & recruitment drives</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#B5D4F4" />
          <TextInput 
            placeholder="Search clubs by name, track, or domain..." 
            placeholderTextColor="#B5D4F4"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {verticals.map((v) => (
            <TouchableOpacity 
              key={v}
              style={[styles.chip, selectedVertical === v && styles.chipActive]}
              onPress={() => setSelectedVertical(v)}
            >
              <Text style={[styles.chipText, selectedVertical === v && styles.chipTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Clubs List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredClubs.map((club) => (
          <TouchableOpacity 
            key={club.id} 
            style={styles.clubCard}
            onPress={() => setSelectedClub(club)}
            activeOpacity={0.8}
          >
            <View style={[styles.clubLogo, { backgroundColor: club.logoBg }]}>
              <Text style={styles.clubLogoText}>{club.shortName.substring(0, 2).toUpperCase()}</Text>
            </View>

            <View style={styles.clubInfo}>
              <View style={styles.badgeRow}>
                <Text style={styles.verticalBadge}>{club.vertical}</Text>
                {club.openRecruitment && (
                  <View style={styles.hiringBadge}>
                    <Text style={styles.hiringText}>Hiring Open</Text>
                  </View>
                )}
              </View>
              <Text style={styles.clubName}>{club.name}</Text>
              <Text style={styles.clubDesc} numberOfLines={2}>{club.description}</Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="people-outline" size={12} color="#64748b" />
                  <Text style={styles.statItemText}>{club.membersCount} members</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="school-outline" size={12} color="#64748b" />
                  <Text style={styles.statItemText}>Est. {club.establishedYear}</Text>
                </View>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Detailed Club Modal */}
      {selectedClub && (
        <Modal 
          visible={true} 
          animationType="slide" 
          transparent={true}
          onRequestClose={() => setSelectedClub(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <View style={[styles.modalLogo, { backgroundColor: selectedClub.logoBg }]}>
                    <Text style={styles.modalLogoText}>{selectedClub.shortName.substring(0, 2)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>{selectedClub.name}</Text>
                    <Text style={styles.modalVertical}>{selectedClub.vertical} · {selectedClub.campus} Campus</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedClub(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionHeading}>About the Club</Text>
                <Text style={styles.modalDesc}>{selectedClub.description}</Text>

                <View style={styles.infoBox}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Faculty Mentor</Text>
                    <Text style={styles.infoValue}>{selectedClub.facultyMentor}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Active Team</Text>
                    <Text style={styles.infoValue}>{selectedClub.membersCount} Students</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Instagram Handle</Text>
                    <Text style={[styles.infoValue, { color: '#0C447C' }]}>{selectedClub.instagram}</Text>
                  </View>
                </View>

                {/* Recruitment Section */}
                {selectedClub.openRecruitment && (
                  <View style={styles.recruitCard}>
                    <View style={styles.recruitHeader}>
                      <Ionicons name="briefcase" size={16} color="#0C447C" />
                      <Text style={styles.recruitTitle}>Active Recruitment Drive</Text>
                    </View>
                    <Text style={styles.recruitSub}>Deadline: {selectedClub.recruitmentDeadline} · Min CGPA: 7.0 (SY/TY)</Text>

                    <Text style={[styles.sectionHeading, { marginTop: 10 }]}>Open Positions:</Text>
                    {selectedClub.recruitmentRoles?.map((role) => (
                      <View key={role} style={styles.roleRow}>
                        <Text style={styles.roleName}>{role}</Text>
                        <TouchableOpacity 
                          style={[styles.applyBtn, appliedRoles[role] && styles.applyBtnDone]}
                          onPress={() => handleApply(role)}
                          disabled={appliedRoles[role]}
                        >
                          <Text style={[styles.applyBtnText, appliedRoles[role] && styles.applyBtnTextDone]}>
                            {appliedRoles[role] ? 'Applied ✓' : 'Apply'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSub: {
    color: '#B5D4F4',
    fontSize: 12,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#185FA5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    padding: 0,
  },
  chipsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: '#185FA5',
  },
  chipText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    flex: 1,
    padding: 14,
  },
  clubCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubLogoText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  clubInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  verticalBadge: {
    fontSize: 9,
    fontWeight: '600',
    color: '#185FA5',
    backgroundColor: '#E6F1FB',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  hiringBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  hiringText: {
    color: '#15803D',
    fontSize: 9,
    fontWeight: '700',
  },
  clubName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  clubDesc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statItemText: {
    fontSize: 10,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 14,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalLogo: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLogoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalVertical: {
    fontSize: 12,
    color: '#64748b',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    marginTop: 14,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 14,
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  recruitCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  recruitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  recruitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0C447C',
  },
  recruitSub: {
    fontSize: 11,
    color: '#1D4ED8',
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  roleName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  applyBtn: {
    backgroundColor: '#0C447C',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  applyBtnDone: {
    backgroundColor: '#16a34a',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  applyBtnTextDone: {
    color: '#fff',
  },
});
