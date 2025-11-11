export type Participant = {
  id: string;
  name: string;
  nickname: string;
  points: number;
  matches: number;
  avatar_url?: string;
  payment_status?: 'paid' | 'pending';
  is_admin?: boolean;
};