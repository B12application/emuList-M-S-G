import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../backend/config/firebaseConfig';
import { collection, query, where, getDocs, setDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export interface VehicleData {
  id?: string;
  userId: string;
  purchaseDate: string;
  purchaseKm: number;
  currentKm: number;
  lastMaintenanceDate: string;
  lastMaintenanceKm: number;
  maintenanceDetails: string;
  nextMaintenanceKm: number;
  insuranceDate: string;
  inspectionDate: string;
  mtvDate: string;
  mtvYear?: number;
  mtvPaid1?: boolean;
  mtvPaid2?: boolean;
  fuelCategory?: string;
  createdAt: number;
}

export interface MonthlyKmLog {
  id?: string;
  userId: string;
  month: string; // e.g. "2026-05"
  km: number;
  drivenKm?: number;
  fuelExpense?: number;
  costPerKm?: number;
  createdAt: number;
}

export interface MaintenanceRecord {
  id?: string;
  userId: string;
  partName: string;
  replacedKm: number;
  replacedDate: string;
  lifespanKm: number;
  lifespanMonths: number;
  createdAt: number;
}

const fetchVehicle = async (userId: string): Promise<VehicleData | null> => {
  const vehicleRef = collection(db, 'vehicles');
  const q = query(vehicleRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() } as VehicleData;
  }
  return null;
};

const fetchMonthlyLogs = async (userId: string): Promise<MonthlyKmLog[]> => {
  const logsRef = collection(db, 'vehicle_logs');
  const q = query(logsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as MonthlyKmLog))
    .sort((a, b) => b.month.localeCompare(a.month)); // newest first
};

const fetchMaintenanceRecords = async (userId: string): Promise<MaintenanceRecord[]> => {
  const recordsRef = collection(db, 'vehicle_maintenance');
  const q = query(recordsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceRecord))
    .sort((a, b) => b.createdAt - a.createdAt);
};

export default function useVehicle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
    queryKey: ['vehicle', user?.uid],
    queryFn: () => fetchVehicle(user!.uid),
    enabled: !!user?.uid,
  });

  const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['vehicle_logs', user?.uid],
    queryFn: () => fetchMonthlyLogs(user!.uid),
    enabled: !!user?.uid,
  });

  const { data: maintenanceRecords = [], isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ['vehicle_maintenance', user?.uid],
    queryFn: () => fetchMaintenanceRecords(user!.uid),
    enabled: !!user?.uid,
  });

  const saveVehicleMutation = useMutation({
    mutationFn: async (data: Partial<VehicleData>) => {
      if (!user) throw new Error('User not authenticated');

      const vehicleRef = collection(db, 'vehicles');
      const q = query(vehicleRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Update
        const existingDoc = snapshot.docs[0];
        await setDoc(doc(db, 'vehicles', existingDoc.id), { ...existingDoc.data(), ...data, userId: user.uid }, { merge: true });
      } else {
        // Create
        await addDoc(collection(db, 'vehicles'), { ...data, userId: user.uid, createdAt: Date.now() });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', user?.uid] });
    },
  });

  const addLogMutation = useMutation({
    mutationFn: async (log: Omit<MonthlyKmLog, 'id' | 'userId' | 'createdAt'>) => {
      if (!user) throw new Error('User not authenticated');

      // Check if log for this month exists
      const logsRef = collection(db, 'vehicle_logs');
      const q = query(logsRef, where('userId', '==', user.uid), where('month', '==', log.month));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Update existing log for the month
        const existingDoc = snapshot.docs[0];
        await setDoc(doc(db, 'vehicle_logs', existingDoc.id), { ...existingDoc.data(), ...log }, { merge: true });
      } else {
        // Create new log
        await addDoc(collection(db, 'vehicle_logs'), { ...log, userId: user.uid, createdAt: Date.now() });
      }

      // Also update vehicle currentKm if this log km is higher
      if (vehicle && log.km > vehicle.currentKm) {
        saveVehicleMutation.mutate({ currentKm: log.km });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle_logs', user?.uid] });
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      await deleteDoc(doc(db, 'vehicle_logs', logId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle_logs', user?.uid] });
    },
  });

  const addMaintenanceMutation = useMutation({
    mutationFn: async (record: Omit<MaintenanceRecord, 'id' | 'userId' | 'createdAt'>) => {
      if (!user) throw new Error('User not authenticated');
      await addDoc(collection(db, 'vehicle_maintenance'), { ...record, userId: user.uid, createdAt: Date.now() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle_maintenance', user?.uid] });
    },
  });

  const deleteMaintenanceMutation = useMutation({
    mutationFn: async (recordId: string) => {
      await deleteDoc(doc(db, 'vehicle_maintenance', recordId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle_maintenance', user?.uid] });
    },
  });

  return {
    vehicle,
    logs,
    maintenanceRecords,
    isLoading: isLoadingVehicle || isLoadingLogs || isLoadingMaintenance,
    saveVehicle: saveVehicleMutation.mutateAsync,
    addLog: addLogMutation.mutateAsync,
    deleteLog: deleteLogMutation.mutateAsync,
    addMaintenanceRecord: addMaintenanceMutation.mutateAsync,
    deleteMaintenanceRecord: deleteMaintenanceMutation.mutateAsync,
    isSaving: saveVehicleMutation.isPending,
  };
}
