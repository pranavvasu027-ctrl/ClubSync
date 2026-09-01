import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './Team.module.css';

const Team: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ userId: '', role: 'Event Head' });

  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedEventId) fetchTeam(selectedEventId);
  }, [selectedEventId]);

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('event_id, title').order('created_at', { ascending: false });
    if (data) {
      setEvents(data);
      if (data.length > 0) setSelectedEventId(data[0].event_id);
    }
  };

  const fetchUsers = async () => {
    // In a real app we might only fetch users within this club
    const { data } = await supabase.from('users').select('user_id, name, email');
    if (data) setUsers(data);
  };

  const fetchTeam = async (eventId: string) => {
    const { data } = await supabase
      .from('event_teams')
      .select(`
        *,
        user:users (name, email)
      `)
      .eq('event_id', eventId);
    if (data) setTeamMembers(data);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !newMember.userId) return;

    const reqItem = {
      event_id: selectedEventId,
      user_id: newMember.userId,
      role: newMember.role
    };

    const { data, error } = await supabase.from('event_teams').insert([reqItem]).select(`*, user:users(name, email)`).single();
    
    if (data && !error) {
      setTeamMembers([...teamMembers, data]);
      setIsModalOpen(false);
      setNewMember({ userId: '', role: 'Event Head' });
    } else if (error) {
      alert("Error adding member (maybe they are already on the team?)");
    }
  };

  const handleRemove = async (teamMemberId: string) => {
    await supabase.from('event_teams').delete().eq('team_member_id', teamMemberId);
    setTeamMembers(teamMembers.filter(m => m.team_member_id !== teamMemberId));
  };

  // Helper for avatar colors based on role
  const getRoleColor = (role: string) => {
    if (role === 'Event Head') return 'var(--exec-amber)';
    if (role === 'Technical Team') return 'var(--exec-sky)';
    if (role === 'Design Team') return 'var(--exec-purple)';
    if (role === 'Volunteer') return 'var(--exec-lime)';
    return 'var(--exec-panel-2)';
  };

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>People</div>
          <h1>Event Team Roster</h1>
          <p>Coordinate with your core team and assign roles for execution.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select 
            value={selectedEventId} 
            onChange={e => setSelectedEventId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--exec-panel-2)', color: '#fff', border: '1px solid var(--exec-line)' }}
          >
            {events.map(ev => <option key={ev.event_id} value={ev.event_id}>{ev.title}</option>)}
          </select>
          <button className={styles.createBtn} onClick={() => setIsModalOpen(true)}>
            + Assign Member
          </button>
        </div>
      </div>

      <div className={styles.teamGrid}>
        {teamMembers.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--exec-text-dim)' }}>
            No members assigned to this event yet.
          </div>
        ) : (
          teamMembers.map(member => {
            const initials = member.user?.name ? member.user.name.substring(0, 2).toUpperCase() : 'UN';
            return (
              <div className={styles.teamCard} key={member.team_member_id}>
                <div className={styles.teamAvatar} style={{ background: getRoleColor(member.role), color: '#000' }}>
                  {initials}
                  <span className={`${styles.teamStatus} ${styles.statusOn}`}></span>
                </div>
                <div className={styles.teamName}>{member.user?.name || 'Unknown User'}</div>
                <div className={styles.teamRole}>{member.role}</div>
                <button onClick={() => handleRemove(member.team_member_id)} className={styles.removeBtn}>Remove</button>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Assign Team Member</h2>
            <form onSubmit={handleAddMember}>
              <div className={styles.formGroup}>
                <label>User</label>
                <select value={newMember.userId} onChange={e => setNewMember({...newMember, userId: e.target.value})} required>
                  <option value="">Select a user...</option>
                  {users.map(u => (
                    <option key={u.user_id} value={u.user_id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Role / Responsibility</label>
                <select value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})}>
                  <option>Event Head</option>
                  <option>Technical Team</option>
                  <option>Design Team</option>
                  <option>Marketing Team</option>
                  <option>Logistics Team</option>
                  <option>Volunteer</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.createBtn}>Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Team;
