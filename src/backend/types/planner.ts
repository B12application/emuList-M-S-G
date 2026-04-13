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
}

export interface GoogleSheetMeeting {
  Tarih: string; // "YYYY-MM-DD" or similar format in CSV
  Saat: string;  // "HH:mm"
  Konu: string;
  BitisSaati?: string;
  Detay?: string;
}
