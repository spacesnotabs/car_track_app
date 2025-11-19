import React from 'react';
import { Fuel, Wrench } from 'lucide-react';

const ActivitySection = ({ activities }) => {
    return (
        <div className="card border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-bold text-white mb-6">Recent Activity</h2>
            <div className="space-y-6">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 items-start">
                        <div className={`p-3 rounded-full h-fit shrink-0 ${activity.type === 'Fuel' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-800 text-slate-400'
                            }`}>
                            {activity.type === 'Fuel' ? <Fuel size={20} /> : <Wrench size={20} />}
                        </div>
                        <div>
                            <h4 className="font-medium text-white text-sm mb-0.5">{activity.title}</h4>
                            <p className="text-slate-400 text-sm">{activity.vehicle} - {activity.details}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivitySection;
