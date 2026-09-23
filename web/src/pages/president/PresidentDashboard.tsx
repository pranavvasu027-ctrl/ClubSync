import React, { useEffect, useState } from 'react';
import styles from './PresidentDashboard.module.css';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { IconCalendarEvent, IconUsers, IconWallet, IconChecklist, IconMapPin, IconCheck, IconFileText, IconAlertTriangle, IconReceipt } from '@tabler/icons-react';
import type { ClubEvent } from '../../types/clubData';

const PresidentDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [budgetRemaining, setBudgetRemaining] = useState(0);
  const totalBudget = 800000; // 8 Lakhs
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Fetch events
      const { data: evData } = await supabase.from('club_events').select('*').order('event_date', { ascending: true }).limit(5);
      if (evData) setEvents(evData);

      // Fetch pending tasks count
      const { count } = await supabase.from('club_tasks').select('*', { count: 'exact' }).neq('status', 'done');
      if (count !== null) setTaskCount(count);

      // Fetch ledger out
      const { data: ledgerOut } = await supabase.from('club_ledger').select('amount').eq('type', 'out');
      const spent = ledgerOut?.reduce((acc, row) => acc + row.amount, 0) || 0;
      setBudgetRemaining(totalBudget - spent);
    };

    fetchDashboardData();
  }, []);

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const getDay = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Good morning, President</div>
          <h1>{profile?.name?.split(' ')[0] || 'President'}'s desk</h1>
          <p>{events.length} events in motion · ₹{(budgetRemaining/100000).toFixed(2)}L balance on hand · {taskCount} tasks open</p>
        </div>
        <div className={styles.heroDate}>
          <strong>{getDay()}</strong>
          Academic Year 2026–27
        </div>
      </div>

      <div className={styles.statRow}>
        <div className={`${styles.statCard} ${styles.cRed}`}>
          <div className={styles.statIcon}><IconCalendarEvent size={20} /></div>
          <div className={styles.statLabel}>Active Events</div>
          <div className={styles.statValue}>{events.length < 10 ? `0${events.length}` : events.length}</div>
          <div className={`${styles.statFoot} ${styles.up}`}>+3 this month</div>
        </div>
        <div className={`${styles.statCard} ${styles.cNavy}`}>
          <div className={styles.statIcon}><IconUsers size={20} /></div>
          <div className={styles.statLabel}>Team Members</div>
          <div className={styles.statValue}>42</div>
          <div className={`${styles.statFoot} ${styles.flat}`}>No change since June</div>
        </div>
        <div className={`${styles.statCard} ${styles.cGreen}`}>
          <div className={styles.statIcon}><IconWallet size={20} /></div>
          <div className={styles.statLabel}>Budget Remaining</div>
          <div className={styles.statValue}>₹{(budgetRemaining/100000).toFixed(2)}L <small>/ ₹{(totalBudget/100000).toFixed(2)}L</small></div>
          <div className={styles.budgetTrack}><div className={styles.budgetFill} style={{ width: `${(budgetRemaining/totalBudget)*100}%` }}></div></div>
        </div>
        <div className={`${styles.statCard} ${styles.cAmber}`}>
          <div className={styles.statIcon}><IconChecklist size={20} /></div>
          <div className={styles.statLabel}>Pending Tasks</div>
          <div className={styles.statValue}>{taskCount}</div>
          <div className={`${styles.statFoot} ${styles.up}`}>−2 this week</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <div className={styles.panelTitle}>This week's docket</div>
              <div className={styles.panelSub}>Events needing your sign-off or attention</div>
            </div>
            <Link to="/president/events" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}>Open events desk</Link>
          </div>
          <div className={styles.panelBody}>
            {events.slice(0,2).map(ev => (
              <div key={ev.id} className={`${styles.eventCard} ${ev.status === 'live' ? styles.stLive : styles.stPending}`}>
                <span className={`${styles.stamp} ${ev.status === 'live' ? styles.stLive : styles.stPending}`}>{ev.status}</span>
                <div className={styles.eventTitle}>{ev.title}</div>
                <div className={styles.eventMeta}>
                  <span><IconCalendarEvent size={14}/> {formatDate(ev.event_date)}</span>
                  <span><IconMapPin size={14}/> {ev.location}</span>
                  <span><IconUsers size={14}/> {ev.expected_users} expected</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div className={styles.panelTitle}>Recent activity</div>
          </div>
          <div className={styles.panelBody} style={{ gap: '13px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className={`${styles.txnCat} ${styles.in}`}><IconCheck size={16}/></div>
              <div className={styles.txnInfo}>
                <div className={styles.txnDesc}>Budget approved — Code Sprint</div>
                <div className={styles.txnTime}>2 hours ago</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className={`${styles.txnCat} ${styles.neutral}`}><IconFileText size={16}/></div>
              <div className={styles.txnInfo}>
                <div className={styles.txnDesc}>Arnav submitted weekly report</div>
                <div className={styles.txnTime}>5 hours ago</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className={`${styles.txnCat} ${styles.out}`}><IconAlertTriangle size={16}/></div>
              <div className={styles.txnInfo}>
                <div className={styles.txnDesc}>New proposal: AI/ML Bootcamp</div>
                <div className={styles.txnTime}>1 day ago</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className={`${styles.txnCat} ${styles.out}`}><IconReceipt size={16}/></div>
              <div className={styles.txnInfo}>
                <div className={styles.txnDesc}>Logistics invoice paid · ₹15,000</div>
                <div className={styles.txnTime}>2 days ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PresidentDashboard;
