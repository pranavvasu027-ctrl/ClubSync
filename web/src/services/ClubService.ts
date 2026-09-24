export interface Club {
  club_id: string;
  name: string;
  short_name: string;
  vertical: string;
  description: string;
  logo_url?: string;
}

export interface ClubEvent {
  event_id: string;
  club_id: string;
  name: string;
  description: string;
  event_date: string;
  status: string;
  venue: string;
  image_url?: string;
}

export interface IClubRepository {
  getClubDetails(clubId: string): Promise<Club | null>;
  getClubEvents(clubId: string): Promise<ClubEvent[]>;
  getAllClubs(): Promise<Club[]>;
}
