export interface PlannerMeeting {
  id?: string;
  userId: string;
  title: string;
  date: string; // ISO string YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  description?: string;
  notes?: string;   // For detailed meeting notes
  isGoogleSheet?: boolean; // True if it came from the external sync
  createdAt?: Date | any;
  itemType?: 'meeting' | 'todo' | 'jira' | 'match';
  isCompleted?: boolean;
  dueDate?: string; // used specifically for tasks/jira
  externalLink?: string; // Link to jira ticket / match info
  isRecurring?: boolean;
  recurringGroupId?: string; // To group instances of a series
  isRecurringMaster?: boolean; // If true, this is the template doc
  recurrenceFrequency?: 'weekly';
  lastGeneratedDate?: string; // Track up to which date instances are generated
}

export interface GoogleSheetMeeting {
  Tarih: string; // "YYYY-MM-DD" or similar format in CSV
  Saat: string;  // "HH:mm"
  Konu: string;
  BitisSaati?: string;
  Detay?: string;
}
