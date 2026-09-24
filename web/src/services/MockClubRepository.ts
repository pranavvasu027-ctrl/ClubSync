import { IClubRepository, Club, ClubEvent } from './ClubService';

export class MockClubRepository implements IClubRepository {
  private mockClubs: Club[] = [
    {
      club_id: 'MOCK_TRF',
      name: 'The Robotics Forum (Mock)',
      short_name: 'TRF',
      vertical: 'Technical',
      description: 'Building robots and pushing the boundaries of automation on campus.'
    },
    {
      club_id: 'MOCK_IEEE',
      name: 'IEEE Student Branch (Mock)',
      short_name: 'IEEE',
      vertical: 'Technical',
      description: 'Global technical community empowering students to innovate.'
    }
  ];

  private mockEvents: Record<string, ClubEvent[]> = {
    'MOCK_TRF': [
      {
        event_id: 'mock-evt-1',
        club_id: 'MOCK_TRF',
        name: 'RoboWars 2026',
        description: 'Annual combat robotics competition.',
        event_date: '2026-10-15',
        status: 'live',
        venue: 'Main Ground'
      }
    ]
  };

  async getClubDetails(clubId: string): Promise<Club | null> {
    const club = this.mockClubs.find(c => c.club_id === clubId);
    return club || null;
  }

  async getClubEvents(clubId: string): Promise<ClubEvent[]> {
    return this.mockEvents[clubId] || [];
  }

  async getAllClubs(): Promise<Club[]> {
    return [...this.mockClubs];
  }
}
