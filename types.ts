
export type AppTheme = 'light' | 'dark';

export interface Agent {
  id: string;
  name: string;
  role: string;
  language: string;
  status: 'Draft' | 'Active';
  lastModified: string;
}

export interface CallLog {
  id: string;
  agentName: string;
  date: string;
  duration: string;
  cost: number;
  status: 'Completed' | 'Missed' | 'Active';
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
}
