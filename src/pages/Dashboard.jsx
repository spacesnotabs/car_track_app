import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import VehicleCard from '../components/Dashboard/VehicleCard';
import AlertSection from '../components/Dashboard/AlertSection';
import ActivitySection from '../components/Dashboard/ActivitySection';
import ActivityModal from '../components/Dashboard/ActivityModal';
import { vehicleService } from '../services/vehicleService';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const Dashboard = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

    // Mock Data for other sections (to be connected later)
    const alerts = [
        { id: 1, type: 'Overdue', title: 'State Inspection', vehicle: '2021 Porsche Macan' },
        { id: 2, type: 'Upcoming', title: 'Insurance Renewal', vehicle: '2023 Tesla Model 3', days: 15 }
    ];

    const [activities, setActivities] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                fetchData();
            } else {
                setVehicles([]);
                setActivities([]);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Calculate current odometer based on manual setting + logs after that timestamp
    const calculateCurrentOdometer = (vehicle, logs) => {
        const manualOdometer = vehicle.odometer || 0;
        const manualUpdateTime = vehicle.odometerUpdatedAt ? new Date(vehicle.odometerUpdatedAt) : new Date(0);

        // Filter logs to only those AFTER the manual update
        const logsAfterManualUpdate = logs.filter(log => {
            const logDate = new Date(log.date);
            return logDate > manualUpdateTime && log.odometer;
        });

        // If no logs after manual update, return manual odometer
        if (logsAfterManualUpdate.length === 0) {
            return manualOdometer;
        }

        // Find the highest odometer value from logs after manual update
        const maxLogOdometer = Math.max(...logsAfterManualUpdate.map(log => parseFloat(log.odometer) || 0));

        // Return the greater of manual odometer or max log odometer
        return Math.max(manualOdometer, maxLogOdometer);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const vehiclesData = await vehicleService.getVehicles();

            // Fetch efficiency and logs for each vehicle
            let allLogs = [];
            const vehiclesWithStats = await Promise.all(vehiclesData.map(async (vehicle) => {
                try {
                    const logs = await vehicleService.getActivities(vehicle.id);

                    // Add vehicle info to logs for the activity feed
                    const logsWithVehicle = logs.map(log => ({
                        ...log,
                        vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                        vehicleId: vehicle.id
                    }));
                    allLogs = [...allLogs, ...logsWithVehicle];

                    const efficiency = vehicleService.calculateEfficiency(logs);
                    const currentOdometer = calculateCurrentOdometer(vehicle, logs);

                    return {
                        ...vehicle,
                        name: [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Unknown Vehicle',
                        currentOdometer,
                        averageConsumption: efficiency ? `${efficiency} ${vehicle.fuelType === 'Electric' ? 'mi/kWh' : 'MPG'}` : 'N/A'
                    };
                } catch (err) {
                    console.error(`Failed to fetch logs for vehicle ${vehicle.id}`, err);
                    return vehicle;
                }
            }));

            setVehicles(vehiclesWithStats);

            // Process logs for activity feed
            const recentActivities = allLogs
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 10)
                .map(log => {
                    let details = '';
                    let title = '';

                    if (log.type === 'Fuel') {
                        title = 'Fuel-up';
                        details = `${log.amount} ${log.fuelType === 'Electric' ? 'kWh' : 'gal'} at $${log.pricePerUnit || '-'}/${log.fuelType === 'Electric' ? 'kWh' : 'gal'}`;
                    } else {
                        title = log.serviceType || 'Service';
                        details = log.totalCost ? `$${log.totalCost.toFixed(2)}` : (log.notes || 'No details');
                    }

                    return {
                        id: log.id,
                        type: log.type || 'Fuel',
                        title: title,
                        vehicle: log.vehicleName,
                        details: details,
                        date: log.date
                    };
                });

            setActivities(recentActivities);

        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">My Garage</h1>
                    <p className="text-text-secondary">An overview of all your vehicles and recent activity.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsActivityModalOpen(true)}
                        className="btn btn-outline flex items-center gap-2 text-text-primary border-border hover:bg-secondary"
                    >
                        <Plus size={20} />
                        Add Activity
                    </button>
                </div>
            </div>

            <div className="mb-8">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Find a vehicle by name or model..."
                        className="w-full md:w-96 bg-secondary/50 border border-border text-text-primary px-4 py-3 pl-10 rounded-lg focus:outline-none focus:border-accent placeholder-text-secondary"
                    />
                    <div className="absolute left-3 top-3.5 text-text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-12">
                            <Loader2 className="animate-spin text-accent" size={32} />
                        </div>
                    ) : vehicles.length > 0 ? (
                        vehicles.map(vehicle => (
                            <VehicleCard key={vehicle.id} vehicle={vehicle} />
                        ))
                    ) : (
                        <div className="col-span-full border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-text-secondary mb-4">
                                <Plus size={32} />
                            </div>
                            <h3 className="text-text-primary font-bold text-lg mb-2">No vehicles found</h3>
                            <p className="text-text-secondary max-w-sm">
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

            <ActivityModal
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                onSave={fetchData}
            />
        </div>
    );
};

export default Dashboard;
