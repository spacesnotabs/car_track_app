import React, { useState, useEffect } from 'react';
import { Search, Filter, Fuel, Wrench, Edit2, Trash2, Loader2, Plus, Database } from 'lucide-react';
import { vehicleService } from '../services/vehicleService';
import ActivityModal from '../components/Dashboard/ActivityModal';

const Activities = () => {
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All'); // All, Fuel, Service

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState(null);

    const [migrating, setMigrating] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterActivities();
    }, [activities, searchTerm, filterType]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const vehicles = await vehicleService.getVehicles();

            let allLogs = [];
            await Promise.all(vehicles.map(async (vehicle) => {
                try {
                    const logs = await vehicleService.getActivities(vehicle.id);
                    const logsWithVehicle = logs.map(log => ({
                        ...log,
                        // Ensure type is set (defaults to Fuel if missing, though migration should fix this)
                        type: log.type || 'Fuel',
                        vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                        vehicleId: vehicle.id,
                        // Create a searchable string
                        searchString: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${log.type || 'Fuel'} ${log.serviceType || ''} ${log.serviceTypes ? log.serviceTypes.join(' ') : ''}`.toLowerCase()
                    }));
                    allLogs = [...allLogs, ...logsWithVehicle];
                } catch (err) {
                    console.error(`Failed to fetch logs for vehicle ${vehicle.id}`, err);
                }
            }));

            // Sort by date descending
            allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
            setActivities(allLogs);
        } catch (error) {
            console.error("Failed to fetch activities", error);
        } finally {
            setLoading(false);
        }
    };

    const filterActivities = () => {
        let result = activities;

        // Filter by Type
        if (filterType !== 'All') {
            result = result.filter(a => a.type === filterType);
        }

        // Filter by Search Term
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(a =>
                a.searchString.includes(lowerTerm) ||
                (a.type && a.type.toLowerCase().includes(lowerTerm)) ||
                (a.notes && a.notes.toLowerCase().includes(lowerTerm))
            );
        }

        setFilteredActivities(result);
    };

    const handleAdd = () => {
        setEditingActivity(null);
        setIsModalOpen(true);
    };

    const handleEdit = (activity) => {
        setEditingActivity(activity);
        setIsModalOpen(true);
    };

    const [deletingId, setDeletingId] = useState(null);
    const [selectedActivities, setSelectedActivities] = useState([]);
    const [bulkDeleting, setBulkDeleting] = useState(false);

    const handleDeleteClick = (id) => {
        if (deletingId === id) {
            // Already waiting for confirmation, this is the second click
            handleDeleteConfirm(id);
        } else {
            setDeletingId(id);
            // Auto-reset after 10 seconds if not confirmed
            setTimeout(() => setDeletingId(null), 10000);
        }
    };

    const handleDeleteConfirm = async (id) => {
        const activity = activities.find(a => a.id === id);
        if (!activity) return;

        try {
            await vehicleService.deleteActivity(activity.vehicleId, activity.id);
            setDeletingId(null);
            setSelectedActivities(prev => prev.filter(selectedId => selectedId !== id));
            fetchData(); // Refresh list
        } catch (error) {
            console.error("Failed to delete activity", error);
            alert("Failed to delete activity.");
        }
    };

    useEffect(() => {
        setSelectedActivities(prev =>
            prev.filter(id => activities.some(activity => activity.id === id))
        );
    }, [activities]);

    const toggleSelectActivity = (activityId) => {
        setSelectedActivities(prev =>
            prev.includes(activityId)
                ? prev.filter(id => id !== activityId)
                : [...prev, activityId]
        );
    };

    const toggleSelectAll = () => {
        const visibleIds = filteredActivities.map(activity => activity.id);
        const areAllSelected = visibleIds.length > 0 && visibleIds.every(id => selectedActivities.includes(id));

        setSelectedActivities(prev => {
            if (areAllSelected) {
                return prev.filter(id => !visibleIds.includes(id));
            }

            const updatedSelection = new Set(prev);
            visibleIds.forEach(id => updatedSelection.add(id));
            return Array.from(updatedSelection);
        });
    };

    const handleBulkDelete = async () => {
        if (!selectedActivities.length) return;

        const shouldDelete = window.confirm(`Delete ${selectedActivities.length} selected activit${selectedActivities.length === 1 ? 'y' : 'ies'}?`);
        if (!shouldDelete) return;

        try {
            setBulkDeleting(true);

            await Promise.all(
                selectedActivities.map(async (id) => {
                    const activity = activities.find(a => a.id === id);
                    if (!activity) return;
                    await vehicleService.deleteActivity(activity.vehicleId, activity.id);
                })
            );

            setSelectedActivities([]);
            fetchData();
        } catch (error) {
            console.error("Failed to delete selected activities", error);
            alert("Failed to delete selected activities.");
        } finally {
            setBulkDeleting(false);
        }
    };

    const handleMigration = async () => {
        if (!window.confirm("This will migrate your old Fuel Logs to the new Activities storage. Only do this once. Proceed?")) return;

        try {
            setMigrating(true);
            const count = await vehicleService.migrateFuelLogsToActivities();
            alert(`Migration complete! Moved ${count} logs.`);
            fetchData();
        } catch (error) {
            console.error("Migration failed", error);
            alert("Migration failed. Check console for details.");
        } finally {
            setMigrating(false);
        }
    };

    const formatOdometer = (value) => {
        if (value === null || value === undefined || value === '') {
            return 'Not recorded';
        }

        const numericValue = Number(value);
        if (Number.isNaN(numericValue)) {
            return value;
        }

        return `${numericValue.toLocaleString()} mi`;
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingActivity(null);
    };

    const handleModalSave = () => {
        fetchData();
    };

    const visibleActivityIds = filteredActivities.map(activity => activity.id);
    const allVisibleSelected = visibleActivityIds.length > 0 && visibleActivityIds.every(id => selectedActivities.includes(id));

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">Activities</h1>
                    <p className="text-text-secondary">View and manage your vehicle history.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleMigration}
                        disabled={migrating}
                        className="btn btn-ghost text-text-secondary hover:text-text-primary text-sm flex items-center gap-2"
                        title="Run this once to move old logs to new system"
                    >
                        {migrating ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
                        Migrate Data
                    </button>
                    <button
                        onClick={handleAdd}
                        className="btn btn-primary flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus size={20} />
                        Add Activity
                    </button>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search by vehicle, type, or notes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-secondary/50 border border-border text-text-primary px-4 py-2.5 pl-10 rounded-lg focus:outline-none focus:border-accent placeholder-text-secondary"
                    />
                    <Search className="absolute left-3 top-3 text-text-secondary" size={18} />
                </div>

                <div className="relative w-full md:w-48">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full bg-secondary/50 border border-border text-text-primary px-4 py-2.5 pl-10 rounded-lg focus:outline-none focus:border-accent appearance-none cursor-pointer"
                    >
                        <option value="All">All Activities</option>
                        <option value="Fuel">Fuel Logs</option>
                        <option value="Service">Service</option>
                    </select>
                    <Filter className="absolute left-3 top-3 text-text-secondary" size={18} />
                </div>

                <button
                    onClick={handleBulkDelete}
                    disabled={!selectedActivities.length || bulkDeleting}
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${selectedActivities.length
                        ? 'btn-danger hover:opacity-90'
                        : 'bg-secondary text-text-secondary cursor-not-allowed'
                        }`}
                >
                    <Trash2 size={16} className="mr-2" />
                    {bulkDeleting ? 'Deleting...' : `Delete Selected${selectedActivities.length ? ` (${selectedActivities.length})` : ''}`}
                </button>
            </div>

            {/* Activities List */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-accent" size={32} />
                    </div>
                ) : filteredActivities.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-secondary/30 text-text-secondary text-sm uppercase tracking-wider">
                                    <th className="p-4 font-medium w-12">
                                        <input
                                            type="checkbox"
                                            className="rounded border-border bg-secondary text-accent focus:ring-accent"
                                            checked={allVisibleSelected}
                                            onChange={toggleSelectAll}
                                            aria-label="Select all activities"
                                        />
                                    </th>
                                    <th className="p-4 font-medium w-16">Type</th>
                                    <th className="p-4 font-medium">Date</th>
                                    <th className="p-4 font-medium">Vehicle</th>
                                    <th className="p-4 font-medium">Details</th>
                                    <th className="p-4 font-medium text-right">Cost</th>
                                    <th className="p-4 font-medium text-right w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredActivities.map((activity) => (
                                    <tr key={activity.id} className="hover:bg-secondary/30 transition-colors group">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-border bg-secondary text-accent focus:ring-accent"
                                                checked={selectedActivities.includes(activity.id)}
                                                onChange={() => toggleSelectActivity(activity.id)}
                                                aria-label={`Select activity for ${activity.vehicleName}`}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'Fuel'
                                                    ? 'bg-accent/10 text-accent'
                                                    : 'bg-secondary text-text-secondary'
                                                }`}>
                                                {activity.type === 'Fuel' ? <Fuel size={16} /> : <Wrench size={16} />}
                                            </div>
                                        </td>
                                        <td className="p-4 text-text-secondary whitespace-nowrap">
                                            {new Date(activity.date).toLocaleDateString()}
                                            <div className="text-xs text-text-secondary/70">
                                                {new Date(activity.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </td>
                                        <td className="p-4 text-text-primary font-medium whitespace-nowrap">
                                            {activity.vehicleName}
                                        </td>
                                        <td className="p-4 text-text-secondary">
                                            {activity.type === 'Fuel' && (
                                                <div>
                                                    <span className="font-medium text-text-primary">
                                                        {activity.amount} {activity.fuelType === 'Electric' ? 'kWh' : 'gal'}
                                                    </span>
                                                    <span className="text-text-secondary mx-2">&middot;</span>
                                                    <span>
                                                        ${activity.pricePerUnit}/{activity.fuelType === 'Electric' ? 'kWh' : 'gal'}
                                                    </span>
                                                    <div className="text-text-secondary text-sm mt-1">
                                                        Odometer: {formatOdometer(activity.odometer)}
                                                    </div>
                                                </div>
                                            )}
                                            {activity.type === 'Service' && (
                                                <div>
                                                    <span className="font-medium text-text-primary">
                                                        {activity.serviceTypes ? activity.serviceTypes.join(', ') : activity.serviceType}
                                                    </span>
                                                    {activity.notes && (
                                                        <div className="text-text-secondary text-sm mt-1 line-clamp-1">
                                                            {activity.notes}
                                                        </div>
                                                    )}
                                                    <div className="text-text-secondary text-sm mt-1">
                                                        Odometer: {formatOdometer(activity.odometer)}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right text-text-primary font-medium whitespace-nowrap">
                                            {activity.totalCost ? `$${parseFloat(activity.totalCost).toFixed(2)}` : '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(activity)}
                                                    className="p-1.5 text-text-secondary hover:text-accent hover:bg-accent/10 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(activity.id)}
                                                    className={`p-1.5 rounded transition-colors flex items-center gap-1 ${deletingId === activity.id
                                                        ? 'btn-danger opacity-100 hover:opacity-90'
                                                        : 'text-text-secondary hover:text-danger hover:bg-danger-soft'
                                                        }`}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                    {deletingId === activity.id && <span className="text-xs font-bold">Confirm</span>}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-text-secondary mb-4">
                            <Search size={32} />
                        </div>
                        <h3 className="text-text-primary font-bold text-lg mb-2">No activities found</h3>
                        <p className="text-text-secondary max-w-sm">
                            Try adjusting your search or filter to find what you're looking for.
                        </p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <ActivityModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSave={handleModalSave}
                initialData={editingActivity}
                preSelectedVehicleId={editingActivity?.vehicleId}
            />
        </div>
    );
};

export default Activities;
