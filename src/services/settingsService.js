import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const settingsService = {
    // Save user settings
    saveSettings: async (userId, settings) => {
        try {
            const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
            await setDoc(settingsRef, settings, { merge: true });
            return true;
        } catch (error) {
            console.error("Error saving settings: ", error);
            throw error;
        }
    },

    // Get user settings
    getSettings: async (userId) => {
        try {
            const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
            const docSnap = await getDoc(settingsRef);

            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error getting settings: ", error);
            throw error;
        }
    }
};
