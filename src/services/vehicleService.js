import { db, auth } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

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

            // Update in user's subcollection
            const vehicleRef = doc(db, 'users', user.uid, 'vehicles', vehicleId);
            await updateDoc(vehicleRef, updates);
            return true;
        } catch (error) {
            console.error("Error updating vehicle: ", error);
            throw error;
        }
    }
};
