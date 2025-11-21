import React from 'react';
import { AlertCircle, Bell } from 'lucide-react';

const AlertSection = ({ alerts }) => {
    return (
        <div className="mb-8">
            <h2 className="text-lg font-bold text-text-primary mb-4">Urgent Alerts</h2>
            <div className="bg-card border border-border rounded-lg p-8 text-center">
                <p className="text-text-secondary text-lg">Coming soon!</p>
            </div>
        </div>
    );
};

export default AlertSection;
