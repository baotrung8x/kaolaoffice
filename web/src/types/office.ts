export type OfficeDocType = 'doc' | 'sheet' | 'slide';

export interface OfficeDocument {
  id: string;
  title: string;
  type: OfficeDocType;
  lastModified: string;
  size: string;
  content?: any;
  cloudSynced: boolean;
}

export interface KaolaUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'pro';
  aiCreditsRemaining: number;
  aiCreditsTotal: number;
  connectedToKaolaId: boolean;
}

export interface AiAction {
  id: string;
  name: string;
  iconName: string;
  prompt: string;
  description: string;
}
