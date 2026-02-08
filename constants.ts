
import { Server, HistoryItem, UserAccount } from './types';

export const SERVERS: Server[] = [
  { id: 'us-east', name: 'New York', country: 'United States', flag: '🇺🇸', latency: 42, load: 35, ip: '142.250.190.46' },
  { id: 'uk-lon', name: 'London', country: 'United Kingdom', flag: '🇬🇧', latency: 110, load: 62, ip: '172.217.169.174' },
  { id: 'jp-tok', name: 'Tokyo', country: 'Japan', flag: '🇯🇵', latency: 215, load: 15, ip: '172.217.161.68' },
  { id: 'br-sp', name: 'São Paulo', country: 'Brazil', flag: '🇧🇷', latency: 15, load: 45, ip: '201.10.12.1' },
  { id: 'de-fra', name: 'Frankfurt', country: 'Germany', flag: '🇩🇪', latency: 95, load: 88, ip: '142.250.74.206' },
  { id: 'sg-sin', name: 'Singapore', country: 'Singapore', flag: '🇸🇬', latency: 180, load: 22, ip: '108.177.126.101' },
  { id: 'au-syd', name: 'Sydney', country: 'Australia', flag: '🇦🇺', latency: 280, load: 40, ip: '13.236.0.0' },
  { id: 'ca-tor', name: 'Toronto', country: 'Canada', flag: '🇨🇦', latency: 55, load: 28, ip: '35.203.32.0' },
  { id: 'za-jhb', name: 'Johannesburg', country: 'South Africa', flag: '🇿🇦', latency: 310, load: 12, ip: '160.119.0.0' },
  { id: 'fr-par', name: 'Paris', country: 'France', flag: '🇫🇷', latency: 88, load: 55, ip: '15.236.0.0' },
  { id: 'in-mum', name: 'Mumbai', country: 'India', flag: '🇮🇳', latency: 195, load: 72, ip: '13.126.0.0' },
];

export const MOCK_HISTORY: HistoryItem[] = [
  { id: '1', serverName: 'São Paulo', flag: '🇧🇷', date: '25 Oct 2023', startTime: '14:20', endTime: '16:35', duration: '2h 15m', dataUsed: '450 MB', status: 'success' },
  { id: '2', serverName: 'New York', flag: '🇺🇸', date: '24 Oct 2023', startTime: '09:10', endTime: '09:55', duration: '45m', dataUsed: '120 MB', status: 'success' },
  { id: '3', serverName: 'London', flag: '🇬🇧', date: '24 Oct 2023', startTime: '22:00', endTime: '23:10', duration: '1h 10m', dataUsed: '230 MB', status: 'success' },
  { id: '4', serverName: 'Frankfurt', flag: '🇩🇪', date: '23 Oct 2023', startTime: '08:00', endTime: '13:20', duration: '5h 20m', dataUsed: '1.2 GB', status: 'success' },
  { id: '5', serverName: 'Tokyo', flag: '🇯🇵', date: '22 Oct 2023', startTime: '18:15', endTime: '18:45', duration: '30m', dataUsed: '85 MB', status: 'interrupted' },
  { id: '6', serverName: 'Paris', flag: '🇫🇷', date: '21 Oct 2023', startTime: '11:30', endTime: '14:00', duration: '2h 30m', dataUsed: '512 MB', status: 'success' },
  { id: '7', serverName: 'Sydney', flag: '🇦🇺', date: '20 Oct 2023', startTime: '03:10', endTime: '04:40', duration: '1h 30m', dataUsed: '210 MB', status: 'success' },
  { id: '8', serverName: 'Toronto', flag: '🇨🇦', date: '19 Oct 2023', startTime: '20:00', endTime: '21:15', duration: '1h 15m', dataUsed: '190 MB', status: 'success' },
];

export const MOCK_USER: UserAccount = {
  name: 'Alex Silva',
  email: 'alex.silva@mundo.io',
  plan: 'Pro',
  expiryDate: 'Dec 12, 2024',
  totalDataUsed: '12.4 GB',
  monthlyLimit: '50 GB'
};

export const APP_THEME = {
  primary: '#3b82f6',
  secondary: '#10b981',
  danger: '#ef4444',
  bg: '#030712',
  surface: '#111827',
};
