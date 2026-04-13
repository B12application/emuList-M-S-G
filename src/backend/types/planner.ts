export interface PlannerMeeting {
  id?: string;
  userId: string;
  title: string;
  date: string; // ISO string YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  description?: string;
  isGoogleSheet?: boolean; // True if it came from the external sync
  createdAt?: Date | any;
  itemType?: 'meeting' | 'todo' | 'jira' | 'match';
  isCompleted?: boolean;
  dueDate?: string; // used specifically for tasks/jira
  externalLink?: string; // Link to jira ticket / match info
}

export interface GoogleSheetMeeting {
  Tarih: string; // "YYYY-MM-DD" or similar format in CSV
  Saat: string;  // "HH:mm"
  Konu: string;
  BitisSaati?: string;
  Detay?: string;
}
