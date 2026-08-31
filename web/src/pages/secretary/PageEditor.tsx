import React from 'react';
import styles from './PageEditor.module.css';
import { useClub } from '../../context/ClubContext';
import { ReactSortable } from 'react-sortablejs';
import ClubMobilePreview from '../../components/ClubMobilePreview';
import { IconGripVertical, IconCheck, IconDeviceMobile } from '@tabler/icons-react';

const PageEditor: React.FC = () => {
  const { clubData, updateClubData } = useClub();

  // For the sake of the prototype, we can use a hardcoded list of blocks 
  // and map them to their corresponding editors.
  const [blocks, setBlocks] = React.useState([
    { id: 'overview', name: 'Overview' },
    { id: 'achievements', name: 'Achievements' },
    { id: 'team', name: 'Core Team' },
    { id: 'socials', name: 'Contact & Social' }
  ]);

  const handleUpdate = (field: string, value: any) => {
    updateClubData({ [field]: value });
  };

  const handleAchievementChange = (index: number, value: string) => {
    const newAch = [...clubData.achievements];
    newAch[index] = value;
    handleUpdate('achievements', newAch);
  };

  const renderBlock = (block: { id: string; name: string }) => {
    switch (block.id) {
      case 'overview':
        return (
          <div className={styles.block} key={block.id}>
            <div className={styles.blockHead}>
              <div className={styles.blockHeadLeft}><IconGripVertical size={16} className={styles.blockHandle} /><span className={styles.blockName}>{block.name}</span></div>
            </div>
            <div className={styles.fieldLabel}>Club Name</div>
            <input className={styles.inp} value={clubData.name} onChange={e => handleUpdate('name', e.target.value)} />
            <div className={styles.fieldLabel}>Tagline</div>
            <input className={styles.inp} value={clubData.sub} onChange={e => handleUpdate('sub', e.target.value)} />
            <div className={styles.fieldLabel}>About Description</div>
            <textarea className={styles.ta} value={clubData.about} onChange={e => handleUpdate('about', e.target.value)} />
          </div>
        );
      case 'achievements':
        return (
          <div className={styles.block} key={block.id}>
            <div className={styles.blockHead}>
              <div className={styles.blockHeadLeft}><IconGripVertical size={16} className={styles.blockHandle} /><span className={styles.blockName}>{block.name}</span></div>
            </div>
            <div className={styles.fieldLabel}>Milestones</div>
            {clubData.achievements.map((ach, i) => (
              <input key={i} className={styles.inp} value={ach} onChange={e => handleAchievementChange(i, e.target.value)} />
            ))}
          </div>
        );
      case 'team':
        return (
          <div className={styles.block} key={block.id}>
            <div className={styles.blockHead}>
              <div className={styles.blockHeadLeft}><IconGripVertical size={16} className={styles.blockHandle} /><span className={styles.blockName}>{block.name}</span></div>
            </div>
            {clubData.coreTeam.map((member, i) => (
              <div key={member.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input className={styles.inp} style={{ flex: 1, marginBottom: 0 }} value={member.name} 
                  onChange={e => {
                    const t = [...clubData.coreTeam];
                    t[i].name = e.target.value;
                    handleUpdate('coreTeam', t);
                  }} 
                />
                <input className={styles.inp} style={{ flex: 1, marginBottom: 0 }} value={member.role} 
                  onChange={e => {
                    const t = [...clubData.coreTeam];
                    t[i].role = e.target.value;
                    handleUpdate('coreTeam', t);
                  }} 
                />
              </div>
            ))}
          </div>
        );
      case 'socials':
        return (
          <div className={styles.block} key={block.id}>
            <div className={styles.blockHead}>
              <div className={styles.blockHeadLeft}><IconGripVertical size={16} className={styles.blockHandle} /><span className={styles.blockName}>{block.name}</span></div>
            </div>
            <div className={styles.fieldLabel}>Email</div>
            <input className={styles.inp} value={clubData.socials.email} onChange={e => handleUpdate('socials', { ...clubData.socials, email: e.target.value })} />
            <div className={styles.fieldLabel}>Instagram</div>
            <input className={styles.inp} value={clubData.socials.instagram} onChange={e => handleUpdate('socials', { ...clubData.socials, instagram: e.target.value })} />
            <div className={styles.fieldLabel}>LinkedIn</div>
            <input className={styles.inp} value={clubData.socials.linkedin} onChange={e => handleUpdate('socials', { ...clubData.socials, linkedin: e.target.value })} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Publish</div>
          <h1>Club page editor</h1>
          <p>Customize the public profile block by block. Changes preview instantly.</p>
        </div>
        <div className={styles.btnRow}>
          <button className={`${styles.btn} ${styles.btnGhost}`}><IconDeviceMobile size={18} /> Preview</button>
          <button className={`${styles.btn} ${styles.btnStamp}`} onClick={() => alert('Saved!')}><IconCheck size={18} /> Publish</button>
        </div>
      </div>

      <div className={styles.editorSplit}>
        <div className={styles.editorBlocks}>
          <ReactSortable list={blocks} setList={setBlocks} animation={200} handle={`.${styles.blockHandle}`}>
            {blocks.map(block => renderBlock(block))}
          </ReactSortable>
        </div>
        <div className={styles.editorPreview}>
          <ClubMobilePreview />
        </div>
      </div>
    </>
  );
};

export default PageEditor;
