import React from 'react';
import { AlertCircle, Bell } from 'lucide-react';

const AlertSection = ({ alerts }) => {
    return (
        <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Urgent Alerts</h2>
            <div className="space-y-4">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className={`p-4 rounded-lg border flex items-start gap-4 ${alert.type === 'Overdue'
                            ? 'bg-red-500/5 border-red-500/10'
                            : 'bg-yellow-500/5 border-yellow-500/10'
                            }`}
                    >
                        <div className={`p-2 rounded-full shrink-0 ${alert.type === 'Overdue' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                            }`}>
                            {alert.type === 'Overdue' ? <AlertCircle size={20} /> : <Bell size={20} />}
                        </div>
                        <div>
                            <h4 className={`font-bold text-sm mb-0.5 ${alert.type === 'Overdue' ? 'text-red-400' : 'text-yellow-400'
                                }`}>
                                {alert.type.toUpperCase()}: {alert.title}
                            </h4>
                            <p className="text-slate-400 text-sm">{alert.vehicle} {alert.days && <span className="text-slate-500">({alert.days} days)</span>}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AlertSection;
