import React from 'react';
import styles from './ClubMobilePreview.module.css';
import { useClub } from '../context/ClubContext';
import { IconChevronLeft, IconHeart, IconShare, IconHome, IconCalendarEvent, IconUsers, IconTrophy, IconUserPlus } from '@tabler/icons-react';

const ClubMobilePreview: React.FC = () => {
  const { clubData } = useClub();
  const { name, sub, about, achievements, coreTeam, events, recruitment, socials } = clubData;

  const flagshipEvent = events.find(e => e.type === 'flagship');
  const upcomingEvents = events.filter(e => e.type === 'upcoming');

  return (
    <div className={styles.phone}>
      {/* HERO */}
      <div className={styles.hero}>
        <div className={styles.heroTopbar}>
          <div className={styles.iconBtn}><IconChevronLeft size={20} /></div>
          <div className={styles.heroTopbarRight}>
            <div className={styles.iconBtn}><IconHeart size={18} /></div>
            <div className={styles.iconBtn}><IconShare size={18} /></div>
          </div>
        </div>
        <div className={styles.verticalChip}>Technical</div>
        <div className={styles.heroTitleBlock}>
          <div className={styles.heroLogo}>{name.split(' ')[0]}</div>
          <h1 className={styles.heroTitle}>{name}</h1>
          <div className={styles.heroSub}>{sub}</div>
        </div>
      </div>

      {/* STAT STRIP */}
      <div className={styles.statStrip}>
        <div className={styles.stat}><div className={styles.statNum}>210+</div><div className={styles.statLabel}>Members</div></div>
        <div className={styles.stat}><div className={styles.statNum}>{events.length}</div><div className={styles.statLabel}>Events</div></div>
        <div className={styles.stat}><div className={styles.statNum}>4.8k</div><div className={styles.statLabel}>Followers</div></div>
      </div>

      {/* TABS */}
      <div className={styles.tabs}>
        <div className={`${styles.tab} ${styles.active}`}>About</div>
        <div className={styles.tab}>Events</div>
        <div className={styles.tab}>Team</div>
        <div className={styles.tab}>Join</div>
      </div>

      {/* BODY */}
      <div className={styles.bodyScroll}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}><span className={styles.dot}></span>Overview</div>
          <div className={styles.aboutText}>{about}</div>
        </div>

        {achievements.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}><span className={styles.dot}></span>Achievements</div>
            <ul style={{ fontSize: '13px', paddingLeft: '20px', color: '#5B6472', margin: 0 }}>
              {achievements.map((ach, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{ach}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.sectionTitle}><span className={styles.dot}></span>Core Team</div>
          {coreTeam.map(member => (
            <div className={styles.mentorRow} key={member.id}>
              <div className={styles.mentorAvatar}>{member.avatar}</div>
              <div className={styles.mentorInfo}>
                <div className={styles.name}>{member.name}</div>
                <div className={styles.role}>{member.role}</div>
              </div>
            </div>
          ))}
        </div>

        {flagshipEvent && (
          <div className={styles.section} style={{ padding: 0, overflow: 'hidden', background: 'transparent', boxShadow: 'none' }}>
            <div className={styles.flagshipCard}>
              <div className={styles.flagshipBadge}>★ Flagship Event</div>
              <div className={styles.flagshipName}>{flagshipEvent.title}</div>
              <div className={styles.flagshipStats}>
                <div><b>{flagshipEvent.attendees}+</b>Attendees</div>
                <div><b>{flagshipEvent.date}</b>Date</div>
              </div>
            </div>
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}><span className={styles.dot}></span>Upcoming Events</div>
            {upcomingEvents.map(ev => {
              const [d, m] = ev.date.split(' ');
              return (
                <div className={styles.eventItem} key={ev.id}>
                  <div className={styles.eventDate}><div className={styles.d}>{d}</div><div className={styles.m}>{m}</div></div>
                  <div className={styles.eventInfo}>
                    <div className={styles.title}>{ev.title}</div>
                    <div className={styles.meta}>{ev.location} · {ev.attendees} expected</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.sectionTitle}><span className={styles.dot}></span>Join Us</div>
          <div className={styles.joinStatus}>
            {recruitment.status === 'open' ? <div className={styles.pulse}></div> : <div style={{width:9, height:9, borderRadius:'50%', background:'#98A2B3'}}></div>}
            <span style={{ color: recruitment.status === 'open' ? '#15803D' : '#5B6472' }}>
              {recruitment.status === 'open' ? 'Recruitment Open' : 'Recruitment Closed'}
            </span>
          </div>
          <div className={styles.joinRow}><div className={styles.k}>Eligibility</div><div className={styles.v}>{recruitment.eligibility}</div></div>
          <div className={styles.joinRow}><div className={styles.k}>Selection</div><div className={styles.v}>{recruitment.selection}</div></div>
          <div className={styles.joinRow}><div className={styles.k}>Meets</div><div className={styles.v}>{recruitment.meets}</div></div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}><span className={styles.dot}></span>Contact</div>
          <div className={styles.socialRow}>
            <div className={styles.socialBtn}><span className={styles.ic}>📧</span>Email</div>
            <div className={styles.socialBtn}><span className={styles.ic}>📷</span>Instagram</div>
            <div className={styles.socialBtn}><span className={styles.ic}>🔗</span>LinkedIn</div>
          </div>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <div className={styles.bottomNav}>
        <div className={styles.navItem}><IconHome size={22} className={styles.ic} />Home</div>
        <div className={styles.navItem}><IconCalendarEvent size={22} className={styles.ic} />Events</div>
        <div className={`${styles.navItem} ${styles.active}`}><IconUsers size={22} className={styles.ic} />Clubs</div>
        <div className={styles.navItem}><IconTrophy size={22} className={styles.ic} />Hackathons</div>
        <div className={styles.navItem}><IconUserPlus size={22} className={styles.ic} />Recruit</div>
      </div>
    </div>
  );
};

export default ClubMobilePreview;
