import React, { useState } from 'react';
import styles from './SecretaryDashboard.module.css';
import { IconUpload } from '@tabler/icons-react';

const MediaLibrary: React.FC = () => {
  const [filter, setFilter] = useState('All');
  
  const mediaItems = [
    { name: 'hackathon_poster_v3.png', size: '2.4 MB', date: 'Aug 22', grad: styles.grad1, type: 'Images' },
    { name: 'team_photo_2026.jpg', size: '1.8 MB', date: 'Aug 20', grad: styles.grad2, type: 'Images' },
    { name: 'event_banner_techfest.png', size: '3.1 MB', date: 'Aug 18', grad: styles.grad3, type: 'Images' },
    { name: 'club_logo_dark.svg', size: '45 KB', date: 'Aug 15', grad: styles.grad4, type: 'Images' },
    { name: 'sponsor_deck.pdf', size: '5.2 MB', date: 'Aug 14', grad: styles.grad5, type: 'Documents' },
    { name: 'workshop_recording.mp4', size: '128 MB', date: 'Aug 12', grad: styles.grad6, type: 'Videos' },
    { name: 'certificate_template.png', size: '890 KB', date: 'Aug 10', grad: styles.grad1, type: 'Images' },
    { name: 'social_media_kit.zip', size: '12 MB', date: 'Aug 8', grad: styles.grad2, type: 'Documents' },
    { name: 'gedit_brochure.pdf', size: '2.8 MB', date: 'Aug 5', grad: styles.grad3, type: 'Documents' },
    { name: 'campus_photos_01.jpg', size: '1.2 MB', date: 'Aug 3', grad: styles.grad4, type: 'Images' },
    { name: 'campus_photos_02.jpg', size: '1.5 MB', date: 'Aug 3', grad: styles.grad5, type: 'Images' },
    { name: 'campus_photos_03.jpg', size: '1.1 MB', date: 'Aug 3', grad: styles.grad6, type: 'Images' },
    { name: 'promo_video_short.mp4', size: '45 MB', date: 'Aug 1', grad: styles.grad1, type: 'Videos' },
    { name: 'achievement_badge.png', size: '120 KB', date: 'Jul 28', grad: styles.grad2, type: 'Images' },
    { name: 'member_headshots.zip', size: '8.5 MB', date: 'Jul 25', grad: styles.grad3, type: 'Documents' },
    { name: 'annual_report_draft.pdf', size: '4.2 MB', date: 'Jul 20', grad: styles.grad4, type: 'Documents' },
  ];

  const filters = ['All', 'Images', 'Videos', 'Documents'];

  const filteredItems = filter === 'All' ? mediaItems : mediaItems.filter(i => i.type === filter);

  return (
    <>
      <div className={styles.hero} style={{ borderBottom: '2px solid var(--sec-ink)' }}>
        <div>
          <div className={styles.heroEyebrow}>Publish</div>
          <h1>Media library</h1>
          <p>{mediaItems.length} files across posters, photos, and documents.</p>
        </div>
      </div>

      <div className={styles.mediaFilters}>
        {filters.map(f => (
          <div key={f} className={`${styles.filterChip} ${filter === f ? styles.active : ''}`} onClick={() => setFilter(f)}>
            {f}
          </div>
        ))}
      </div>

      <div className={styles.uploadZone}>
        <IconUpload size={30} style={{ color: 'var(--sec-amber-deep)', marginBottom: 8 }} />
        <h4>Drag &amp; drop files here or click to browse</h4>
        <p>Supports PNG, JPG, MP4, PDF up to 50MB</p>
      </div>

      <div className={styles.mediaGrid}>
        {filteredItems.map((item, idx) => (
          <div key={idx} className={`${styles.mediaItem} ${item.grad}`}>
            <div className={styles.overlay}>
              <h5>{item.name}</h5>
              <p>{item.size} · {item.date}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default MediaLibrary;
