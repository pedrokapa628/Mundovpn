
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface Server {
  id: string;
  name: string;
  country: string;
  flag: string;
  latency: number;
  load: number;
  ip: string;
}

export interface TrafficStats {
  download: number;
  upload: number;
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  latency?: number;
}

export interface HistoryItem {
  id: string;
  serverName: string;
  flag: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  dataUsed: string;
  status: 'success' | 'interrupted';
}

export interface UserAccount {
  name: string;
  email: string;
  plan: 'Free' | 'Pro' | 'Lifetime';
  expiryDate: string;
  totalDataUsed: string;
  monthlyLimit: string;
}
