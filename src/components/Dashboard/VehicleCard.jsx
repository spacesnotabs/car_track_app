import React from 'react';
import { CheckCircle, AlertTriangle, Zap, Fuel } from 'lucide-react';

const VehicleCard = ({ vehicle }) => {
    const isDue = vehicle.status === 'Due Soon';

    return (
        <div className="card overflow-hidden border-border bg-card p-0 flex flex-col h-full hover:border-border transition-colors">
            <div className="h-48 relative">
                <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-text-primary">{vehicle.name}</h3>
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${isDue ? 'text-warning' : 'text-success'}`}>
                        {isDue ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                        <span>{vehicle.status}</span>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-text-secondary text-sm">
                        {vehicle.fuelType === 'Electric' ? <Zap size={18} className="text-text-secondary" /> : <Fuel size={18} className="text-text-secondary" />}
                        <span>Avg: <span className="text-text-secondary">{vehicle.averageConsumption}</span></span>
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="flex justify-between text-xs mb-2 font-medium">
                        <span className="text-text-secondary">Next Service: {vehicle.nextService}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
                        <div
                            className={`h-full rounded-full ${isDue ? 'bg-warning' : 'bg-accent'}`}
                            style={{ width: `${vehicle.serviceProgress}%` }}
                        />
                    </div>
                    <div className="text-xs text-text-secondary mb-4">Due in {vehicle.dueIn} miles</div>

                    <button className="w-full btn btn-primary py-2.5 text-sm font-medium bg-accent hover:bg-accent-hover border-none">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VehicleCard;
