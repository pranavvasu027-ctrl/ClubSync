import React, { useEffect, useState } from 'react';
import styles from './PresidentDashboard.module.css';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  IconCalendarEvent, 
  IconUsers, 
  IconChecklist, 
  IconMapPin, 
  IconCheck, 
  IconFileText, 
  IconAlertTriangle, 
  IconPlus,
  IconArrowRight,
  IconEye
} from '@tabler/icons-react';
import { eventStore } from '../../services/eventStore';
import type { EventRecord } from '../../services/eventStore';

const PresidentDashboard: React.FC = () => {
  const { profile, club } = useAuth();
  const [events, setEvents] = useState<EventRecord[]>([]);

  const loadDashboardData = () => {
    const all = eventStore.getAllEvents();
    setEvents(all);
  };

  useEffect(() => {
    loadDashboardData();
    eventStore.syncWithSupabase().then(() => loadDashboardData());

    const handleUpdate = () => {
      loadDashboardData();
    };

    window.addEventListener('clubsync:event_updated', handleUpdate);
    return () => window.removeEventListener('clubsync:event_updated', handleUpdate);
  }, [club]);

  // Derived real-time event lifecycle metrics
  const activeEvents = events.filter(e => e.status === 'published' || e.status === 'live');
  const reviewQueue = events.filter(e => e.status === 'under_review');
  const readyToPublish = events.filter(e => e.status === 'approved');
  const totalTurnout = events.reduce((sum, e) => sum + (e.registered_count || e.expected_count || 0), 0);

  const formatDate = (d: string) => {
    if (!d) return 'TBD';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDay = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <>
      {/* Hero Header */}
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Good morning, President · {club?.name || 'Computer Society of India'}</div>
          <h1>{profile?.name?.split(' ')[0] || 'President'}'s Desk</h1>
          <p>
            {activeEvents.length} active live events · {reviewQueue.length} awaiting faculty review · {readyToPublish.length} ready to publish
          </p>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.heroDate}>
            <strong>{getDay()}</strong>
            Academic Year 2026–27
          </div>
          <Link to="/president/new-event" className={`${styles.btn} ${styles.btnPrimary}`}>
            <IconPlus size={16} /> New Proposal
          </Link>
        </div>
      </div>

      {/* Real-time Metric Cards (Matching Student UI card design) */}
      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Active Events</span>
            <div className={`${styles.statIconBox} ${styles.blue}`}>
              <IconCalendarEvent size={20} />
            </div>
          </div>
          <div className={styles.statValue}>
            {activeEvents.length < 10 ? `0${activeEvents.length}` : activeEvents.length}
          </div>
          <div className={`${styles.statFoot} ${styles.positive}`}>
            Live on Student Portal
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Faculty Review Queue</span>
            <div className={`${styles.statIconBox} ${styles.amber}`}>
              <IconChecklist size={20} />
            </div>
          </div>
          <div className={styles.statValue}>
            {reviewQueue.length < 10 ? `0${reviewQueue.length}` : reviewQueue.length}
          </div>
          <div className={`${styles.statFoot} ${styles.warning}`}>
            {reviewQueue.length > 0 ? 'Pending mentor sanction' : 'Queue clear'}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Expected Turnout</span>
            <div className={`${styles.statIconBox} ${styles.green}`}>
              <IconUsers size={20} />
            </div>
          </div>
          <div className={styles.statValue}>
            {totalTurnout.toLocaleString('en-IN')}
          </div>
          <div className={`${styles.statFoot} ${styles.positive}`}>
            Combined student footfall
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Ready to Publish</span>
            <div className={`${styles.statIconBox} ${styles.purple}`}>
              <IconFileText size={20} />
            </div>
          </div>
          <div className={styles.statValue}>
            {readyToPublish.length < 10 ? `0${readyToPublish.length}` : readyToPublish.length}
          </div>
          <div className={`${styles.statFoot} ${readyToPublish.length > 0 ? styles.positive : ''}`}>
            {readyToPublish.length > 0 ? 'Sanctioned by faculty' : 'No approved drafts'}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left Column: Upcoming Docket */}
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <div className={styles.panelTitle}>Current Event Docket</div>
              <div className={styles.panelSub}>Active lifecycle proposals & campus events</div>
            </div>
            <Link to="/president/events" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}>
              Open Events Desk <IconArrowRight size={14} />
            </Link>
          </div>
          <div className={styles.panelBody}>
            {events.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>
                No events currently on the docket. Click "+ New Proposal" to draft an event.
              </div>
            ) : (
              events.slice(0, 4).map((ev) => (
                <div key={ev.event_id} className={styles.eventCard}>
                  <div className={styles.eventCardHead}>
                    <div className={styles.eventTitle}>{ev.title}</div>
                    <span className={`${styles.pillBadge} ${styles[ev.status] || styles.draft}`}>
                      {ev.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className={styles.eventMeta}>
                    <span><IconCalendarEvent size={14} /> {formatDate(ev.event_date)}</span>
                    <span><IconMapPin size={14} /> {ev.venue_name || 'Sharad Arena'}</span>
                    <span><IconUsers size={14} /> {ev.expected_count || 100} expected</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Milestone Feed */}
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <div className={styles.panelTitle}>Governance Feed</div>
              <div className={styles.panelSub}>Recent sanctions, reviews & publishing milestones</div>
            </div>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.activityItem}>
              <div className={`${styles.activityIcon} ${styles.green}`}>
                <IconCheck size={16} />
              </div>
              <div className={styles.activityContent}>
                <div className={styles.activityTitle}>HackVIT 2026 Sanctioned by Faculty</div>
                <div className={styles.activityTime}>Dr. S. K. Kulkarni approved venue reservation</div>
              </div>
            </div>

            <div className={styles.activityItem}>
              <div className={`${styles.activityIcon} ${styles.blue}`}>
                <IconCalendarEvent size={16} />
              </div>
              <div className={styles.activityContent}>
                <div className={styles.activityTitle}>Web3 & DeFi Bootcamp Published</div>
                <div className={styles.activityTime}>Registrations now open on Student Portal</div>
              </div>
            </div>

            <div className={styles.activityItem}>
              <div className={`${styles.activityIcon} ${styles.amber}`}>
                <IconEye size={16} />
              </div>
              <div className={styles.activityContent}>
                <div className={styles.activityTitle}>RoboWars Arena Proposal Under Review</div>
                <div className={styles.activityTime}>Submitted for Department Head safety sanction</div>
              </div>
            </div>

            <div className={styles.activityItem}>
              <div className={`${styles.activityIcon} ${styles.blue}`}>
                <IconFileText size={16} />
              </div>
              <div className={styles.activityContent}>
                <div className={styles.activityTitle}>Pre-Hackathon Workshop Settled</div>
                <div className={styles.activityTime}>Audited financial bills disbursed successfully</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PresidentDashboard;
