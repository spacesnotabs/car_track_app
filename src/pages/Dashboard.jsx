import React, { useState, useEffect } from 'react';
import { Plus, Fuel, Loader2 } from 'lucide-react';
import VehicleCard from '../components/Dashboard/VehicleCard';
import AlertSection from '../components/Dashboard/AlertSection';
import ActivitySection from '../components/Dashboard/ActivitySection';
import { vehicleService } from '../services/vehicleService';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const Dashboard = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    // Mock Data for other sections (to be connected later)
    const alerts = [
        { id: 1, type: 'Overdue', title: 'State Inspection', vehicle: '2021 Porsche Macan' },
        { id: 2, type: 'Upcoming', title: 'Insurance Renewal', vehicle: '2023 Tesla Model 3', days: 15 }
    ];

    const activities = [
        { id: 1, type: 'Fuel', title: 'Latest Fuel-up', vehicle: 'Tesla Model 3', details: '48 kWh at $18.50' },
        { id: 2, type: 'Service', title: 'Recent Service', vehicle: 'Porsche Macan', details: 'Brake Fluid Flush' },
        { id: 3, type: 'Fuel', title: 'Latest Fuel-up', vehicle: 'Porsche Macan', details: '15.2 gal at $65.10' }
    ];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                fetchVehicles();
            } else {
                setVehicles([]);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const data = await vehicleService.getVehicles();
            setVehicles(data);
        } catch (error) {
            console.error("Failed to fetch vehicles", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Garage</h1>
                    <p className="text-slate-400">An overview of all your vehicles and recent activity.</p>
                </div>
                <div className="flex gap-3">

                    <button className="btn btn-outline flex items-center gap-2 text-white border-slate-600 hover:bg-slate-800">
                        <Fuel size={20} />
                        Add Fuel Log
                    </button>
                </div>
            </div>

            <div className="mb-8">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Find a vehicle by name or model..."
                        className="w-full md:w-96 bg-slate-800/50 border border-slate-700 text-white px-4 py-3 pl-10 rounded-lg focus:outline-none focus:border-blue-500 placeholder-slate-500"
                    />
                    <div className="absolute left-3 top-3.5 text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-12">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : vehicles.length > 0 ? (
                        vehicles.map(vehicle => (
                            <VehicleCard key={vehicle.id} vehicle={vehicle} />
                        ))
                    ) : (
                        <div className="col-span-full border-2 border-dashed border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-600 mb-4">
                                <Plus size={32} />
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2">No vehicles found</h3>
                            <p className="text-slate-500 max-w-sm">
                                {user
                                    ? "You haven't added any vehicles yet. Go to 'Manage Vehicles' to add your first car."
                                    : "Please log in to view your garage."
                                }
                            </p>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4">
                    <AlertSection alerts={alerts} />
                    <ActivitySection activities={activities} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
