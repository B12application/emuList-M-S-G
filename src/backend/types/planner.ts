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
  itemType?: 'meeting' | 'todo' | 'jira' | 'match' | 'sport' | 'sticky';
  isCompleted?: boolean;
  dueDate?: string; // used specifically for tasks/jira
  externalLink?: string; // Link to jira ticket / match info
  isRecurring?: boolean;
  recurringGroupId?: string; // To group instances of a series
  isRecurringMaster?: boolean; // If true, this is the template doc
  recurrenceFrequency?: 'weekly';
  lastGeneratedDate?: string; // Track up to which date instances are generated
  status?: 'todo' | 'planned' | 'dev' | 'test' | 'done';
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  category?: string;      // Görev kategorisi: 'araba', 'ev', 'kişisel', etc.
  categoryColor?: string; // Kategori rengi: '#f97316', '#10b981', etc.
  teamBadge?: string;     // Futbol takımı logo URL
  teamColor?: string;     // Futbol takımı ana rengi
  score?: string;         // Maç skoru (örn: '2 - 1')
  isFinished?: boolean;   // Maç bitti mi?
  jiraTaskId?: string;    // Jira ticket ID (örn: SPB-5238) — fotoğraftan aktarılan task'lar için benzersizlik anahtarı
  jiraTaskType?: 'bug' | 'feature' | 'research' | 'task'; // Jira ticket tipi (renk kodlaması için)
  // Sticky Notes (Google Notes / Yapışkan Notlar Tuvali) alanları:
  stickyColor?: 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange' | 'zinc';
  canvasX?: number;
  canvasY?: number;
  isPinned?: boolean;
  rotation?: number;
  checklist?: PlannerChecklistItem[];
  stickyType?: PlannerStickyType;
  comments?: PlannerComment[];
}

export interface PlannerChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface PlannerComment {
  id: string;
  text: string;
  createdAt: string;
  authorName?: string;
  authorPhoto?: string;
}

export type PlannerStickyType = 'task' | 'jira' | 'idea' | 'memo' | 'reminder';

export interface GoogleSheetMeeting {
  Tarih: string; // "YYYY-MM-DD" or similar format in CSV
  Saat: string;  // "HH:mm"
  Konu: string;
  BitisSaati?: string;
  Detay?: string;
}

export interface CalendarAlert {
  id?: string;
  userId: string;
  startDate: string;    // YYYY-MM-DD
  endDate: string;      // YYYY-MM-DD
  label: string;        // "İstanbul Yolculuğu" gibi
  color?: string;       // Varsayılan: '#ef4444' (kırmızı)
  isCompleted?: boolean; // Tamamlandı / Yapılmadı durumu
  createdAt?: Date | any;
}

