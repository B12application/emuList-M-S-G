import { useMemo } from 'react';
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
  purchasePrice?: number;
  lastMaintenanceDate?: string;
  lastMaintenanceKm?: number;
  maintenanceDetails?: string;
  nextMaintenanceKm?: number;
  insuranceDate?: string;
  inspectionDate?: string;
  cascoDate?: string;
  mtvDate?: string;
  mtvYear?: number;
  mtvPaid1?: boolean;
  mtvPaid2?: boolean;
  fuelCategory?: string;
  licensePlate?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  bodyType?: string;
  engine?: string;
  transmission?: string;
  fuelType?: string;
  tireSummerBrand?: string;
  tireSummerYear?: number;
  tireSummerPurchaseDate?: string;
  tireWinterBrand?: string;
  tireWinterYear?: number;
  tireWinterPurchaseDate?: string;
  tireLastChangeDate?: string;
  tireLastChangeKm?: number;
  tireSummerTotalKm?: number;
  tireWinterTotalKm?: number;
  tireHistory?: Array<{ type: 'summer' | 'winter' | 'purchase', date: string, km: number, brand?: string, note?: string }>;
  tramerAmount?: number;
  damageHistory?: string;
  carBodyStatus?: Record<string, 'original' | 'painted' | 'changed'>;
  imageUrl1?: string;
  imageUrl2?: string;
  imagePosition1?: string; // CSS object-position e.g. 'center center', 'top center', 'bottom center'
  imagePosition2?: string;
  imageScale1?: number;
  imageScale2?: number;
  createdAt: number;
  updatedAt?: number;

  // Satış ve geçmiş araç bilgileri
  status?: 'active' | 'sold';
  soldDate?: string;
  soldKm?: number;
  soldPrice?: number;
  soldNote?: string;
}

export interface MonthlyKmLog {
  id?: string;
  userId: string;
  vehicleId?: string;
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
  vehicleId?: string;
  partName: string;
  replacedKm: number;
  replacedDate: string;
  lifespanKm: number;
  lifespanMonths: number;
  createdAt: number;
}

export interface SellAndReplacePayload {
  soldVehicleId?: string;
  soldData: {
    soldDate: string;
    soldKm: number;
    soldPrice: number;
    soldNote?: string;
  };
  newVehicleData: Partial<VehicleData>;
}

const fetchAllVehicles = async (userId: string): Promise<VehicleData[]> => {
  const vehicleRef = collection(db, 'vehicles');
  const q = query(vehicleRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as VehicleData));
};

const fetchMonthlyLogs = async (userId: string): Promise<MonthlyKmLog[]> => {
  const logsRef = collection(db, 'vehicle_logs');
  const q = query(logsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as MonthlyKmLog))
    .sort((a, b) => b.month.localeCompare(a.month)); // newest first
};

const fetchMaintenanceRecords = async (userId: string): Promise<MaintenanceRecord[]> => {
  const recordsRef = collection(db, 'vehicle_maintenance');
  const q = query(recordsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as MaintenanceRecord))
    .sort((a, b) => b.createdAt - a.createdAt);
};

export default function useVehicle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: allVehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['vehicles', user?.uid],
    queryFn: () => fetchAllVehicles(user!.uid),
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

  // Active vehicle: first with status === 'active', or status !== 'sold', or first doc
  const vehicle = useMemo(() => {
    return allVehicles.find(v => v.status === 'active') ||
           allVehicles.find(v => v.status !== 'sold') ||
           allVehicles[0] ||
           null;
  }, [allVehicles]);

  // Past / sold vehicles list
  const pastVehicles = useMemo(() => {
    return allVehicles
      .filter(v => v.status === 'sold')
      .sort((a, b) => (b.soldDate || '').localeCompare(a.soldDate || '') || (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [allVehicles]);

  const saveVehicleMutation = useMutation({
    mutationFn: async (data: Partial<VehicleData>) => {
      if (!user) throw new Error('User not authenticated');

      const targetId = data.id || vehicle?.id;
      if (targetId) {
        // Update existing active vehicle
        await setDoc(doc(db, 'vehicles', targetId), {
          ...data,
          userId: user.uid,
          updatedAt: Date.now()
        }, { merge: true });
      } else {
        // Create new active vehicle
        await addDoc(collection(db, 'vehicles'), {
          ...data,
          userId: user.uid,
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', user?.uid] });
    },
  });

  const sellAndReplaceMutation = useMutation({
    mutationFn: async (payload: SellAndReplacePayload) => {
      if (!user) throw new Error('User not authenticated');

      // 1. Mark existing vehicle as sold if specified
      if (payload.soldVehicleId) {
        await setDoc(
          doc(db, 'vehicles', payload.soldVehicleId),
          {
            status: 'sold',
            soldDate: payload.soldData.soldDate,
            soldKm: Number(payload.soldData.soldKm) || 0,
            soldPrice: Number(payload.soldData.soldPrice) || 0,
            soldNote: payload.soldData.soldNote || '',
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      }

      // 2. Add newly bought vehicle as active
      await addDoc(collection(db, 'vehicles'), {
        ...payload.newVehicleData,
        userId: user.uid,
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', user?.uid] });
    },
  });

  const reactivateVehicleMutation = useMutation({
    mutationFn: async (targetId: string) => {
      if (!user) throw new Error('User not authenticated');

      for (const v of allVehicles) {
        if (v.id === targetId) {
          await setDoc(doc(db, 'vehicles', v.id), { status: 'active', updatedAt: Date.now() }, { merge: true });
        } else if (v.status !== 'sold' && v.id) {
          await setDoc(doc(db, 'vehicles', v.id), { status: 'sold', updatedAt: Date.now() }, { merge: true });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', user?.uid] });
    },
  });

  const deletePastVehicleMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      await deleteDoc(doc(db, 'vehicles', vehicleId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', user?.uid] });
    },
  });

  const addLogMutation = useMutation({
    mutationFn: async (log: Omit<MonthlyKmLog, 'id' | 'userId' | 'createdAt'>) => {
      if (!user) throw new Error('User not authenticated');

      // Check if log for this month exists for this vehicle
      const logsRef = collection(db, 'vehicle_logs');
      const q = log.vehicleId
        ? query(logsRef, where('userId', '==', user.uid), where('month', '==', log.month), where('vehicleId', '==', log.vehicleId))
        : query(logsRef, where('userId', '==', user.uid), where('month', '==', log.month));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Update existing log for the month
        const existingDoc = snapshot.docs[0];
        await setDoc(
          doc(db, 'vehicle_logs', existingDoc.id),
          { ...existingDoc.data(), ...log, userId: user.uid },
          { merge: true }
        );
      } else {
        // Create new log
        await addDoc(collection(db, 'vehicle_logs'), { ...log, userId: user.uid, createdAt: Date.now() });
      }

      // Also update vehicle currentKm if this log km is higher
      const targetVehicle = (log.vehicleId ? allVehicles.find(v => v.id === log.vehicleId) : null) || vehicle;
      if (targetVehicle && log.km > targetVehicle.currentKm) {
        await saveVehicleMutation.mutateAsync({ id: targetVehicle.id, currentKm: log.km });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle_logs', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', user?.uid] });
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
    pastVehicles,
    allVehicles,
    logs,
    maintenanceRecords,
    isLoading: isLoadingVehicles || isLoadingLogs || isLoadingMaintenance,
    saveVehicle: saveVehicleMutation.mutateAsync,
    sellAndReplaceVehicle: sellAndReplaceMutation.mutateAsync,
    reactivateVehicle: reactivateVehicleMutation.mutateAsync,
    deletePastVehicle: deletePastVehicleMutation.mutateAsync,
    addLog: addLogMutation.mutateAsync,
    deleteLog: deleteLogMutation.mutateAsync,
    addMaintenanceRecord: addMaintenanceMutation.mutateAsync,
    deleteMaintenanceRecord: deleteMaintenanceMutation.mutateAsync,
    isSaving: saveVehicleMutation.isPending || sellAndReplaceMutation.isPending,
  };
}
