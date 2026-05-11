export interface Institution {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'nursing_home' | 'academy';
  lat: number;
  lon: number;
  city: string;
  address?: string;
  website?: string;
  phone?: string;
  intel?: {
    contacts: Contact[];
    score: number;
    visaSupport: boolean;
    accommodation: boolean;
    languageReq: string;
    trainingProgram?: string;
    internationalTeamSize?: string;
    lastHiringEvent?: string;
    hrDirectLine?: string;
    researchSummary?: string;
    ausbildungUrl?: string;
    internationalReady?: boolean;
    analysis?: string;
    website?: string;
  };
}

export interface Contact {
  name: string;
  email: string;
  phone?: string;
  role: string;
}

export interface Lead extends Institution {
  institutionId: string;
  status: 'discovered' | 'applied' | 'interview' | 'accepted' | 'rejected';
  notes?: string;
  savedAt: string;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  query: string;
  created_at: string;
  results_count: number;
}
