import { IClubRepository } from './ClubService';
import { SupabaseClubRepository } from './SupabaseClubRepository';
import { MockClubRepository } from './MockClubRepository';

/**
 * Returns the appropriate repository based on the club context.
 * EDC uses real data. Other clubs default to mock data until activated.
 */
export const getClubRepository = (clubId: string): IClubRepository => {
  if (clubId === 'VIT_EDC') {
    return new SupabaseClubRepository();
  }
  return new MockClubRepository();
};

export const getPlatformClubs = async () => {
  // Eventually this can merge real live clubs with mock ones for the discovery UI.
  // For Phase 0, we'll demonstrate both.
  const realRepo = new SupabaseClubRepository();
  const mockRepo = new MockClubRepository();
  
  const realClubs = await realRepo.getAllClubs();
  const mockClubs = await mockRepo.getAllClubs();
  
  return [...realClubs, ...mockClubs];
};
