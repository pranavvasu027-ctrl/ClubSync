import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Club, CLUBS } from '../data/mockData';

type SortOption = 'members' | 'hiring' | 'tier' | 'alphabetical' | 'year';

export default function ClubsScreen() {
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('tier');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [appliedRoles, setAppliedRoles] = useState<{ [key: string]: boolean }>({});
  const [showSortModal, setShowSortModal] = useState(false);

  const domainOptions = [
    { label: 'All', count: CLUBS.length },
    { label: 'Technical', count: CLUBS.filter(c => c.vertical === 'Technical').length },
    { label: 'Cultural', count: CLUBS.filter(c => c.vertical === 'Cultural').length },
    { label: 'Sports', count: CLUBS.filter(c => c.vertical === 'Sports').length },
    { label: 'Entrepreneurship', count: CLUBS.filter(c => c.vertical === 'Entrepreneurship').length },
    { label: 'Literary', count: CLUBS.filter(c => c.vertical === 'Literary').length },
    { label: 'Social', count: CLUBS.filter(c => c.vertical === 'Social').length },
    { label: 'Others', count: CLUBS.filter(c => c.vertical === 'Others').length },
  ];

  const sortLabels: { [key in SortOption]: string } = {
    tier: '★ Tier 1 (Flagships First)',
    members: '👥 Most Members (High to Low)',
    hiring: '🔥 Hiring Open First',
    alphabetical: '🔤 Alphabetical (A to Z)',
    year: '🏛️ Established (Heritage)',
  };

  // 1. Filter by Domain & Search
  let filteredClubs = CLUBS.filter((club) => {
    if (selectedDomain !== 'All' && club.vertical !== selectedDomain) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        club.name.toLowerCase().includes(q) ||
        club.shortName.toLowerCase().includes(q) ||
        club.facultyMentor.toLowerCase().includes(q) ||
        club.description.toLowerCase().includes(q) ||
        club.clubNo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // 2. Sort according to selected sort option
  filteredClubs.sort((a, b) => {
    if (sortBy === 'members') {
      return b.membersCount - a.membersCount;
    }
    if (sortBy === 'hiring') {
      if (a.openRecruitment === b.openRecruitment) return 0;
      return a.openRecruitment ? -1 : 1;
    }
    if (sortBy === 'tier') {
      const tierRank = { 'Tier 1 (Flagship)': 1, 'Tier 2 (Departmental)': 2, 'Special Interest': 3 };
      return tierRank[a.tier] - tierRank[b.tier];
    }
    if (sortBy === 'alphabetical') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'year') {
      return a.establishedYear - b.establishedYear;
    }
    return 0;
  });

  const handleApply = (role: string) => {
    setAppliedRoles(prev => ({ ...prev, [role]: true }));
  };

  const openWebsite = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>College Clubs & Chapters</Text>
        <Text style={styles.headerSub}>All {CLUBS.length} Approved Tier 1 & Tier 2 student organizations</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#B5D4F4" />
          <TextInput 
            placeholder="Search clubs, mentors, racing teams, code..." 
            placeholderTextColor="#B5D4F4"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#B5D4F4" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Domain / Category Filter Chips */}
      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {domainOptions.map((opt) => (
            <TouchableOpacity 
              key={opt.label}
              style={[styles.chip, selectedDomain === opt.label && styles.chipActive]}
              onPress={() => setSelectedDomain(opt.label)}
            >
              <Text style={[styles.chipText, selectedDomain === opt.label && styles.chipTextActive]}>
                {opt.label} ({opt.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sort Bar & Result Counter */}
      <View style={styles.sortBar}>
        <Text style={styles.resultCountText}>
          {filteredClubs.length} Clubs in {selectedDomain}
        </Text>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSortModal(true)}>
          <Ionicons name="swap-vertical" size={14} color="#0C447C" />
          <Text style={styles.sortBtnText}>{sortLabels[sortBy]}</Text>
        </TouchableOpacity>
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
                <Text style={[styles.tierBadge, club.tier === 'Tier 1 (Flagship)' ? styles.tier1Badge : styles.tier2Badge]}>
                  {club.tier === 'Tier 1 (Flagship)' ? '★ Tier 1' : 'Tier 2'}
                </Text>
                <Text style={styles.verticalBadge}>{club.vertical}</Text>
                {club.openRecruitment && (
                  <View style={styles.hiringBadge}>
                    <Text style={styles.hiringText}>Hiring Open</Text>
                  </View>
                )}
              </View>

              <Text style={styles.clubName}>{club.name}</Text>
              <Text style={styles.mentorText}>Mentor: {club.facultyMentor}</Text>
              <Text style={styles.clubDesc} numberOfLines={2}>{club.description}</Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="people-outline" size={12} color="#64748b" />
                  <Text style={styles.statItemText}>{club.membersCount} members</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="location-outline" size={12} color="#64748b" />
                  <Text style={styles.statItemText}>{club.campus}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="calendar-outline" size={12} color="#64748b" />
                  <Text style={styles.statItemText}>Est. {club.establishedYear}</Text>
                </View>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* SORT SELECTION MODAL */}
      {showSortModal && (
        <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setShowSortModal(false)}>
          <View style={styles.sortModalOverlay}>
            <View style={styles.sortModalBox}>
              <View style={styles.sortModalTop}>
                <Text style={styles.sortModalHeadline}>Sort Clubs By</Text>
                <TouchableOpacity onPress={() => setShowSortModal(false)}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                <TouchableOpacity 
                  key={key} 
                  style={[styles.sortOptionRow, sortBy === key && styles.sortOptionRowActive]}
                  onPress={() => {
                    setSortBy(key);
                    setShowSortModal(false);
                  }}
                >
                  <Text style={[styles.sortOptionText, sortBy === key && styles.sortOptionTextActive]}>
                    {sortLabels[key]}
                  </Text>
                  {sortBy === key && <Ionicons name="checkmark-circle" size={18} color="#0C447C" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      )}

      {/* DETAILED CLUB MODAL */}
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
                    <Text style={styles.modalVertical}>{selectedClub.tier} · {selectedClub.vertical}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedClub(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionHeading}>About the Organization</Text>
                <Text style={styles.modalDesc}>{selectedClub.description}</Text>

                <View style={styles.infoBox}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Club Code</Text>
                    <Text style={styles.infoValue}>{selectedClub.clubNo}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Faculty Mentor</Text>
                    <Text style={[styles.infoValue, { color: '#0C447C' }]}>{selectedClub.facultyMentor}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Active Team</Text>
                    <Text style={styles.infoValue}>{selectedClub.membersCount} Students</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Campus Location</Text>
                    <Text style={styles.infoValue}>{selectedClub.campus}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Instagram Handle</Text>
                    <Text style={[styles.infoValue, { color: '#0C447C' }]}>{selectedClub.instagram}</Text>
                  </View>

                  {selectedClub.websiteUrl && (
                    <TouchableOpacity style={styles.websiteBtn} onPress={() => openWebsite(selectedClub.websiteUrl)}>
                      <Ionicons name="globe-outline" size={15} color="#0C447C" />
                      <Text style={styles.websiteBtnText}>Visit Official Website</Text>
                      <Ionicons name="open-outline" size={13} color="#0C447C" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Recruitment Section */}
                {selectedClub.openRecruitment && (
                  <View style={styles.recruitCard}>
                    <View style={styles.recruitHeader}>
                      <Ionicons name="briefcase" size={16} color="#0C447C" />
                      <Text style={styles.recruitTitle}>Active Recruitment Drive</Text>
                    </View>
                    <Text style={styles.recruitSub}>Deadline: {selectedClub.recruitmentDeadline} · Min CGPA: 7.0 (SY & TY)</Text>

                    <Text style={[styles.sectionHeading, { marginTop: 10 }]}>Open Core Positions:</Text>
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
  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  resultCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F1FB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0C447C',
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
    width: 46,
    height: 46,
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
    gap: 5,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  tierBadge: {
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tier1Badge: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  tier2Badge: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
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
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 1,
  },
  mentorText: {
    fontSize: 11,
    color: '#0C447C',
    fontWeight: '500',
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
    gap: 10,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
  websiteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E6F1FB',
    padding: 9,
    borderRadius: 8,
    marginTop: 4,
  },
  websiteBtnText: {
    color: '#0C447C',
    fontSize: 12,
    fontWeight: '700',
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
  sortModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sortModalBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    width: '100%',
    maxWidth: 340,
  },
  sortModalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  sortModalHeadline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sortOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  sortOptionRowActive: {
    backgroundColor: '#E6F1FB',
  },
  sortOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  sortOptionTextActive: {
    color: '#0C447C',
    fontWeight: '700',
  },
});
