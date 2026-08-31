import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { ClubApplicant } from '../../types/clubData';
import { ReactSortable } from 'react-sortablejs';
import styles from './PresidentDashboard.module.css';
import { IconCheck, IconTag } from '@tabler/icons-react';

const Recruitment: React.FC = () => {
  const [applicants, setApplicants] = useState<ClubApplicant[]>([]);

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    const { data } = await supabase.from('club_applicants').select('*');
    if (data) setApplicants(data);
  };

  const updateApplicantStage = async (newColList: ClubApplicant[], stage: string) => {
    setApplicants(prev => {
      const others = prev.filter(a => a.stage !== stage);
      const updated = newColList.map(a => ({ ...a, stage: stage as ClubApplicant['stage'] }));
      return [...others, ...updated];
    });

    for (const app of newColList) {
      if (app.stage !== stage) {
        await supabase.from('club_applicants').update({ stage }).eq('id', app.id);
      }
    }
  };

  const columns = [
    { id: 'applied', title: 'Applied' },
    { id: 'screening', title: 'Screening' },
    { id: 'interview', title: 'Interview' },
    { id: 'selected', title: 'Selected' },
    { id: 'onboarded', title: 'Onboarded' },
  ];

  return (
    <>
      <div className={styles.hero} style={{ borderBottom: '2px solid var(--pres-ink)' }}>
        <div>
          <div className={styles.heroEyebrow}>Operate</div>
          <h1>Recruitment pipeline</h1>
          <p>{applicants.length} applicants across five stages.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 7, fontSize: 12.5, fontWeight: 600, border: '1px solid transparent', cursor: 'pointer', background: 'var(--pres-red)', color: '#fff', boxShadow: '0 2px 0 #9C3620' }}>
          <IconCheck size={16}/> Finalize intake
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <div className={`${styles.statCard} ${styles.cNavy}`}><div className={styles.statLabel}>Total applicants</div><div className={styles.statValue}>{applicants.length}</div></div>
        <div className={`${styles.statCard} ${styles.cAmber}`}><div className={styles.statLabel}>In pipeline</div><div className={styles.statValue}>{applicants.filter(a => ['applied', 'screening', 'interview'].includes(a.stage)).length}</div></div>
        <div className={`${styles.statCard} ${styles.cGreen}`}><div className={styles.statLabel}>Selected</div><div className={styles.statValue}>{applicants.filter(a => a.stage === 'selected').length}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
        {columns.map(col => {
          const colApps = applicants.filter(a => a.stage === col.id);
          return (
            <div key={col.id} style={{ flex: '0 0 250px', background: 'var(--pres-paper-deep)', border: '1px solid var(--pres-rule)', borderRadius: 9, padding: 12, display: 'flex', flexDirection: 'column', minHeight: 400 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 700, marginBottom: 10, padding: '0 2px' }}>
                {col.title} <span style={{ background: 'var(--pres-card)', border: '1px solid var(--pres-rule-strong)', borderRadius: 10, padding: '1px 7px', fontSize: 10.5, color: 'var(--pres-ink-soft)' }}>{colApps.length}</span>
              </div>
              
              <ReactSortable
                list={colApps}
                setList={(newList) => updateApplicantStage(newList, col.id)}
                group="applicants"
                animation={150}
                style={{ flex: 1, minHeight: 50 }}
              >
                {colApps.map(app => (
                  <div key={app.id} style={{ background: 'var(--pres-card)', border: '1px solid var(--pres-rule)', borderLeft: app.stage === 'selected' ? '3px solid var(--pres-green)' : '1px solid var(--pres-rule)', borderRadius: 7, padding: '11px 12px', marginBottom: 9, cursor: 'grab', fontSize: 12.5, boxShadow: 'var(--pres-shadow-card)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{app.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--pres-ink-faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <IconTag size={12}/> {app.role} · CGPA {app.cgpa}
                    </div>
                  </div>
                ))}
              </ReactSortable>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Recruitment;
