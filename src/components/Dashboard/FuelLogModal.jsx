import React, { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { vehicleService } from '../../services/vehicleService';

const FuelLogModal = ({ isOpen, onClose, preSelectedVehicleId, onSave, initialData }) => {
    const [loading, setLoading] = useState(false);
    const [vehicles, setVehicles] = useState([]);
    const [formData, setFormData] = useState({
        vehicleId: preSelectedVehicleId || '',
        date: (() => {
            const now = new Date();
            // Adjust to local time for datetime-local input
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        })(),
        odometer: '',
        amount: '',
        pricePerUnit: '',
        totalCost: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchVehicles();
            if (initialData) {
                setFormData({
                    vehicleId: initialData.vehicleId || '',
                    date: initialData.date ? new Date(initialData.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
                    odometer: initialData.odometer || '',
                    amount: initialData.amount || '',
                    pricePerUnit: initialData.pricePerUnit || '',
                    totalCost: initialData.totalCost || ''
                });
            } else {
                // Reset form when opening for new entry
                setFormData(prev => ({
                    ...prev,
                    vehicleId: preSelectedVehicleId || prev.vehicleId,
                    date: (() => {
                        const now = new Date();
                        const year = now.getFullYear();
                        const month = String(now.getMonth() + 1).padStart(2, '0');
                        const day = String(now.getDate()).padStart(2, '0');
                        const hours = String(now.getHours()).padStart(2, '0');
                        const minutes = String(now.getMinutes()).padStart(2, '0');
                        return `${year}-${month}-${day}T${hours}:${minutes}`;
                    })(),
                    odometer: '',
                    amount: '',
                    pricePerUnit: '',
                    totalCost: ''
                }));
            }
        }
    }, [isOpen, preSelectedVehicleId, initialData]);

    const fetchVehicles = async () => {
        try {
            const data = await vehicleService.getVehicles();
            setVehicles(data);
            // If only one vehicle and none selected, select it
            if (data.length === 1 && !formData.vehicleId) {
                setFormData(prev => ({ ...prev, vehicleId: data[0].id }));
            }
        } catch (error) {
            console.error("Failed to fetch vehicles", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-calculate total cost if price and amount are present
            if ((name === 'amount' || name === 'pricePerUnit') && newData.amount && newData.pricePerUnit) {
                newData.totalCost = (parseFloat(newData.amount) * parseFloat(newData.pricePerUnit)).toFixed(2);
            }

            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const logData = {
                ...formData,
                date: new Date(formData.date).toISOString(),
                odometer: parseFloat(formData.odometer),
                amount: parseFloat(formData.amount),
                pricePerUnit: formData.pricePerUnit ? parseFloat(formData.pricePerUnit) : null,
                totalCost: formData.totalCost ? parseFloat(formData.totalCost) : null
            };

            if (initialData && initialData.id) {
                await vehicleService.updateFuelLog(formData.vehicleId, initialData.id, logData);
            } else {
                await vehicleService.addFuelLog(formData.vehicleId, logData);
            }

            onSave();
            onClose();
        } catch (error) {
            console.error("Error saving fuel log:", error);
            alert("Failed to save fuel log. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-xl font-bold text-text-primary">{initialData ? 'Edit Fuel Log' : 'Log Fuel'}</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <form id="fuel-log-form" onSubmit={handleSubmit} className="space-y-4">

                        {/* Vehicle Selection */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Vehicle *</label>
                            <select
                                name="vehicleId"
                                value={formData.vehicleId}
                                onChange={handleChange}
                                required
                                className="w-full bg-secondary border border-border text-text-primary rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                            >
                                <option value="">Select a vehicle</option>
                                {vehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Date *</label>
                            <input
                                type="datetime-local"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                className="w-full bg-secondary border border-border text-text-primary rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                            />
                        </div>

                        {/* Odometer */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Odometer (mi) *</label>
                            <input
                                type="number"
                                name="odometer"
                                value={formData.odometer}
                                onChange={handleChange}
                                placeholder="e.g. 45000"
                                required
                                min="0"
                                step="0.1"
                                className="w-full bg-secondary border border-border text-text-primary rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                            />
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Amount (Gallons/kWh) *</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="e.g. 12.5"
                                required
                                min="0.1"
                                step="0.001"
                                className="w-full bg-secondary border border-border text-text-primary rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Price per Unit */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Price / Unit (Optional)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-text-secondary">$</span>
                                    <input
                                        type="number"
                                        name="pricePerUnit"
                                        value={formData.pricePerUnit}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.001"
                                        className="w-full bg-secondary border border-border text-text-primary rounded-lg pl-7 pr-4 py-2.5 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            {/* Total Cost */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Total Cost (Optional)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-text-secondary">$</span>
                                    <input
                                        type="number"
                                        name="totalCost"
                                        value={formData.totalCost}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        className="w-full bg-secondary border border-border text-text-primary rounded-lg pl-7 pr-4 py-2.5 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                                    />
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
                        form="fuel-log-form"
                        disabled={loading}
                        className="px-6 py-2 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Log
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FuelLogModal;
