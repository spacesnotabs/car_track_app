// Default number of recent logs to average for "current" efficiency.
export const DEFAULT_EFFICIENCY_WINDOW = 5;

// Converts miles and gallons into a single fuel efficiency figure (MPG/mi per kWh).
// Returns null if inputs are invalid or would cause a divide-by-zero.
export const calculateFuelEfficiency = (miles, gallons) => {
    const distance = Number(miles);
    const fuelUsed = Number(gallons);

    if (!Number.isFinite(distance) || !Number.isFinite(fuelUsed) || fuelUsed <= 0 || distance < 0) {
        return null;
    }

    return Number((distance / fuelUsed).toFixed(1));
};

// Aggregate efficiency across the most recent logs (distance is taken directly from each log).
export const aggregateEfficiencyWindow = (logs = [], windowSize = DEFAULT_EFFICIENCY_WINDOW) => {
    if (!Array.isArray(logs) || logs.length === 0) {
        return { average: null, totalDistance: 0, totalFuel: 0, points: [] };
    }

    const normalizedWindow = Math.max(1, windowSize);
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const windowedLogs = sortedLogs.slice(-normalizedWindow);

    const points = [];
    let totalDistance = 0;
    let totalFuel = 0;

    for (const log of windowedLogs) {
        const distance = Number(log.odometer);
        const fuelUsed = Number(log.amount);

        if (Number.isFinite(distance) && Number.isFinite(fuelUsed) && fuelUsed > 0) {
            const efficiency = calculateFuelEfficiency(distance, fuelUsed);
            totalDistance += distance;
            totalFuel += fuelUsed;
            points.push({
                id: log.id,
                date: log.date,
                amount: fuelUsed,
                distance,
                efficiency
            });
        }
    }

    const average = calculateFuelEfficiency(totalDistance, totalFuel);

    return { average, totalDistance, totalFuel, points };
};
