import React, { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { vehicleService } from '../../services/vehicleService';

const ActivityModal = ({ isOpen, onClose, preSelectedVehicleId, onSave, initialData }) => {
    const [loading, setLoading] = useState(false);
    const [vehicles, setVehicles] = useState([]);

    // Core state
    const [type, setType] = useState('Fuel');

    // Form data
    const [formData, setFormData] = useState({
        vehicleId: '',
        date: '',
        odometer: '',
        totalCost: '',
        notes: ''
    });

    // Fuel specific
    const [fuelData, setFuelData] = useState({
        amount: '',
        pricePerUnit: ''
    });

    // Service specific
    const [serviceData, setServiceData] = useState({
        selectedServices: ['Oil Change'],
        customServiceType: ''
    });

    const SERVICE_TYPES = [
        'Oil Change',
        'Tire Rotation',
        'Inspection',
        'Battery Replacement',
        'Brake Service',
        'Coolant Flush',
        'Air Filter Replacement',
        'Other'
    ];

    useEffect(() => {
        if (isOpen) {
            fetchVehicles();
            initializeForm();
        }
    }, [isOpen, preSelectedVehicleId, initialData?.id]);

    const initializeForm = () => {
        const now = new Date();
        const defaultDate = (() => {
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        })();

        if (initialData) {
            setType(initialData.type || 'Fuel');
            setFormData({
                vehicleId: initialData.vehicleId || '',
                date: initialData.date ? new Date(initialData.date).toISOString().slice(0, 16) : defaultDate,
                odometer: initialData.odometer || '',
                totalCost: initialData.totalCost || '',
                notes: initialData.notes || ''
            });

            if (initialData.type === 'Fuel' || !initialData.type) {
                setFuelData({
                    amount: initialData.amount || '',
                    pricePerUnit: initialData.pricePerUnit || ''
                });
            } else if (initialData.type === 'Service') {
                const savedTypes = initialData.serviceTypes || (initialData.serviceType ? [initialData.serviceType] : []);
                const predefined = SERVICE_TYPES.filter(t => t !== 'Other');
                const standardSelected = savedTypes.filter(t => predefined.includes(t));
                const customTypes = savedTypes.filter(t => !predefined.includes(t));

                const selected = [...standardSelected];
                if (customTypes.length > 0) {
                    selected.push('Other');
                }

                setServiceData({
                    selectedServices: selected.length > 0 ? selected : ['Oil Change'],
                    customServiceType: customTypes.join(', ')
                });
            }
        } else {
            // New Entry
            setType('Fuel'); // Default to Fuel
            setFormData({
                vehicleId: preSelectedVehicleId || '',
                date: defaultDate,
                odometer: '',
                totalCost: '',
                notes: ''
            });
            setFuelData({ amount: '', pricePerUnit: '' });
            setServiceData({ selectedServices: ['Oil Change'], customServiceType: '' });
        }
    };

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

    const handleCommonChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFuelChange = (e) => {
        const { name, value } = e.target;
        setFuelData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-calculate total cost if price and amount are present
            if (newData.amount && newData.pricePerUnit) {
                const calculatedCost = (parseFloat(newData.amount) * parseFloat(newData.pricePerUnit)).toFixed(2);
                setFormData(prevForm => ({ ...prevForm, totalCost: calculatedCost }));
            }

            return newData;
        });
    };

    const handleServiceToggle = (type) => {
        setServiceData(prev => {
            const current = prev.selectedServices;
            if (current.includes(type)) {
                return { ...prev, selectedServices: current.filter(t => t !== type) };
            } else {
                return { ...prev, selectedServices: [...current, type] };
            }
        });
    };

    const handleCustomServiceChange = (e) => {
        setServiceData(prev => ({ ...prev, customServiceType: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Prepare payload
            let activityPayload = {
                date: new Date(formData.date).toISOString(),
                odometer: parseFloat(formData.odometer),
                totalCost: formData.totalCost ? parseFloat(formData.totalCost) : null,
                notes: formData.notes,
                type: type
            };

            if (type === 'Fuel') {
                // Look up the selected vehicle's fuelType
                const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
                activityPayload = {
                    ...activityPayload,
                    amount: parseFloat(fuelData.amount),
                    pricePerUnit: fuelData.pricePerUnit ? parseFloat(fuelData.pricePerUnit) : null,
                    fuelType: selectedVehicle && selectedVehicle.fuelType ? selectedVehicle.fuelType : 'Gas'
                };
            } else if (type === 'Service') {
                if (serviceData.selectedServices.length === 0) {
                    alert("Please select at least one service type.");
                    setLoading(false);
                    return;
                }

                const finalTypes = serviceData.selectedServices.filter(t => t !== 'Other');
                if (serviceData.selectedServices.includes('Other') && serviceData.customServiceType) {
                    finalTypes.push(serviceData.customServiceType);
                }

                activityPayload = {
                    ...activityPayload,
                    serviceTypes: finalTypes,
                    // Backward compatibility: store a string representation
                    serviceType: finalTypes.join(', ')
                };
            }

            if (initialData && initialData.id) {
                await vehicleService.updateActivity(formData.vehicleId, initialData.id, activityPayload);
            } else {
                await vehicleService.addActivity(formData.vehicleId, activityPayload);
            }

            onSave();
            onClose();
        } catch (error) {
            console.error("Error saving activity:", error);
            alert("Failed to save activity. Please try again.");
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
                    <h2 className="text-xl font-bold text-text-primary">
                        {initialData ? `Edit ${type} Log` : 'Add Activity'}
                    </h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <form id="activity-form" onSubmit={handleSubmit} className="space-y-4">

                        {/* Type Selection (only for new entries or if we allow switching types on edit, but usually sticking to existing type is better. Let's allow switching for now if not editing?) */}
                        {/* Actually, user might want to change type if they made a mistake. */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Activity Type</label>
                            <div className="flex gap-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="Fuel"
                                        checked={type === 'Fuel'}
                                        onChange={(e) => setType(e.target.value)}
                                        className="mr-2 accent-accent"
                                    />
                                    Fuel Log
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="Service"
                                        checked={type === 'Service'}
                                        onChange={(e) => setType(e.target.value)}
                                        className="mr-2 accent-accent"
                                    />
                                    Service
                                </label>
                            </div>
                        </div>

                        {/* Vehicle Selection */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Vehicle *</label>
                            <select
                                name="vehicleId"
                                value={formData.vehicleId}
                                onChange={handleCommonChange}
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
                                onChange={handleCommonChange}
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
                                onChange={handleCommonChange}
                                placeholder="e.g. 45000"
                                required
                                min="0"
                                step="0.1"
                                className="w-full bg-secondary border border-border text-text-primary rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                            />
                        </div>

                        {/* Conditional Fields based on Type */}
                        {type === 'Fuel' && (
                            <>
                                {/* Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Amount (Gallons/kWh) *</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={fuelData.amount}
                                        onChange={handleFuelChange}
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
                                                value={fuelData.pricePerUnit}
                                                onChange={handleFuelChange}
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
                                                onChange={handleCommonChange}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                className="w-full bg-secondary border border-border text-text-primary rounded-lg pl-7 pr-4 py-2.5 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {type === 'Service' && (
                            <>
                                {/* Service Types */}
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Service Types *</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {SERVICE_TYPES.map(t => (
                                            <label key={t} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-border hover:border-accent/50 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={serviceData.selectedServices.includes(t)}
                                                    onChange={() => handleServiceToggle(t)}
                                                    className="rounded border-border bg-secondary text-accent focus:ring-accent"
                                                />
                                                <span className="text-text-primary text-sm">{t}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {serviceData.selectedServices.length === 0 && (
                                        <p className="text-xs text-danger mt-1">Please select at least one service type.</p>
                                    )}
                                </div>

                                {/* Custom Service Type */}
                                {serviceData.selectedServices.includes('Other') && (
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Specify Service *</label>
                                        <input
                                            type="text"
                                            name="customServiceType"
                                            value={serviceData.customServiceType}
                                            onChange={handleCustomServiceChange}
                                            placeholder="e.g. Transmission Fluid Change"
                                            required
                                            className="w-full bg-secondary border border-border text-text-primary rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                                        />
                                    </div>
                                )}

                                {/* Total Cost */}
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Total Cost (Optional)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-text-secondary">$</span>
                                        <input
                                            type="number"
                                            name="totalCost"
                                            value={formData.totalCost}
                                            onChange={handleCommonChange}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            className="w-full bg-secondary border border-border text-text-primary rounded-lg pl-7 pr-4 py-2.5 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Notes (Optional)</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleCommonChange}
                                        placeholder="Add any details about the service..."
                                        rows="3"
                                        className="w-full bg-secondary border border-border text-text-primary rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-accent focus:border-transparent outline-none resize-none"
                                    />
                                </div>
                            </>
                        )}

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
                        form="activity-form"
                        disabled={loading}
                        className="px-6 py-2 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Activity
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityModal;
