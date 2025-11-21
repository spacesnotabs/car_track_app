import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Car, Loader2 } from 'lucide-react';
import EditVehicleModal from '../components/ManageVehicles/EditVehicleModal';
import { vehicleService } from '../services/vehicleService';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const ManageVehicles = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    const [formData, setFormData] = useState({
        make: '',
        model: '',
        year: '',
        vin: ''
    });

    const [editingVehicle, setEditingVehicle] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Listen for auth state changes
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // VIN is now optional - only require make, model, and year
        if (!formData.make || !formData.model || !formData.year) return;
        if (!user) {
            alert("Please log in to add vehicles.");
            return;
        }

        try {
            const newVehicle = await vehicleService.addVehicle(formData);
            setVehicles([...vehicles, newVehicle]);
            setFormData({ make: '', model: '', year: '', vin: '' });
        } catch (error) {
            console.error("Error adding vehicle", error);
            alert("Failed to add vehicle. Please try again.");
        }
    };

    const handleClear = () => {
        setFormData({ make: '', model: '', year: '', vin: '' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this vehicle?")) return;

        try {
            await vehicleService.deleteVehicle(id);
            setVehicles(vehicles.filter(v => v.id !== id));
        } catch (error) {
            console.error("Error deleting vehicle", error);
            alert("Failed to delete vehicle.");
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-text-primary mb-2">Manage Your Vehicles</h1>
                <p className="text-text-secondary">Add, edit, or remove vehicles from your profile.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Add New Vehicle Form */}
                <div className="lg:col-span-4">
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-xl font-bold text-text-primary mb-6">Add a New Vehicle</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Make</label>
                                <input
                                    type="text"
                                    name="make"
                                    value={formData.make}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Toyota"
                                    className="w-full bg-secondary border border-border text-text-primary px-4 py-2.5 rounded-lg focus:outline-none focus:border-accent placeholder-text-secondary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Model</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={formData.model}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Camry"
                                    className="w-full bg-secondary border border-border text-text-primary px-4 py-2.5 rounded-lg focus:outline-none focus:border-accent placeholder-text-secondary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Year</label>
                                <select
                                    name="year"
                                    value={formData.year}
                                    onChange={handleInputChange}
                                    className="w-full bg-secondary border border-border text-text-primary px-4 py-2.5 rounded-lg focus:outline-none focus:border-accent text-text-secondary"
                                >
                                    <option value="">Select Year</option>
                                    {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">VIN <span className="text-text-secondary">(Optional)</span></label>
                                <input
                                    type="text"
                                    name="vin"
                                    value={formData.vin}
                                    onChange={handleInputChange}
                                    placeholder="Enter 17-digit VIN (optional)"
                                    className="w-full bg-secondary border border-border text-text-primary px-4 py-2.5 rounded-lg focus:outline-none focus:border-accent placeholder-text-secondary"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={!user}
                                    className="flex-1 btn btn-primary bg-accent hover:bg-accent-hover text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {user ? 'Add Vehicle' : 'Login to Add'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="flex-1 btn bg-secondary hover:bg-border text-text-primary py-2.5 rounded-lg font-medium transition-colors"
                                >
                                    Clear Form
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Current Vehicles List */}
                <div className="lg:col-span-8">
                    <h2 className="text-xl font-bold text-text-primary mb-6">Your Current Vehicles</h2>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {vehicles.map(vehicle => (
                                <div key={vehicle.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between group hover:border-border transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center text-accent">
                                            <Car size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-text-primary font-bold">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                                            <p className="text-text-secondary text-sm font-mono">VIN: {vehicle.vin || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingVehicle(vehicle);
                                                setIsEditModalOpen(true);
                                            }}
                                            className="p-2 text-text-secondary hover:text-text-primary hover:bg-secondary rounded-lg transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(vehicle.id)}
                                            className="p-2 text-text-secondary hover:text-danger hover:bg-secondary rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Empty State / Placeholder */}
                            {vehicles.length === 0 && (
                                <div className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-text-secondary mb-4">
                                        <Plus size={32} />
                                    </div>
                                    <h3 className="text-text-primary font-bold text-lg mb-2">No vehicles added yet</h3>
                                    <p className="text-text-secondary max-w-sm">
                                        {user
                                            ? "You haven't added any vehicles to your garage. Use the form on the left to get started and keep track of your cars."
                                            : "Please log in to view and manage your vehicles."
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <EditVehicleModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                vehicle={editingVehicle}
                onSave={fetchVehicles}
            />
        </div>
    );
};

export default ManageVehicles;
