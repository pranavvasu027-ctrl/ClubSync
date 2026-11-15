import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './StudentPortal.module.css';
import { eventStore } from '../../services/eventStore';
import type { EventRecord } from '../../services/eventStore';
import { 
  IconHome, 
  IconCalendarEvent, 
  IconUsers, 
  IconBriefcase, 
  IconTrophy, 
  IconBell, 
  IconSettings, 
  IconSearch, 
  IconMapPin, 
  IconArrowRight, 
  IconChevronRight, 
  IconStar, 
  IconCheck, 
  IconShare, 
  IconQrcode, 
  IconX, 
  IconFileText,
  IconEye,
  IconPlus
} from '@tabler/icons-react';

interface RegisteredPass {
  registration_id: string;
  event_id: string;
  student_name: string;
  student_email: string;
  qr_token: string;
  registered_at: string;
  check_in_status?: 'REGISTERED' | 'ATTENDED' | 'CANCELLED';
  check_in_timestamp?: string;
  cancelled_at?: string;
  event: {
    title: string;
    club_name: string;
    venue_name: string;
    event_date: string;
    event_time: string;
  };
}

const STATIC_CLUBS = [
  { id: 'vit-csi', name: 'Computer Society of India (CSI)', members: '2.4K', desc: 'A community of students passionate about software engineering, AI/ML, and system architecture.', tags: ['Tech', 'Workshops', 'Hackathons'], cat: 'Technology', mem: true, color: '#0b63f6' },
  { id: 'vit-edc', name: 'Entrepreneurship Development Cell', members: '3.1K', desc: 'Fosters startup culture, funding, and national entrepreneurship conclaves.', tags: ['Business', 'Startups', 'Networking'], cat: 'Business', mem: true, color: '#e11d48' },
  { id: 'vit-gedit', name: 'GedIT Technical Club', members: '1.5K', desc: 'For students who love product design, UI/UX systems, and frontend craftsmanship.', tags: ['Design', 'UI/UX', 'Creative Arts'], cat: 'Arts', mem: false, color: '#12a37a' },
  { id: 'vit-robotics', name: 'Robotics & Automation Society', members: '1.8K', desc: 'Build, automate, and program autonomous robotics systems and IoT platforms.', tags: ['Robotics', 'Embedded', 'Hardware'], cat: 'Technology', mem: false, color: '#7c3aed' },
  { id: 'vit-cultural', name: 'VIT Cultural Society', members: '2.8K', desc: 'Celebrates performing arts, music, dance, and campus festivals.', tags: ['Music', 'Drama', 'Festivals'], cat: 'Cultural', mem: false, color: '#f59e0b' }
];

const STATIC_RECRUITMENTS = [
  { id: 'rec-1', title: 'Technical Committee Core Recruitment', club: 'Computer Society of India (CSI)', desc: 'Join our technical team and build full-stack web applications, AI tools, and infrastructure.', tags: ['React', 'TypeScript', 'Supabase'], openings: 8, deadline: '28 Nov 2026', eligibility: 'Open to 1st, 2nd & 3rd Years' },
  { id: 'rec-2', title: 'Design & Branding Team Hiring', club: 'GedIT Technical Club', desc: 'Craft Figma design systems, motion graphics, and event identity assets for college summits.', tags: ['Figma', 'UI/UX', 'Branding'], openings: 5, deadline: '30 Nov 2026', eligibility: 'Open to all years' },
  { id: 'rec-3', title: 'Corporate Sponsorships & PR Team', club: 'Entrepreneurship Development Cell', desc: 'Liaison with angel investors, national founders, and manage corporate relations.', tags: ['PR', 'Outreach', 'Marketing'], openings: 6, deadline: '05 Dec 2026', eligibility: 'Open to all branches' }
];

export default function StudentPortal() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Active view: 'home' | 'events' | 'event' | 'clubs' | 'recruitments' | 'notifications' | 'settings'
  const [activeTab, setActiveTab] = useState<'home' | 'events' | 'event' | 'clubs' | 'recruitments' | 'notifications' | 'settings'>('home');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Data state
  const [publishedEvents, setPublishedEvents] = useState<EventRecord[]>([]);
  const [savedEventIds, setSavedEventIds] = useState<Record<string, boolean>>({ 'evt-csi-001': true });
  const [appliedRecs, setAppliedRecs] = useState<Record<string, boolean>>({});
  const [myPasses, setMyPasses] = useState<RegisteredPass[]>([]);
  const [activePassModal, setActivePassModal] = useState<RegisteredPass | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [eventsSubTab, setEventsSubTab] = useState<'upcoming' | 'past' | 'saved'>('upcoming');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = () => {
    // Only load published events for students!
    const all = eventStore.getAllEvents();
    const published = all.filter(e => e.status === 'published' || e.status === 'live');
    setPublishedEvents(published);

    const storedPasses = eventStore.getStudentRegistrations();
    setMyPasses(storedPasses);
  };

  useEffect(() => {
    loadData();
    eventStore.syncWithSupabase().then(() => loadData());

    const handleUpdate = () => loadData();
    const handleRegistered = () => loadData();

    window.addEventListener('clubsync:event_updated', handleUpdate);
    window.addEventListener('clubsync:registered', handleRegistered);

    return () => {
      window.removeEventListener('clubsync:event_updated', handleUpdate);
      window.removeEventListener('clubsync:registered', handleRegistered);
    };
  }, []);

  // Check if current student is registered for an event (excluding cancelled passes)
  const isRegisteredForEvent = (eventId: string) => {
    return myPasses.some(p => p.event_id === eventId && p.check_in_status !== 'CANCELLED');
  };

  const getPassForEvent = (eventId: string) => {
    return myPasses.find(p => p.event_id === eventId && p.check_in_status !== 'CANCELLED');
  };

  const handleCancelRegistration = (registrationId: string) => {
    if (!window.confirm('Are you sure you want to cancel your event registration? Your digital pass will be revoked and your seat released for other students.')) {
      return;
    }

    const res = eventStore.cancelRegistration(registrationId);
    if (res.success) {
      showToast(res.message);
      loadData();
      setActivePassModal(null);
    } else {
      showToast(res.message);
    }
  };

  const handleRegister = async (event: EventRecord) => {
    const studentName = profile?.name || user?.user_metadata?.name || 'Rohit Sharma';
    const studentEmail = (profile as any)?.email || user?.email || 'rohit.sharma@vit.edu';
    const userId = profile?.user_id || user?.id;

    const result = await eventStore.registerStudent(event.event_id, studentName, studentEmail, userId, 'Standard Pass');
    if (result.success) {
      if (result.dbSynced) {
        showToast(`🎟️ Registered! Pass generated and saved to Supabase for ${event.title}`);
      } else {
        showToast(`🎟️ Registered! Digital entry pass generated for ${event.title}`);
      }
      loadData();
      const updatedPasses = eventStore.getStudentRegistrations();
      const newPass = updatedPasses.find((p: any) => p.event_id === event.event_id);
      if (newPass) {
        setActivePassModal(newPass);
      }
    } else {
      showToast(`⚠️ ${result.message || 'Registration failed.'}`);
    }
  };

  const toggleSave = (eventId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSavedEventIds(prev => {
      const next = { ...prev, [eventId]: !prev[eventId] };
      showToast(next[eventId] ? 'Event saved to bookmarks' : 'Removed from bookmarks');
      return next;
    });
  };

  const toggleApply = (recId: string) => {
    setAppliedRecs(prev => {
      const next = { ...prev, [recId]: !prev[recId] };
      showToast(next[recId] ? 'Application submitted successfully!' : 'Application withdrawn');
      return next;
    });
  };

  const openEventDetail = (eventId: string) => {
    setSelectedEventId(eventId);
    setActiveTab('event');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeEvent = useMemo(() => {
    if (!selectedEventId) return publishedEvents[0] || null;
    return publishedEvents.find(e => e.event_id === selectedEventId) || publishedEvents[0] || null;
  }, [selectedEventId, publishedEvents]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return publishedEvents.filter(e => {
      const matchesSearch = !searchQuery || 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.club_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === 'All' || e.event_type.toLowerCase() === filterType.toLowerCase();

      if (eventsSubTab === 'saved') {
        return matchesSearch && matchesType && savedEventIds[e.event_id];
      }
      return matchesSearch && matchesType;
    });
  }, [publishedEvents, searchQuery, filterType, eventsSubTab, savedEventIds]);

  const getEventBannerClass = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('hackathon')) return styles.bHack;
    if (t.includes('work') || t.includes('design')) return styles.bWork;
    if (t.includes('cult') || t.includes('fest')) return styles.bCult;
    if (t.includes('lead') || t.includes('summit')) return styles.bLead;
    return styles.bTech;
  };

  return (
    <div className={styles.portalContainer}>
      {/* Toast */}
      {toastMsg && (
        <div className={styles.toast}>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Official QR Digital Entry Pass Modal */}
      {activePassModal && (
        <div className={styles.qrModalOverlay} onClick={() => setActivePassModal(null)}>
          <div className={styles.qrModalCard} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setActivePassModal(null)} 
              style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <IconX size={20} />
            </button>

            <div style={{ 
              display: 'inline-flex', 
              padding: '4px 12px', 
              borderRadius: 999, 
              background: activePassModal.check_in_status === 'CANCELLED' ? '#fee2e2' : activePassModal.check_in_status === 'ATTENDED' ? '#dbeafe' : '#dcfce7', 
              color: activePassModal.check_in_status === 'CANCELLED' ? '#991b1b' : activePassModal.check_in_status === 'ATTENDED' ? '#1e40af' : '#166534', 
              fontSize: 11, 
              fontWeight: 700, 
              marginBottom: 12 
            }}>
              {activePassModal.check_in_status === 'CANCELLED' ? '❌ REGISTRATION REVOKED (SEAT RELEASED)' : activePassModal.check_in_status === 'ATTENDED' ? '✅ ATTENDED & VERIFIED AT GATE' : '✅ OFFICIAL ENTRY PASS ISSUED'}
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: 'var(--navy)' }}>
              {activePassModal.event?.title || 'ClubSync Event'}
            </h3>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
              {activePassModal.event?.club_name} · Vishwakarma Institute of Technology
            </div>

            {/* QR Visual */}
            <div style={{ 
              background: activePassModal.check_in_status === 'CANCELLED' ? '#fef2f2' : '#f8fafc', 
              border: `2px dashed ${activePassModal.check_in_status === 'CANCELLED' ? '#fca5a5' : '#cbd5e1'}`, 
              borderRadius: 12, 
              padding: 20, 
              display: 'inline-flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 8,
              margin: '0 auto 16px',
              opacity: activePassModal.check_in_status === 'CANCELLED' ? 0.6 : 1
            }}>
              <IconQrcode size={130} color={activePassModal.check_in_status === 'CANCELLED' ? '#dc2626' : '#0f172a'} />
              <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', color: activePassModal.check_in_status === 'CANCELLED' ? '#dc2626' : '#0f172a' }}>
                {activePassModal.qr_token}
              </div>
            </div>

            <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 14px', fontSize: 12, textAlign: 'left', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#64748b' }}>Attendee:</span>
                <strong>{activePassModal.student_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#64748b' }}>Date & Venue:</span>
                <span>{activePassModal.event?.event_date} · {activePassModal.event?.venue_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Check-in Status:</span>
                <span style={{ 
                  color: activePassModal.check_in_status === 'CANCELLED' ? '#dc2626' : activePassModal.check_in_status === 'ATTENDED' ? '#2563eb' : '#16a34a', 
                  fontWeight: 700 
                }}>
                  {activePassModal.check_in_status === 'CANCELLED' ? 'CANCELLED' : activePassModal.check_in_status === 'ATTENDED' ? 'ATTENDED' : 'VALID FOR ENTRY'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button 
                onClick={() => window.print()}
                className={`${styles.btn} ${styles.btnBlock}`}
                style={{ background: '#0a1f4d' }}
                disabled={activePassModal.check_in_status === 'CANCELLED'}
              >
                <IconFileText size={16} /> Print / Download Pass
              </button>

              {activePassModal.check_in_status !== 'CANCELLED' && activePassModal.check_in_status !== 'ATTENDED' && (
                <button 
                  onClick={() => handleCancelRegistration(activePassModal.registration_id)}
                  style={{ background: '#fff', border: '1px solid #f87171', color: '#dc2626', padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel Registration & Release Seat
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={styles.app}>
        {/* Persistent Left Sidebar */}
        <aside className={styles.side}>
          <div className={styles.logo} onClick={() => setActiveTab('home')}>
            <svg viewBox="0 0 32 32">
              <circle cx="11" cy="12" r="7" fill="#0b63f6"/>
              <circle cx="21" cy="11" r="5" fill="#4d9bff"/>
              <circle cx="19" cy="21" r="6.5" fill="#0b63f6" opacity=".85"/>
              <circle cx="9" cy="23" r="3.5" fill="#79b4ff"/>
            </svg>
            ClubSync
          </div>

          <nav className={styles.nav}>
            <button 
              className={activeTab === 'home' ? styles.on : ''} 
              onClick={() => setActiveTab('home')}
            >
              <IconHome size={18} /> Home
            </button>
            <button 
              className={activeTab === 'events' || activeTab === 'event' ? styles.on : ''} 
              onClick={() => setActiveTab('events')}
            >
              <IconCalendarEvent size={18} /> Events
            </button>
            <button 
              className={activeTab === 'clubs' ? styles.on : ''} 
              onClick={() => setActiveTab('clubs')}
            >
              <IconUsers size={18} /> Clubs
            </button>
            <button 
              className={activeTab === 'recruitments' ? styles.on : ''} 
              onClick={() => setActiveTab('recruitments')}
            >
              <IconBriefcase size={18} /> Recruitments
            </button>
          </nav>

          <div className={`${styles.nav} ${styles.bottomNav}`}>
            <button 
              className={activeTab === 'settings' ? styles.on : ''} 
              onClick={() => setActiveTab('settings')}
            >
              <IconSettings size={18} /> Settings
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className={styles.main}>
          {/* Top Sticky Bar */}
          <header className={styles.top}>
            <label className={styles.search}>
              <IconSearch size={18} />
              <input 
                type="search" 
                placeholder="Search events, clubs, or topics..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </label>

            <span className={styles.sp} />

            <button 
              className={styles.bell} 
              onClick={() => setActiveTab('notifications')}
              title="Notifications"
            >
              <IconBell size={20} />
              <span className={styles.bellDot} />
            </button>

            {/* Profile Dropdown */}
            <div className={styles.menu}>
              <button 
                className={styles.me} 
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <span className={styles.av}>
                  {(profile?.name || 'Rohit Sharma').substring(0, 2).toUpperCase()}
                </span>
                <span style={{ textAlign: 'left' }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>
                    {profile?.name || 'Rohit Sharma'}
                  </span>
                  <small style={{ color: 'var(--muted)' }}>3rd Year, Computer Eng</small>
                </span>
              </button>

              {menuOpen && (
                <div className={styles.drop} onMouseLeave={() => setMenuOpen(false)}>
                  <button onClick={() => { setActiveTab('settings'); setMenuOpen(false); }}>
                    My Profile & Settings
                  </button>
                  <button onClick={() => { setActiveTab('events'); setEventsSubTab('saved'); setMenuOpen(false); }}>
                    My Saved Events ({Object.keys(savedEventIds).length})
                  </button>
                  <button onClick={() => { navigate('/president'); setMenuOpen(false); }}>
                    Switch to President View
                  </button>
                  <button onClick={() => { navigate('/faculty'); setMenuOpen(false); }}>
                    Switch to Faculty View
                  </button>
                  <button onClick={async () => { await signOut(); navigate('/login'); }} style={{ color: 'var(--red)' }}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </header>

          <main className={styles.content}>
            {/* VIEW 1: HOME */}
            {activeTab === 'home' && (
              <div className={styles.cols}>
                <div className={styles.stack}>
                  <div className={styles.pagehead} style={{ marginBottom: 0 }}>
                    <div>
                      <h1>Good morning, {profile?.name?.split(' ')[0] || 'Rohit'}! 👋</h1>
                      <p>Explore sanctioned events, connect with college clubs, and register for digital passes.</p>
                    </div>
                  </div>

                  {/* 4 Stat Cards */}
                  <div className={styles.grid4}>
                    <div className={`${styles.card} ${styles.stat}`} onClick={() => setActiveTab('events')}>
                      <span className={styles.bub} style={{ background: '#e7efff', color: '#0b63f6' }}>
                        <IconCalendarEvent size={20} />
                      </span>
                      <div>
                        <small>Published Events</small>
                        <b>{publishedEvents.length}</b>
                      </div>
                    </div>

                    <div className={`${styles.card} ${styles.stat}`} onClick={() => setActiveTab('clubs')}>
                      <span className={styles.bub} style={{ background: '#dcf5ec', color: '#12a37a' }}>
                        <IconUsers size={20} />
                      </span>
                      <div>
                        <small>My Clubs</small>
                        <b>2 Active</b>
                      </div>
                    </div>

                    <div className={`${styles.card} ${styles.stat}`} onClick={() => setActiveTab('recruitments')}>
                      <span className={styles.bub} style={{ background: '#efe6ff', color: '#7c3aed' }}>
                        <IconBriefcase size={20} />
                      </span>
                      <div>
                        <small>Open Recruitments</small>
                        <b>{STATIC_RECRUITMENTS.length}</b>
                      </div>
                    </div>

                    <div className={`${styles.card} ${styles.stat}`} onClick={() => {
                      if (myPasses.length > 0) setActivePassModal(myPasses[0]);
                      else showToast('No passes booked yet. Register for an event below!');
                    }}>
                      <span className={styles.bub} style={{ background: '#ffeedd', color: '#f97316' }}>
                        <IconQrcode size={20} />
                      </span>
                      <div>
                        <small>My Event Passes</small>
                        <b>{myPasses.length}</b>
                      </div>
                    </div>
                  </div>

                  {/* Sanctioned & Published Upcoming Events */}
                  <section>
                    <div className={styles.sec}>
                      <h2>Upcoming Sanctioned Events</h2>
                      <button className={styles.link} onClick={() => setActiveTab('events')}>
                        View all ({publishedEvents.length}) <IconArrowRight size={14} />
                      </button>
                    </div>

                    {publishedEvents.length === 0 ? (
                      <div className={`${styles.card} ${styles.empty}`}>
                        No events are published right now. When the Club President publishes an approved event, it will appear here instantly!
                      </div>
                    ) : (
                      <div className={styles.grid3}>
                        {publishedEvents.slice(0, 3).map(ev => {
                          const dateObj = new Date(ev.event_date);
                          const mon = !isNaN(dateObj.getTime()) ? dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'DATE';
                          const day = !isNaN(dateObj.getTime()) ? dateObj.getDate() : 'TBD';
                          const dow = !isNaN(dateObj.getTime()) ? dateObj.toLocaleString('en-US', { weekday: 'short' }) : '';
                          const isReg = isRegisteredForEvent(ev.event_id);

                          return (
                            <article 
                              key={ev.event_id} 
                              className={`${styles.card} ${styles.ev}`}
                              onClick={() => openEventDetail(ev.event_id)}
                            >
                              <div className={`${styles.ban} ${getEventBannerClass(ev.event_type)}`}>
                                <span className={styles.tag} style={{ background: '#0b63f6' }}>{ev.event_type}</span>
                                <button 
                                  className={`${styles.bm} ${savedEventIds[ev.event_id] ? styles.on : ''}`}
                                  onClick={e => toggleSave(ev.event_id, e)}
                                >
                                  <IconStar size={14} />
                                </button>
                              </div>
                              <div className={styles.bd}>
                                <div className={styles.date}>
                                  <span>{mon}</span>
                                  <b>{day}</b>
                                  <em>{dow}</em>
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <h3>{ev.title}</h3>
                                  <div className={styles.meta}>
                                    <i className={styles.cdot}><IconFileText size={10} /></i>
                                    <span>{ev.club_name}</span>
                                  </div>
                                  <div className={styles.meta}>
                                    <IconCalendarEvent size={13} />
                                    <span>{ev.event_time || '10:00 AM – 1:00 PM'}</span>
                                  </div>
                                  <div className={styles.meta}>
                                    <IconMapPin size={13} />
                                    <span>{ev.venue_name || 'Sharad Arena'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className={styles.ft}>
                                <span style={{ fontSize: 11, color: isReg ? '#16a34a' : '#64748b', fontWeight: isReg ? 700 : 500 }}>
                                  {isReg ? '✅ Pass Booked' : `${ev.expected_count} seats allocated`}
                                </span>
                                <button className={`${styles.btn} ${styles.btnSm}`}>
                                  Learn More <IconArrowRight size={12} />
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* My Clubs section */}
                  <section>
                    <div className={styles.sec}>
                      <h2>My Campus Clubs</h2>
                      <button className={styles.link} onClick={() => setActiveTab('clubs')}>
                        Explore clubs <IconArrowRight size={14} />
                      </button>
                    </div>

                    <div className={styles.grid2}>
                      {STATIC_CLUBS.slice(0, 2).map(c => (
                        <div key={c.id} className={styles.card} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px' }}>
                          <span className={styles.ico} style={{ background: c.color, borderRadius: '50%', width: 34, height: 34, flexShrink: 0 }}>
                            <IconUsers size={16} />
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>{c.name}</h3>
                              <span className={`${styles.pill} ${styles.pillG}`} style={{ fontSize: 10, padding: '1px 7px' }}>Active Member</span>
                            </div>
                            <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right Contextual Rail */}
                <aside className={styles.stack}>
                  {/* My Booked Passes Card */}
                  {myPasses.length > 0 && (
                    <div className={styles.card} style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                      <div className={styles.sec}>
                        <h2 style={{ fontSize: 13, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <IconQrcode size={16} /> My Active Entry Passes
                        </h2>
                      </div>
                      <div className={styles.dl}>
                        {myPasses.map(p => (
                          <div 
                            key={p.registration_id} 
                            onClick={() => setActivePassModal(p)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 0', borderBottom: '1px solid #dcfce7' }}
                          >
                            <span style={{ background: '#dcfce7', color: '#166534', padding: '6px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                              QR PASS
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <b style={{ fontSize: 12, color: '#14532d' }}>{p.event?.title}</b>
                              <small style={{ color: '#166534', fontSize: 11, display: 'block' }}>{p.qr_token}</small>
                            </div>
                            <IconChevronRight size={14} color="#166534" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Deadlines */}
                  <div className={styles.card}>
                    <div className={styles.sec}>
                      <h2 style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IconCalendarEvent size={16} /> Upcoming Deadlines
                      </h2>
                    </div>
                    <div className={styles.dl}>
                      <div onClick={() => setActiveTab('recruitments')}>
                        <span className={styles.ico2}><IconBriefcase size={14} /></span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <b>CSI Core Team Applications</b>
                          <small className={styles.muted} style={{ fontSize: 11 }}>Deadline: 28 Nov 2026</small>
                        </span>
                        <IconChevronRight size={14} />
                      </div>
                      <div onClick={() => setActiveTab('events')}>
                        <span className={styles.ico2}><IconCalendarEvent size={14} /></span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <b>Web Scalability Workshop</b>
                          <small className={styles.muted} style={{ fontSize: 11 }}>Sanctioned: 25 Nov 2026</small>
                        </span>
                        <IconChevronRight size={14} />
                      </div>
                    </div>
                  </div>

                  {/* Campus Inspiration Promo */}
                  <div className={styles.promo}>
                    <h3>Your Ideas. Our Campus.</h3>
                    <p style={{ fontSize: 12, color: 'var(--muted)', margin: '6px 0 12px', maxWidth: '65%' }}>
                      Join clubs, attend sanctioned events, build your future.
                    </p>
                    <button 
                      className={`${styles.btn} ${styles.btnSm}`} 
                      onClick={() => setActiveTab('clubs')}
                      style={{ borderRadius: '50%', width: 32, height: 32, padding: 0 }}
                    >
                      <IconArrowRight size={14} />
                    </button>
                  </div>
                </aside>
              </div>
            )}

            {/* VIEW 2: EVENTS DIRECTORY */}
            {activeTab === 'events' && (
              <div className={styles.stack}>
                <div className={styles.pagehead}>
                  <div>
                    <h1>Sanctioned Events</h1>
                    <p>Discover faculty-approved events published by club presidents across campus.</p>
                  </div>
                </div>

                {/* Filters */}
                <div className={styles.filters}>
                  <label className={`${styles.sel} ${styles.grow}`}>
                    <IconSearch size={14} />
                    <input 
                      type="search" 
                      placeholder="Search events by title or club..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </label>

                  <label className={styles.sel}>
                    <IconCalendarEvent size={14} />
                    <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                      <option value="All">All Event Types</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Tech Talk">Tech Talk</option>
                      <option value="Seminar">Seminar</option>
                    </select>
                  </label>
                </div>

                {/* Event Category Tabs */}
                <div className={styles.tabs} style={{ marginBottom: 16 }}>
                  <button 
                    className={eventsSubTab === 'upcoming' ? styles.on : ''} 
                    onClick={() => setEventsSubTab('upcoming')}
                  >
                    Upcoming Sanctioned Events <span className={styles.count}>{publishedEvents.length}</span>
                  </button>
                  <button 
                    className={eventsSubTab === 'saved' ? styles.on : ''} 
                    onClick={() => setEventsSubTab('saved')}
                  >
                    Saved Events <span className={styles.count}>{Object.keys(savedEventIds).filter(k => savedEventIds[k]).length}</span>
                  </button>
                </div>

                {/* Events Grid */}
                {filteredEvents.length === 0 ? (
                  <div className={`${styles.card} ${styles.empty}`}>
                    No events match these filters.
                  </div>
                ) : (
                  <div className={styles.grid3}>
                    {filteredEvents.map(ev => {
                      const dateObj = new Date(ev.event_date);
                      const mon = !isNaN(dateObj.getTime()) ? dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'DATE';
                      const day = !isNaN(dateObj.getTime()) ? dateObj.getDate() : 'TBD';
                      const dow = !isNaN(dateObj.getTime()) ? dateObj.toLocaleString('en-US', { weekday: 'short' }) : '';
                      const isReg = isRegisteredForEvent(ev.event_id);

                      return (
                        <article 
                          key={ev.event_id} 
                          className={`${styles.card} ${styles.ev}`}
                          onClick={() => openEventDetail(ev.event_id)}
                        >
                          <div className={`${styles.ban} ${getEventBannerClass(ev.event_type)}`}>
                            <span className={styles.tag} style={{ background: '#0b63f6' }}>{ev.event_type}</span>
                            <button 
                              className={`${styles.bm} ${savedEventIds[ev.event_id] ? styles.on : ''}`}
                              onClick={e => toggleSave(ev.event_id, e)}
                            >
                              <IconStar size={14} />
                            </button>
                          </div>
                          <div className={styles.bd}>
                            <div className={styles.date}>
                              <span>{mon}</span>
                              <b>{day}</b>
                              <em>{dow}</em>
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <h3>{ev.title}</h3>
                              <div className={styles.meta}>
                                <i className={styles.cdot}><IconFileText size={10} /></i>
                                <span>{ev.club_name}</span>
                              </div>
                              <div className={styles.meta}>
                                <IconCalendarEvent size={13} />
                                <span>{ev.event_time || '10:00 AM – 1:00 PM'}</span>
                              </div>
                              <div className={styles.meta}>
                                <IconMapPin size={13} />
                                <span>{ev.venue_name || 'Sharad Arena'}</span>
                              </div>
                            </div>
                          </div>
                          <div className={styles.ft}>
                            <span style={{ fontSize: 11, color: isReg ? '#16a34a' : '#64748b', fontWeight: isReg ? 700 : 500 }}>
                              {isReg ? '✅ Pass Booked' : `${ev.expected_count} seats allocated`}
                            </span>
                            <button className={`${styles.btn} ${styles.btnSm}`}>
                              Learn More <IconArrowRight size={12} />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: EVENT DETAIL VIEW WITH RSVP / REGISTRATION */}
            {activeTab === 'event' && activeEvent && (
              <div>
                <button 
                  className={styles.link} 
                  onClick={() => setActiveTab('events')} 
                  style={{ margin: '4px 0 14px' }}
                >
                  ← Back to Events
                </button>

                <div className={styles.colsWide}>
                  <div className={styles.stack}>
                    {/* Hero Banner */}
                    <div className={`${styles.detailHero} ${styles.ban} ${getEventBannerClass(activeEvent.event_type)}`}>
                      <span className={styles.tag} style={{ background: '#0b63f6', position: 'absolute', top: 14, left: 14 }}>
                        {activeEvent.event_type} · {activeEvent.scope || 'Intra-Collegiate'}
                      </span>
                      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8, zIndex: 2 }}>
                        <button 
                          className={`${styles.bm} ${savedEventIds[activeEvent.event_id] ? styles.on : ''}`}
                          onClick={e => toggleSave(activeEvent.event_id, e)}
                        >
                          <IconStar size={16} />
                        </button>
                        <button 
                          className={styles.bm}
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            showToast('Event link copied to clipboard!');
                          }}
                        >
                          <IconShare size={16} />
                        </button>
                      </div>

                      <div>
                        <h1>{activeEvent.title}</h1>
                        <div className={styles.by}>
                          <i className={styles.cdot} style={{ width: 22, height: 22 }}>
                            <IconFileText size={12} />
                          </i>
                          By {activeEvent.club_name} · Faculty Sanctioned
                        </div>
                      </div>
                    </div>

                    {/* Quick Info Grid */}
                    <div className={styles.info}>
                      <div>
                        <span className={styles.ib}><IconCalendarEvent size={18} /></span>
                        <span>
                          <b>{activeEvent.event_date ? new Date(activeEvent.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD'}</b>
                          <small>{activeEvent.event_time || '10:00 AM – 1:00 PM'}</small>
                        </span>
                      </div>
                      <div>
                        <span className={styles.ib}><IconMapPin size={18} /></span>
                        <span>
                          <b>{activeEvent.venue_name || 'Sharad Arena'}</b>
                          <small>Main Campus, VIT Pune</small>
                        </span>
                      </div>
                      <div>
                        <span className={styles.ib}><IconMapPin size={18} /></span>
                        <span>
                          <b>In-Person Event</b>
                          <small>Ticket: {activeEvent.ticket_price === 0 ? 'Free Entry' : `₹${activeEvent.ticket_price}`}</small>
                        </span>
                      </div>
                      <div>
                        <span className={styles.ib} style={{ background: '#dcfce7', color: '#16a34a' }}>
                          <IconCheck size={18} />
                        </span>
                        <span>
                          <b>{isRegisteredForEvent(activeEvent.event_id) ? 'Registered' : `${activeEvent.expected_count} Capacity`}</b>
                          <small>{activeEvent.target_audience || 'All Students'}</small>
                        </span>
                      </div>
                    </div>

                    {/* Detail Sections */}
                    <div className={styles.card} style={{ padding: '20px 22px' }}>
                      <div className={styles.sect}>
                        <h2>About the Event</h2>
                        <p>{activeEvent.description || 'Join us for an exciting collegiate event approved by faculty and organized by the student body.'}</p>
                        
                        {activeEvent.objectives && (
                          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 14px', marginTop: 14 }}>
                            <strong style={{ fontSize: 12, color: '#166534', display: 'block', marginBottom: 4 }}>
                              Academic & NAAC Objectives:
                            </strong>
                            <span style={{ fontSize: 13, color: '#14532d' }}>{activeEvent.objectives}</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.sect}>
                        <h2>What You'll Learn & Gain</h2>
                        <ul className={styles.ticks}>
                          <li>
                            <span className={styles.ck}><IconCheck size={10} /></span>
                            <span>{activeEvent.expected_outcomes || 'Practical industry insights and architectural best practices.'}</span>
                          </li>
                          <li>
                            <span className={styles.ck}><IconCheck size={10} /></span>
                            <span>Official digital participation credentials for your collegiate portfolio.</span>
                          </li>
                          <li>
                            <span className={styles.ck}><IconCheck size={10} /></span>
                            <span>Hands-on networking with club executive committee leads and industry speakers.</span>
                          </li>
                        </ul>
                      </div>

                      {/* Guest Speaker */}
                      {activeEvent.guest_details && activeEvent.guest_details.length > 0 && (
                        <div className={styles.sect}>
                          <h2>Keynote Speaker & Mentors</h2>
                          <div className={styles.person}>
                            <span className={styles.pic}>
                              {activeEvent.guest_details[0].name.substring(0, 2).toUpperCase()}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <b style={{ fontSize: 14 }}>{activeEvent.guest_details[0].name}</b>
                              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                                {activeEvent.guest_details[0].designation || 'Distinguished Industry Professional'}
                              </div>
                              {activeEvent.guest_details[0].contact && (
                                <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 2 }}>
                                  {activeEvent.guest_details[0].contact}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Organizer info */}
                      <div className={styles.sect}>
                        <h2>Organizing Club</h2>
                        <p>{activeEvent.club_name} runs hands-on workshops, tech talks, and summits for students of all years.</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Rail (RSVP / Registration) */}
                  <aside className={styles.stack}>
                    <div className={`${styles.card} ${styles.stack}`} style={{ gap: 12 }}>
                      <span className={`${styles.pill} ${styles.pillG}`}>
                        <IconCheck size={12} /> Sanctioned & Registration Open
                      </span>

                      <div style={{ background: 'var(--green-soft)', padding: '10px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, color: '#0a7d5c', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <IconUsers size={16} /> 
                        {isRegisteredForEvent(activeEvent.event_id) ? 'Seat Reserved for You' : `${activeEvent.expected_count} seats available`}
                      </div>

                      {/* Main Register Button */}
                      {isRegisteredForEvent(activeEvent.event_id) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <button 
                            className={`${styles.btn} ${styles.btnOk} ${styles.btnBlock}`}
                            onClick={() => {
                              const pass = getPassForEvent(activeEvent.event_id);
                              if (pass) setActivePassModal(pass);
                            }}
                          >
                            <IconQrcode size={16} /> View Digital Pass (Registered ✓)
                          </button>
                          <span style={{ fontSize: 11, color: '#16a34a', textAlign: 'center', fontWeight: 600 }}>
                            Pass #{getPassForEvent(activeEvent.event_id)?.qr_token}
                          </span>
                          <button 
                            type="button"
                            onClick={() => {
                              const pass = getPassForEvent(activeEvent.event_id);
                              if (pass) handleCancelRegistration(pass.registration_id);
                            }}
                            style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 11.5, cursor: 'pointer', textAlign: 'center', textDecoration: 'underline' }}
                          >
                            Unable to attend? Cancel pass & release seat
                          </button>
                        </div>
                      ) : (
                        <button 
                          className={`${styles.btn} ${styles.btnBlock}`}
                          onClick={() => handleRegister(activeEvent)}
                          style={{ height: 44, fontSize: 14 }}
                        >
                          Register for Event <IconArrowRight size={16} />
                        </button>
                      )}

                      <button 
                        className={`${styles.btn} ${styles.btnOut} ${styles.btnBlock}`}
                        onClick={e => toggleSave(activeEvent.event_id, e)}
                      >
                        <IconStar size={15} /> {savedEventIds[activeEvent.event_id] ? 'Saved in Bookmarks' : 'Save Event'}
                      </button>

                      <button 
                        className={`${styles.btn} ${styles.btnOut} ${styles.btnBlock}`}
                        onClick={() => {
                          window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(activeEvent.title)}&dates=${encodeURIComponent(activeEvent.event_date.replace(/-/g, ''))}/${encodeURIComponent(activeEvent.event_date.replace(/-/g, ''))}&details=${encodeURIComponent(activeEvent.description)}&location=${encodeURIComponent(activeEvent.venue_name)}`, '_blank');
                        }}
                      >
                        <IconCalendarEvent size={15} /> + Add to Google Calendar
                      </button>
                    </div>

                    {/* Club Card */}
                    <div className={styles.card}>
                      <div className={styles.sec}>
                        <h2 style={{ fontSize: 14 }}>Organizing Body</h2>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className={styles.ico} style={{ width: 44, height: 44, borderRadius: '50%' }}>
                          <IconFileText size={20} />
                        </span>
                        <div>
                          <b>{activeEvent.club_name}</b>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Official College Chapter</div>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            )}

            {/* VIEW 4: CLUBS */}
            {activeTab === 'clubs' && (
              <div className={styles.stack}>
                <div className={styles.pagehead}>
                  <div>
                    <h1>Campus Clubs & Societies</h1>
                    <p>Connect with student organizations, technical chapters, and leadership cells.</p>
                  </div>
                </div>

                <div className={styles.grid3}>
                  {STATIC_CLUBS.map(club => (
                    <article key={club.id} className={`${styles.card} ${styles.club}`}>
                      <div className={`${styles.ban} ${styles.bTech}`} style={{ height: 78 }}>
                        <span className={styles.lg} style={{ background: club.color }}>
                          <IconUsers size={20} />
                        </span>
                      </div>
                      <div className={styles.bd}>
                        <h3>
                          {club.name}
                          {club.mem && <span className={`${styles.pill} ${styles.pillG}`}>Member</span>}
                        </h3>
                        <small className={styles.muted}>{club.members} students enrolled</small>
                        <p>{club.desc}</p>
                        <div className={styles.chips}>
                          {club.tags.map(t => <span key={t} className={styles.chip}>{t}</span>)}
                        </div>
                        <button 
                          className={`${styles.btn} ${styles.btnOut} ${styles.btnBlock}`}
                          onClick={() => {
                            setActiveTab('events');
                            setSearchQuery(club.name);
                          }}
                        >
                          View Club Events <IconArrowRight size={13} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 5: RECRUITMENTS */}
            {activeTab === 'recruitments' && (
              <div className={styles.stack}>
                <div className={styles.pagehead}>
                  <div>
                    <h1>Club Recruitments</h1>
                    <p>Apply for technical, design, PR, and management positions across campus clubs.</p>
                  </div>
                </div>

                <div className={styles.stack}>
                  {STATIC_RECRUITMENTS.map(rec => (
                    <article key={rec.id} className={styles.card} style={{ display: 'grid', gridTemplateColumns: '56px minmax(0, 1fr) auto', gap: 16, alignItems: 'center' }}>
                      <span className={styles.ico} style={{ width: 56, height: 56, borderRadius: 12 }}>
                        <IconBriefcase size={24} />
                      </span>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>{rec.title}</h3>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{rec.club}</div>
                        <p style={{ fontSize: 13, color: '#33405d', margin: '0 0 8px' }}>{rec.desc}</p>
                        <div className={styles.chips}>
                          {rec.tags.map(t => <span key={t} className={styles.chip}>{t}</span>)}
                        </div>
                        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11.5, color: '#44506b' }}>
                          <span>👥 {rec.openings} Openings</span>
                          <span>📅 Apply by {rec.deadline}</span>
                          <span>🎓 {rec.eligibility}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                        <button 
                          className={`${styles.btn} ${appliedRecs[rec.id] ? styles.btnOk : ''}`}
                          onClick={() => toggleApply(rec.id)}
                        >
                          {appliedRecs[rec.id] ? 'Applied ✓' : 'Apply Now'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 6: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className={styles.cols}>
                <div className={styles.stack}>
                  <div className={styles.pagehead}>
                    <div>
                      <h1>Notifications</h1>
                      <p>Stay updated with sanctioned event approvals, QR passes, and club announcements.</p>
                    </div>
                    <button 
                      className={`${styles.btn} ${styles.btnOut}`}
                      onClick={() => showToast('All notifications marked as read')}
                    >
                      <IconCheck size={14} /> Mark all as read
                    </button>
                  </div>

                  <div className={`${styles.card}`} style={{ padding: 0 }}>
                    {[
                      { title: 'Official Sanction Granted', body: 'Faculty Mentor approved the New Event Proposal. CSI President published Building Scalable Web Apps.', time: '10 mins ago', type: 'event' },
                      { title: 'Digital Pass Issued', body: 'Your registration was confirmed with QR token pass.', time: '1 hour ago', type: 'pass' },
                      { title: 'Core Committee Recruitment', body: 'CSI opened 8 positions for full-stack and AI engineering.', time: 'Yesterday', type: 'rec' }
                    ].map((n, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b style={{ fontSize: 13 }}>{n.title}</b>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{n.body}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <aside className={styles.stack}>
                  <div className={styles.card}>
                    <h2 style={{ fontSize: 14, marginBottom: 8 }}>Quick Preferences</h2>
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                      You receive immediate alerts whenever your club president releases a sanctioned event pass.
                    </p>
                  </div>
                </aside>
              </div>
            )}

            {/* VIEW 7: SETTINGS & PROFILE */}
            {activeTab === 'settings' && (
              <div className={styles.stack}>
                <div className={styles.pagehead}>
                  <div>
                    <h1>Student Profile & Settings</h1>
                    <p>Manage your campus profile, credentials, and digital passes.</p>
                  </div>
                </div>

                <div className={styles.card} style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  <div className={styles.pic} style={{ width: 80, height: 80, fontSize: 24 }}>
                    {(profile?.name || 'Rohit Sharma').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, margin: '0 0 4px' }}>{profile?.name || 'Rohit Sharma'}</h2>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                      3rd Year, B.Tech Computer Engineering · Vishwakarma Institute of Technology
                    </div>
                    <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 4 }}>
                      {(profile as any)?.email || user?.email || 'rohit.sharma@vit.edu'} · Verified Student Account
                    </div>
                  </div>
                </div>

                <div className={styles.card}>
                  <h3 style={{ fontSize: 15, marginBottom: 12 }}>Active Digital Event Passes ({myPasses.length})</h3>
                  {myPasses.length === 0 ? (
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>No active event passes booked.</div>
                  ) : (
                    <div className={styles.grid2}>
                      {myPasses.map(p => (
                        <div 
                          key={p.registration_id}
                          onClick={() => setActivePassModal(p)}
                          style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 14, cursor: 'pointer', background: '#f8fafc' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <strong style={{ fontSize: 13 }}>{p.event?.title}</strong>
                            <span style={{ 
                              fontSize: 11, 
                              color: p.check_in_status === 'CANCELLED' ? '#dc2626' : p.check_in_status === 'ATTENDED' ? '#2563eb' : '#16a34a', 
                              fontWeight: 700 
                            }}>
                              {p.check_in_status === 'CANCELLED' ? 'CANCELLED' : p.check_in_status === 'ATTENDED' ? 'ATTENDED' : 'VALID'}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{p.event?.club_name} · {p.event?.event_date}</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, marginTop: 6, color: '#0f172a' }}>
                            {p.qr_token}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}