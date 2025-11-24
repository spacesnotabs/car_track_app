import React, { useState, useEffect } from 'react';
import { vehicleService } from '../services/vehicleService';
import FuelEfficiencyChart from '../components/FuelEfficiencyChart';
import { aggregateEfficiencyWindow, DEFAULT_EFFICIENCY_WINDOW } from '../utils/fuelCalculations';
import { Car, Calendar, TrendingUp, Droplets, MapPin } from 'lucide-react';

const Analytics = () => {
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('all'); // 'all', 'year', '6months', '3months'

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const fetchedVehicles = await vehicleService.getVehicles();
                setVehicles(fetchedVehicles);
                if (fetchedVehicles.length > 0) {
                    setSelectedVehicleId(fetchedVehicles[0].id);
                }
            } catch (error) {
                console.error("Error fetching vehicles:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, []);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!selectedVehicleId) return;

            try {
                // Pull activity history and only keep Fuel entries so legacy fuelLogs calls still work
                const fetchedActivities = await vehicleService.getActivities(selectedVehicleId);
                const fuelLogs = fetchedActivities.filter((activity) => (activity.type || 'Fuel') === 'Fuel');

                // Normalize/guard required fields for the chart + downstream calculations
                const normalizedLogs = fuelLogs
                    .map((log) => ({
                        ...log,
                        date: log.date || log.createdAt || null,
                        amount: Number.isFinite(Number(log.amount)) ? Number(log.amount) : null,
                        odometer: Number.isFinite(Number(log.odometer)) ? Number(log.odometer) : null
                    }))
                    .filter((log) => log.date);

                // Sort logs by date ascending for the chart
                const sortedLogs = normalizedLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
                setLogs(sortedLogs);
            } catch (error) {
                console.error("Error fetching logs:", error);
            }
        };

        fetchLogs();
    }, [selectedVehicleId]);

    const processData = () => {
        if (!logs || logs.length < 1) return { chartData: [], stats: null };

        const toNumber = (value) => {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : null;
        };

        const getCutoffDate = (range) => {
            if (range === 'all') return null;
            const cutoff = new Date();
            if (range === 'year') {
                cutoff.setFullYear(cutoff.getFullYear() - 1);
            } else if (range === '6months') {
                cutoff.setMonth(cutoff.getMonth() - 6);
            } else if (range === '3months') {
                cutoff.setMonth(cutoff.getMonth() - 3);
            }
            return cutoff;
        };

        const cutoffDate = getCutoffDate(timeframe);
        const filteredLogs = cutoffDate
            ? logs.filter(item => new Date(item.date) >= cutoffDate)
            : logs;

        const { points, average, totalDistance, totalFuel } = aggregateEfficiencyWindow(filteredLogs, DEFAULT_EFFICIENCY_WINDOW);

        const finalChartData = points.map(point => ({
            id: point.id,
            date: point.date,
            amount: point.amount,
            efficiency: point.efficiency,
            distance: point.distance ? Number(point.distance.toFixed(1)) : 0,
            segmentFuelUsed: point.amount ? Number(point.amount.toFixed(3)) : null
        }));

        return {
            chartData: finalChartData,
            stats: {
                totalDistance: totalDistance.toFixed(1),
                totalFuel: totalFuel.toFixed(1),
                averageEfficiency: average !== null ? average.toFixed(1) : null
            }
        };
    };

    const { chartData, stats } = processData();

    if (loading) {
        return <div className="text-text-primary text-center mt-10">Loading analytics...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-text-primary">Analytics</h1>

                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Vehicle Selector */}
                    <div className="relative">
                        <select
                            value={selectedVehicleId}
                            onChange={(e) => setSelectedVehicleId(e.target.value)}
                            className="appearance-none bg-secondary border border-border text-text-primary py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent w-full sm:w-64"
                        >
                            {vehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
                            ))}
                            {vehicles.length === 0 && <option>No vehicles found</option>}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                            <Car size={16} />
                        </div>
                    </div>

                    {/* Timeframe Selector */}
                    <div className="relative">
                        <select
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value)}
                            className="appearance-none bg-secondary border border-border text-text-primary py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent w-full sm:w-48"
                        >
                            <option value="all">All Time</option>
                            <option value="year">Last Year</option>
                            <option value="6months">Last 6 Months</option>
                            <option value="3months">Last 3 Months</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                            <Calendar size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-accent-soft text-accent">
                                <TrendingUp size={20} />
                            </div>
                            <span className="text-text-secondary">Avg Efficiency</span>
                        </div>
                        <div className="text-2xl font-bold text-text-primary">
                            {stats.averageEfficiency ?? 'N/A'} <span className="text-sm font-normal text-text-secondary">MPG</span>
                        </div>
                    </div>
                    <div className="bg-card p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-success-soft text-success">
                                <MapPin size={20} />
                            </div>
                            <span className="text-text-secondary">Distance Tracked</span>
                        </div>
                        <div className="text-2xl font-bold text-text-primary">{stats.totalDistance} <span className="text-sm font-normal text-text-secondary">miles</span></div>
                    </div>
                    <div className="bg-card p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-warning-soft text-warning">
                                <Droplets size={20} />
                            </div>
                            <span className="text-text-secondary">Fuel Consumed</span>
                        </div>
                        <div className="text-2xl font-bold text-text-primary">{stats.totalFuel} <span className="text-sm font-normal text-text-secondary">gallons</span></div>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-xl font-semibold text-text-primary mb-6">Fuel Efficiency Trends</h2>
                <FuelEfficiencyChart
                    data={chartData}
                    average={stats && stats.averageEfficiency !== null ? parseFloat(stats.averageEfficiency) : null}
                />
            </div>
        </div>
    );
};

export default Analytics;
