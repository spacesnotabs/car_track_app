import { db, auth } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { aggregateEfficiencyWindow, DEFAULT_EFFICIENCY_WINDOW } from '../utils/fuelCalculations';

export const vehicleService = {
    // Add a new vehicle
    addVehicle: async (vehicleData) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            // Add default values for fields not yet collected
            const vehicleWithDefaults = {
                ...vehicleData,
                createdAt: new Date().toISOString(),
                // Default values for dashboard display
                image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800', // Generic car image
                status: 'On Track',
                odometer: 0,
                averageConsumption: 'N/A',
                fuelType: 'Gas', // Default, can be updated later
                nextService: 'None Scheduled',
                serviceProgress: 100,
                dueIn: 5000
            };

            // Store in user's subcollection: users/{userId}/vehicles
            const userVehiclesRef = collection(db, 'users', user.uid, 'vehicles');
            const docRef = await addDoc(userVehiclesRef, vehicleWithDefaults);
            return { id: docRef.id, ...vehicleWithDefaults };
        } catch (error) {
            console.error("Error adding vehicle: ", error);
            throw error;
        }
    },

    // Get all vehicles for the current user
    getVehicles: async () => {
        try {
            const user = auth.currentUser;
            if (!user) return []; // Return empty if not logged in

            // Get from user's subcollection: users/{userId}/vehicles
            const userVehiclesRef = collection(db, 'users', user.uid, 'vehicles');
            const querySnapshot = await getDocs(userVehiclesRef);

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error getting vehicles: ", error);
            throw error;
        }
    },

    // Delete a vehicle
    deleteVehicle: async (vehicleId) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            // Delete from user's subcollection
            const vehicleRef = doc(db, 'users', user.uid, 'vehicles', vehicleId);
            await deleteDoc(vehicleRef);
            return true;
        } catch (error) {
            console.error("Error deleting vehicle: ", error);
            throw error;
        }
    },

    // Update a vehicle
    updateVehicle: async (vehicleId, updates) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            // If odometer is being updated, set the timestamp
            const finalUpdates = { ...updates };
            if (updates.odometer !== undefined) {
                finalUpdates.odometerUpdatedAt = new Date().toISOString();
            }

            // Update in user's subcollection
            const vehicleRef = doc(db, 'users', user.uid, 'vehicles', vehicleId);
            await updateDoc(vehicleRef, finalUpdates);
            return true;
        } catch (error) {
            console.error("Error updating vehicle: ", error);
            throw error;
        }
    },

    // Add a fuel log
    addFuelLog: async (vehicleId, logData) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            const logsRef = collection(db, 'users', user.uid, 'vehicles', vehicleId, 'fuelLogs');
            const docRef = await addDoc(logsRef, {
                ...logData,
                createdAt: new Date().toISOString()
            });

            // Update vehicle odometer if the new log has a higher value AND is newer than the last manual update
            if (logData.odometer) {
                const vehicleRef = doc(db, 'users', user.uid, 'vehicles', vehicleId);

                try {
                    const vehicleSnap = await getDoc(vehicleRef);
                    if (vehicleSnap.exists()) {
                        const vehicleData = vehicleSnap.data();
                        const lastManualUpdate = vehicleData.odometerUpdatedAt ? new Date(vehicleData.odometerUpdatedAt) : new Date(0);
                        const logDate = new Date(logData.date);

                        // Only update if the log is newer than the last manual update AND the value is higher
                        // This prevents accidental rollbacks if a user adds a past log but forgets to change the date
                        const currentOdometer = vehicleData.odometer || 0;
                        if (logDate > lastManualUpdate && logData.odometer > currentOdometer) {
                            await updateDoc(vehicleRef, {
                                odometer: logData.odometer
                            });
                        }
                    }
                } catch (err) {
                    console.error("Error checking vehicle for odometer update:", err);
                }
            }

            return docRef.id;
        } catch (error) {
            console.error("Error adding fuel log: ", error);
            throw error;
        }
    },

    // Get fuel logs for a vehicle
    getFuelLogs: async (vehicleId) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            const logsRef = collection(db, 'users', user.uid, 'vehicles', vehicleId, 'fuelLogs');
            // Ideally we should order by date, but for now let's just get them all
            // In a real app, you'd want to use query(logsRef, orderBy('date', 'desc'))
            // but that requires creating an index in Firestore.
            const querySnapshot = await getDocs(logsRef);

            const logs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort in memory to avoid index requirement for now
            return logs.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error("Error getting fuel logs: ", error);
            throw error;
        }
    },

    // Update a fuel log
    updateFuelLog: async (vehicleId, logId, logData) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            const logRef = doc(db, 'users', user.uid, 'vehicles', vehicleId, 'fuelLogs', logId);
            await updateDoc(logRef, {
                ...logData,
                // Ensure date is ISO string if it was updated
                date: new Date(logData.date).toISOString()
            });
            return true;
        } catch (error) {
            console.error("Error updating fuel log: ", error);
            throw error;
        }
    },

    // Delete a fuel log
    deleteFuelLog: async (vehicleId, logId) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            const logRef = doc(db, 'users', user.uid, 'vehicles', vehicleId, 'fuelLogs', logId);
            await deleteDoc(logRef);
            return true;
        } catch (error) {
            console.error("Error deleting fuel log: ", error);
            throw error;
        }
    },

    // Calculate efficiency based on a rolling window of recent logs
    calculateEfficiency: (logs, windowSize = DEFAULT_EFFICIENCY_WINDOW) => {
        const { average } = aggregateEfficiencyWindow(logs, windowSize);
        return average;
    }
};
