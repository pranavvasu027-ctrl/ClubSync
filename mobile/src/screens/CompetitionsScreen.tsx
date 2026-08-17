import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CompetitionItem, COMPETITIONS } from '../data/mockData';
import { CURRENT_USER } from '../services/clubSyncService';

type CategoryFilter = 'All' | 'Hackathons' | 'B-Plan & Case Studies' | 'Quizzes & CTFs' | 'Cultural & Sports';

export default function CompetitionsScreen() {
  const [competitionsList, setCompetitionsList] = useState<CompetitionItem[]>(COMPETITIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [teamSizeFilter, setTeamSizeFilter] = useState<'all' | 'solo' | 'team'>('all');
  const [freeOnlyFilter, setFreeOnlyFilter] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<{ [id: string]: boolean }>({});

  // Registration Modal State
  const [selectedComp, setSelectedComp] = useState<CompetitionItem | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teammate1PRN, setTeammate1PRN] = useState('');
  const [teammate2PRN, setTeammate2PRN] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const categories = [
    { label: 'All', count: competitionsList.length, icon: 'trophy-outline' },
    { label: 'Hackathons', count: competitionsList.filter(c => c.category === 'Hackathons').length, icon: 'code-slash-outline' },
    { label: 'B-Plan & Case Studies', count: competitionsList.filter(c => c.category === 'B-Plan & Case Studies').length, icon: 'briefcase-outline' },
    { label: 'Quizzes & CTFs', count: competitionsList.filter(c => c.category === 'Quizzes & CTFs').length, icon: 'help-circle-outline' },
    { label: 'Cultural & Sports', count: competitionsList.filter(c => c.category === 'Cultural & Sports').length, icon: 'musical-notes-outline' },
  ];

  // Filtering
  const filteredCompetitions = competitionsList.filter((comp) => {
    if (selectedCategory !== 'All' && comp.category !== selectedCategory) return false;

    if (teamSizeFilter === 'solo' && comp.maxTeam > 1) return false;
    if (teamSizeFilter === 'team' && comp.maxTeam === 1) return false;
    if (freeOnlyFilter && comp.entryFee > 0) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        comp.title.toLowerCase().includes(q) ||
        comp.organizer.toLowerCase().includes(q) ||
        comp.description.toLowerCase().includes(q) ||
        comp.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenRegister = (comp: CompetitionItem) => {
    setSelectedComp(comp);
    setTeamName(`${CURRENT_USER.name.split(' ')[0]}'s Team`);
    setTeammate1PRN('');
    setTeammate2PRN('');
  };

  const handleConfirmTeamRegistration = () => {
    if (!selectedComp) return;
    setIsRegistering(true);

    setTimeout(() => {
      setIsRegistering(false);
      setCompetitionsList(prev => prev.map(c => c.id === selectedComp.id ? { ...c, isRegistered: true, registeredCount: c.registeredCount + 1 } : c));
      setSelectedComp(null);
      Alert.alert(
        'Team Registration Confirmed! 🏆',
        `Your team "${teamName}" is officially registered for ${selectedComp.title}.\n\nTeam Leader: ${CURRENT_USER.name} (PRN: ${CURRENT_USER.prn})\n\nOfficial confirmation sent to your college email.`
      );
    }, 600);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Competitions & Hackathons</Text>
        <Text style={styles.headerSub}>Inter-Collegiate challenges, B-plans & cash prize arenas</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#B5D4F4" />
          <TextInput 
            placeholder="Search hackathons, AI challenges, b-plans..." 
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

      {/* Unstop-Style Category Carousel */}
      <View style={styles.categoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat.label}
              style={[styles.categoryChip, selectedCategory === cat.label && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat.label as CategoryFilter)}
            >
              <Ionicons 
                name={cat.icon as any} 
                size={14} 
                color={selectedCategory === cat.label ? '#fff' : '#0C447C'} 
              />
              <Text style={[styles.categoryText, selectedCategory === cat.label && styles.categoryTextActive]}>
                {cat.label} ({cat.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sub-Filters Bar */}
      <View style={styles.subFiltersBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subFiltersScroll}>
          <TouchableOpacity 
            style={[styles.subFilterPill, teamSizeFilter === 'all' && styles.subFilterPillActive]}
            onPress={() => setTeamSizeFilter('all')}
          >
            <Text style={[styles.subFilterText, teamSizeFilter === 'all' && styles.subFilterTextActive]}>All Sizes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.subFilterPill, teamSizeFilter === 'solo' && styles.subFilterPillActive]}
            onPress={() => setTeamSizeFilter('solo')}
          >
            <Text style={[styles.subFilterText, teamSizeFilter === 'solo' && styles.subFilterTextActive]}>Solo Only</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.subFilterPill, teamSizeFilter === 'team' && styles.subFilterPillActive]}
            onPress={() => setTeamSizeFilter('team')}
          >
            <Text style={[styles.subFilterText, teamSizeFilter === 'team' && styles.subFilterTextActive]}>Teams (2-5)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.subFilterPill, freeOnlyFilter && styles.subFilterPillActive]}
            onPress={() => setFreeOnlyFilter(!freeOnlyFilter)}
          >
            <Text style={[styles.subFilterText, freeOnlyFilter && styles.subFilterTextActive]}>
              {freeOnlyFilter ? '✓ Free Entry' : 'Free Entry'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Competitions Feed */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.feedCountText}>{filteredCompetitions.length} Opportunities Open</Text>

        {filteredCompetitions.map((comp) => (
          <View key={comp.id} style={styles.compCard}>
            {/* Card Top */}
            <View style={styles.compTopRow}>
              <View style={[styles.compLogo, { backgroundColor: comp.organizerLogoBg }]}>
                <Text style={styles.compLogoText}>{comp.organizer.substring(0, 2).toUpperCase()}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.compTitle}>{comp.title}</Text>
                <Text style={styles.compOrganizer}>{comp.organizer} · {comp.collegeName}</Text>
              </View>

              <TouchableOpacity onPress={() => toggleBookmark(comp.id)} style={styles.heartBtn}>
                <Ionicons 
                  name={bookmarkedIds[comp.id] ? "heart" : "heart-outline"} 
                  size={20} 
                  color={bookmarkedIds[comp.id] ? "#EF4444" : "#94A3B8"} 
                />
              </TouchableOpacity>
            </View>

            {/* Info Badges */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={13} color="#475569" />
                <Text style={styles.metaText}>{comp.teamSize}</Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons name={comp.mode === 'Online' ? "globe-outline" : "location-outline"} size={13} color="#475569" />
                <Text style={styles.metaText}>{comp.mode === 'Online' ? 'Online' : comp.location}</Text>
              </View>
            </View>

            {/* Tag Pills */}
            <View style={styles.tagsRow}>
              {comp.tags.map((t) => (
                <Text key={t} style={styles.tagChip}>{t}</Text>
              ))}
            </View>

            <Text style={styles.compDesc} numberOfLines={2}>{comp.description}</Text>

            {/* Card Footer */}
            <View style={styles.compFooter}>
              <View>
                <View style={styles.prizeBadge}>
                  <Ionicons name="trophy" size={12} color="#D97706" />
                  <Text style={styles.prizeText}>{comp.prizePool}</Text>
                </View>
                <Text style={styles.deadlineText}>⏳ {comp.daysLeft} · {comp.registeredCount} Registered</Text>
              </View>

              <TouchableOpacity 
                style={[styles.registerBtn, comp.isRegistered && styles.registerBtnDone]}
                onPress={() => handleOpenRegister(comp)}
                disabled={comp.isRegistered}
              >
                <Text style={[styles.registerBtnText, comp.isRegistered && styles.registerBtnTextDone]}>
                  {comp.isRegistered ? 'Registered ✓' : (comp.maxTeam > 1 ? 'Team Register' : 'Register Solo')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* TEAM / SOLO REGISTRATION MODAL */}
      {selectedComp && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setSelectedComp(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Competition Registration</Text>
                  <Text style={styles.modalSub}>{selectedComp.title}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedComp(null)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {/* Summary Info */}
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryOrganizer}>Organized by: {selectedComp.organizer}</Text>
                  <Text style={styles.summaryPrize}>🏆 Prize Pool: {selectedComp.prizePool}</Text>
                  <Text style={styles.summaryEligibility}>📋 Eligibility: {selectedComp.eligibility}</Text>
                </View>

                {/* Team Details */}
                {selectedComp.maxTeam > 1 && (
                  <View>
                    <Text style={styles.inputLabel}>Team Name</Text>
                    <TextInput 
                      style={styles.input} 
                      value={teamName} 
                      onChangeText={setTeamName}
                      placeholder="e.g. Pune CodeCrafters"
                    />

                    <Text style={styles.inputLabel}>Team Leader (You)</Text>
                    <View style={styles.leaderCard}>
                      <Text style={styles.leaderName}>{CURRENT_USER.name}</Text>
                      <Text style={styles.leaderMeta}>PRN: {CURRENT_USER.prn} · CGPA: {CURRENT_USER.cgpa} (Verified ✓)</Text>
                    </View>

                    <Text style={styles.inputLabel}>Teammate 2 PRN (Optional)</Text>
                    <TextInput 
                      style={styles.input} 
                      value={teammate1PRN} 
                      onChangeText={setTeammate1PRN}
                      placeholder="e.g. 1251080991 (VIT College PRN)"
                    />

                    <Text style={styles.inputLabel}>Teammate 3 PRN (Optional)</Text>
                    <TextInput 
                      style={styles.input} 
                      value={teammate2PRN} 
                      onChangeText={setTeammate2PRN}
                      placeholder="e.g. 1251090214 (VIT College PRN)"
                    />
                  </View>
                )}

                {selectedComp.maxTeam === 1 && (
                  <View style={styles.leaderCard}>
                    <Text style={styles.leaderName}>{CURRENT_USER.name}</Text>
                    <Text style={styles.leaderMeta}>PRN: {CURRENT_USER.prn} · {CURRENT_USER.collegeName} (Verified ✓)</Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedComp(null)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmBtn, isRegistering && styles.confirmBtnDisabled]}
                  onPress={handleConfirmTeamRegistration}
                  disabled={isRegistering}
                >
                  <Text style={styles.confirmBtnText}>
                    {isRegistering ? "Securing Entry..." : (selectedComp.entryFee === 0 ? "Confirm Free Entry" : `Pay ₹${selectedComp.entryFee} & Enter`)}
                  </Text>
                </TouchableOpacity>
              </View>
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
    fontSize: 11.5,
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
  categoryBar: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E6F1FB',
  },
  categoryChipActive: {
    backgroundColor: '#0C447C',
  },
  categoryText: {
    fontSize: 11.5,
    color: '#0C447C',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
  },
  subFiltersBar: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  subFiltersScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  subFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subFilterPillActive: {
    backgroundColor: '#185FA5',
    borderColor: '#185FA5',
  },
  subFilterText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  subFilterTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
    padding: 14,
  },
  feedCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  compCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  compTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  compLogo: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compLogoText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  compTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  compOrganizer: {
    fontSize: 11,
    color: '#0C447C',
    fontWeight: '600',
    marginTop: 1,
  },
  heartBtn: {
    padding: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#475569',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  tagChip: {
    fontSize: 9.5,
    color: '#1E40AF',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  compDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 10,
  },
  compFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  prizeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  prizeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  deadlineText: {
    fontSize: 10,
    color: '#64748B',
  },
  registerBtn: {
    backgroundColor: '#0C447C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  registerBtnDone: {
    backgroundColor: '#16A34A',
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  registerBtnTextDone: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 11.5,
    color: '#0C447C',
    fontWeight: '600',
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    gap: 4,
  },
  summaryOrganizer: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  summaryPrize: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#D97706',
  },
  summaryEligibility: {
    fontSize: 10.5,
    color: '#64748B',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
    marginBottom: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  leaderCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 4,
  },
  leaderName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E40AF',
  },
  leaderMeta: {
    fontSize: 10.5,
    color: '#3B82F6',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmBtn: {
    backgroundColor: '#0C447C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
