import React, { useState, useEffect } from 'react';
import { X, Loader2, Save, Car } from 'lucide-react';
import { vehicleService } from '../../services/vehicleService';

const EditVehicleModal = ({ isOpen, onClose, vehicle, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        year: '',
        vin: '',
        odometer: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    useEffect(() => {
        if (vehicle) {
            setFormData({
                make: vehicle.make || '',
                model: vehicle.model || '',
                year: vehicle.year || '',
                vin: vehicle.vin || '',
                odometer: vehicle.odometer || 0
            });
            setImagePreview(vehicle.image || '');
            setImageFile(null);
        }
    }, [vehicle]);

    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updates = {
                make: formData.make,
                model: formData.model,
                year: parseInt(formData.year),
                vin: formData.vin,
                odometer: parseFloat(formData.odometer),
                imageFile
            };

            await vehicleService.updateVehicle(vehicle.id, updates);
            onSave();
            onClose();
        } catch (error) {
            console.error("Error updating vehicle:", error);
            alert("Failed to update vehicle. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-transparent z-10" onClick={onClose}></div>

            <div
                className="relative z-20 w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
                style={{ backgroundColor: 'var(--bg-card)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-xl font-bold text-text-primary">Edit Vehicle</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <form id="edit-vehicle-form" onSubmit={handleSubmit} className="space-y-4">

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Make</label>
                                <input
                                    type="text"
                                    name="make"
                                    value={formData.make}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-secondary border border-border text-text-primary rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Model</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={formData.model}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-secondary border border-border text-text-primary rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Year</label>
                            <select
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                required
                                className="w-full bg-secondary border border-border text-text-primary rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                            >
                                {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">VIN (Optional)</label>
                            <input
                                type="text"
                                name="vin"
                                value={formData.vin}
                                onChange={handleChange}
                                className="w-full bg-secondary border border-border text-text-primary rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Vehicle Photo</label>
                            <div className="flex items-start gap-3">
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary border border-border flex items-center justify-center text-text-secondary">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Vehicle preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Car size={20} />
                                    )}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setImageFile(file);
                                            setImagePreview(URL.createObjectURL(file));
                                        }}
                                        className="w-full text-sm text-text-secondary file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-border file:bg-secondary file:text-text-primary file:cursor-pointer"
                                    />
                                    <p className="text-xs text-text-secondary">
                                        Use your camera on mobile or pick a JPG, PNG, WEBP, HEIC/HEIF, or GIF.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-secondary rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="edit-vehicle-form"
                        disabled={loading}
                        className="px-6 py-2 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditVehicleModal;
