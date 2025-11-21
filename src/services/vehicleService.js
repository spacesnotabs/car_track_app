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

    // Add an activity (Fuel Log or Service)
    addActivity: async (vehicleId, activityData) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            const activitiesRef = collection(db, 'users', user.uid, 'vehicles', vehicleId, 'activities');
            const docRef = await addDoc(activitiesRef, {
                ...activityData,
                createdAt: new Date().toISOString()
            });

            // Update vehicle odometer if the new log has a higher value AND is newer than the last manual update
            if (activityData.odometer) {
                const vehicleRef = doc(db, 'users', user.uid, 'vehicles', vehicleId);

                try {
                    const vehicleSnap = await getDoc(vehicleRef);
                    if (vehicleSnap.exists()) {
                        const vehicleData = vehicleSnap.data();
                        const lastManualUpdate = vehicleData.odometerUpdatedAt ? new Date(vehicleData.odometerUpdatedAt) : new Date(0);
                        const activityDate = new Date(activityData.date);

                        // Only update if the log is newer than the last manual update AND the value is higher
                        const currentOdometer = vehicleData.odometer || 0;
                        if (activityDate > lastManualUpdate && activityData.odometer > currentOdometer) {
                            await updateDoc(vehicleRef, {
                                odometer: activityData.odometer
                            });
                        }
                    }
                } catch (err) {
                    console.error("Error checking vehicle for odometer update:", err);
                }
            }

            return docRef.id;
        } catch (error) {
            console.error("Error adding activity: ", error);
            throw error;
        }
    },

    // Get activities for a vehicle
    getActivities: async (vehicleId) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            const activitiesRef = collection(db, 'users', user.uid, 'vehicles', vehicleId, 'activities');
            const querySnapshot = await getDocs(activitiesRef);

            const activities = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort by date descending
            return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error("Error getting activities: ", error);
            throw error;
        }
    },

    // Update an activity
    updateActivity: async (vehicleId, activityId, activityData) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            const activityRef = doc(db, 'users', user.uid, 'vehicles', vehicleId, 'activities', activityId);
            await updateDoc(activityRef, {
                ...activityData,
                // Ensure date is ISO string if it was updated
                date: new Date(activityData.date).toISOString()
            });
            return true;
        } catch (error) {
            console.error("Error updating activity: ", error);
            throw error;
        }
    },

    // Delete an activity
    deleteActivity: async (vehicleId, activityId) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            const activityRef = doc(db, 'users', user.uid, 'vehicles', vehicleId, 'activities', activityId);
            await deleteDoc(activityRef);
            return true;
        } catch (error) {
            console.error("Error deleting activity: ", error);
            throw error;
        }
    },

    // Calculate efficiency based on a rolling window of recent logs (Fuel type only)
    calculateEfficiency: (activities, windowSize = DEFAULT_EFFICIENCY_WINDOW) => {
        const fuelLogs = activities.filter(a => a.type === 'Fuel');
        const { average } = aggregateEfficiencyWindow(fuelLogs, windowSize);
        return average;
    },

    // Migration function to move fuelLogs to activities
    migrateFuelLogsToActivities: async () => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            const vehiclesRef = collection(db, 'users', user.uid, 'vehicles');
            const vehiclesSnap = await getDocs(vehiclesRef);

            let count = 0;

            for (const vehicleDoc of vehiclesSnap.docs) {
                const vehicleId = vehicleDoc.id;
                const logsRef = collection(db, 'users', user.uid, 'vehicles', vehicleId, 'fuelLogs');
                const logsSnap = await getDocs(logsRef);

                if (logsSnap.empty) continue;

                const activitiesRef = collection(db, 'users', user.uid, 'vehicles', vehicleId, 'activities');

                // Phase 1: Copy all logs, collect successfully migrated log IDs
                const migratedLogIds = [];
                for (const logDoc of logsSnap.docs) {
                    const logData = logDoc.data();
                    try {
                        await addDoc(activitiesRef, {
                            ...logData,
                            type: 'Fuel', // All legacy logs are Fuel
                            migratedAt: new Date().toISOString()
                        });
                        migratedLogIds.push(logDoc.id);
                    } catch (err) {
                        console.error(`Failed to migrate log ${logDoc.id} for vehicle ${vehicleId}:`, err);
                        // Do not delete this log
                    }
                }

                // Phase 2: Delete only successfully migrated logs
                for (const logId of migratedLogIds) {
                    try {
                        await deleteDoc(doc(db, 'users', user.uid, 'vehicles', vehicleId, 'fuelLogs', logId));
                        count++;
                    } catch (err) {
                        console.error(`Failed to delete log ${logId} for vehicle ${vehicleId}:`, err);
                        // Optionally, record for retry
                    }
                }
            }

            console.log(`Migrated ${count} logs.`);
            return count;
        } catch (error) {
            console.error("Migration failed:", error);
            throw error;
        }
    }
};
