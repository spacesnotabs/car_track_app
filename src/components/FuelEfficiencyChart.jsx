import React from 'react';
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

const FuelEfficiencyChart = ({ data, average }) => {
    const formatDate = (value) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;

        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
        });
    };

    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-text-secondary border border-border rounded-lg bg-secondary/50">
                No data available for the selected timeframe
            </div>
        );
    }

    return (
        <div className="w-full bg-card p-4 rounded-xl border border-border h-[320px] sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={data}
                    margin={{
                        top: 16,
                        right: 16,
                        left: 12,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis
                        dataKey="date"
                        stroke="var(--text-secondary)"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        minTickGap={12}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--border-color)' }}
                        tickFormatter={formatDate}
                    />
                    <YAxis
                        yAxisId="left"
                        stroke="var(--text-secondary)"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--border-color)' }}
                        width={44}
                        label={{ value: 'MPG', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 12 }}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="var(--text-secondary)"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--border-color)' }}
                        width={52}
                        label={{ value: 'Gallons', angle: 90, position: 'insideRight', fill: 'var(--text-secondary)', fontSize: 12 }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        labelStyle={{ color: 'var(--text-secondary)' }}
                        labelFormatter={formatDate}
                        formatter={(value, name) => {
                            if (name === 'Fuel Efficiency') return [parseFloat(value).toFixed(1), 'MPG'];
                            if (name === 'Fuel Added') return [parseFloat(value).toFixed(1), 'Gal'];
                            return [value, name];
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar
                        yAxisId="right"
                        dataKey="amount"
                        name="Fuel Added"
                        fill="var(--accent-primary)"
                        opacity={0.6}
                        barSize={20}
                    />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="efficiency"
                        name="Fuel Efficiency"
                        stroke="var(--success)"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                        connectNulls={true}
                    />
                    {average && (
                        <ReferenceLine
                            yAxisId="left"
                            y={average}
                            label={{ value: 'Avg MPG', fill: 'var(--success)', position: 'insideTopLeft', fontSize: 12 }}
                            stroke="var(--success)"
                            strokeDasharray="3 3"
                        />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default FuelEfficiencyChart;
