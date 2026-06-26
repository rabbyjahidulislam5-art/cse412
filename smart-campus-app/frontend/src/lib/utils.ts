export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const formatBDT = (paisa: number | bigint): string => {
  const bdt = Number(paisa) / 100;
  return `৳ ${bdt.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatBDTFromNumber = (amount: number): string => {
  return `৳ ${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const maskStudentId = (id: string): string => {
  const parts = id.split('-');
  if (parts.length >= 2) return `${parts[0]}-****-${parts.slice(-1)[0]}`;
  return id;
};

export const maskPhone = (phone: string): string => {
  return `****${phone.slice(-4)}`;
};

export const maskIp = (ip: string): string => {
  if (!ip) return 'Unknown';
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
  return ip;
};

export const timeAgo = (date: string | Date): string => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const COLORS = {
  primary: { 50: '#EBF4FA', 100: '#D5E8F0', 500: '#3D8FD6', 600: '#2E75B6', 700: '#1E4D8C', 800: '#1A3C6E', 900: '#0D2137' },
  success: '#2E7D32',
  danger: '#C62828',
  warning: '#F57F17',
  info: '#01579B',
};
