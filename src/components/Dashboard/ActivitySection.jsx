import React from 'react';
import { Fuel, Wrench } from 'lucide-react';

const ActivitySection = ({ activities }) => {
    return (
        <div className="card border-border bg-card p-6">
            <h2 className="text-lg font-bold text-text-primary mb-6">Recent Activity</h2>
            <div className="space-y-6">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 items-start">
                        <div className={`p-3 rounded-full h-fit shrink-0 ${activity.type === 'Fuel' ? 'bg-accent/10 text-accent' : 'bg-secondary text-text-secondary'
                            }`}>
                            {activity.type === 'Fuel' ? <Fuel size={20} /> : <Wrench size={20} />}
                        </div>
                        <div>
                            <h4 className="font-medium text-text-primary text-sm mb-0.5">{activity.title}</h4>
                            <p className="text-text-secondary text-sm">{activity.vehicle} - {activity.details}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivitySection;
