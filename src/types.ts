export interface Assignment {
  id?: string;  // Added for Firebase document ID
  name: string;
  number: number;
  timestamp: number;
  fortune?: string;
}

export interface AppState {
  assignments: Assignment[];
  currentUser: string;
  isDarkMode: boolean;
  isAdmin: boolean;
  message: {
    text: string;
    type: 'error' | 'success' | 'info' | 'neutral';
  } | null;
  isGenerating: boolean;
}

export enum Theme {
  DARK = 'DARK',
  LIGHT = 'LIGHT'
}
