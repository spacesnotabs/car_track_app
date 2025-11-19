import React from 'react';
import { CheckCircle, AlertTriangle, Gauge, Zap, Fuel } from 'lucide-react';

const VehicleCard = ({ vehicle }) => {
    const isDue = vehicle.status === 'Due Soon';

    return (
        <div className="card overflow-hidden border-slate-800 bg-slate-900 p-0 flex flex-col h-full hover:border-slate-700 transition-colors">
            <div className="h-48 relative">
                <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-white">{vehicle.name}</h3>
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${isDue ? 'text-yellow-500' : 'text-green-500'}`}>
                        {isDue ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                        <span>{vehicle.status}</span>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Gauge size={18} className="text-slate-500" />
                        <span>Odometer: <span className="text-slate-200">{vehicle.odometer.toLocaleString()} miles</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        {vehicle.fuelType === 'Electric' ? <Zap size={18} className="text-slate-500" /> : <Fuel size={18} className="text-slate-500" />}
                        <span>Avg: <span className="text-slate-200">{vehicle.averageConsumption}</span></span>
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="flex justify-between text-xs mb-2 font-medium">
                        <span className="text-slate-400">Next Service: {vehicle.nextService}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                        <div
                            className={`h-full rounded-full ${isDue ? 'bg-yellow-500' : 'bg-blue-500'}`}
                            style={{ width: `${vehicle.serviceProgress}%` }}
                        />
                    </div>
                    <div className="text-xs text-slate-500 mb-4">Due in {vehicle.dueIn} miles</div>

                    <button className="w-full btn btn-primary py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 border-none">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VehicleCard;
