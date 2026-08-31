export interface CoreTeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface ClubEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  attendees: number;
  type: 'upcoming' | 'past' | 'flagship';
}

export interface ClubData {
  name: string;
  sub: string;
  about: string;
  achievements: string[];
  coreTeam: CoreTeamMember[];
  events: ClubEvent[];
  recruitment: {
    status: 'open' | 'closed';
    eligibility: string;
    selection: string;
    fee: string;
    meets: string;
  };
  socials: {
    email: string;
    instagram: string;
    linkedin: string;
  };
}

export const initialClubData: ClubData = {
  name: "EDC — Entrepreneurship Development Cell",
  sub: "Inspire. Innovate. Inform.",
  about: "The Entrepreneurship Development Cell (EDC) of VIT Pune aims to produce successful entrepreneurs equipped with leadership qualities, using innovative and ethical business practices to make a global impact. EDC builds a community of like-minded, passionate entrepreneurs and gives every budding founder on campus a platform to learn, pitch, and grow.",
  achievements: [
    "Smart India Hackathon Winners 2025",
    "Best Technical Club Award 2024",
    "500+ GitHub contributions",
    "1000+ workshop attendees"
  ],
  coreTeam: [
    { id: '1', name: 'Rohan Sharma', role: 'President', avatar: 'RS' },
    { id: '2', name: 'Priya Sharma', role: 'Secretary', avatar: 'PS' }
  ],
  events: [
    { id: 'e1', title: 'Pune TechFest Hackathon 2026', date: '28 Aug', location: 'Auditorium', attendees: 142, type: 'flagship' },
    { id: 'e2', title: 'Code Sprint Weekend', date: '05 Sep', location: 'Lab 401', attendees: 56, type: 'upcoming' },
    { id: 'e3', title: 'Founder\'s Fireside Chat', date: '14 Sep', location: 'Seminar Hall 2', attendees: 80, type: 'upcoming' },
    { id: 'e4', title: 'Pitch Bootcamp — Cohort 5', date: '02 Oct', location: 'Innovation Lab', attendees: 35, type: 'upcoming' }
  ],
  recruitment: {
    status: 'open',
    eligibility: 'Open to all years & branches',
    selection: 'Form + Interview round',
    fee: 'Free',
    meets: 'Thu · 5:30 PM · EDC Room'
  },
  socials: {
    email: 'edc@vit.edu',
    instagram: 'instagram.com/edc_vit',
    linkedin: 'linkedin.com/company/edcvit'
  }
};
