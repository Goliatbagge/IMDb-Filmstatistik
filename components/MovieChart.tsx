import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '../types';

interface MovieChartProps {
  data: ChartDataPoint[];
  onBarClick: (data: any) => void;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-slate-700 border border-slate-600 rounded-md shadow-lg">
                <p className="label text-slate-200">{`År: ${label}`}</p>
                <p className="intro text-sky-400">{`Antal filmer: ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};


const MovieChart: React.FC<MovieChartProps> = ({ data, onBarClick }) => {
  return (
    <div className="w-full h-96 md:h-[500px] bg-slate-800 p-4 rounded-lg shadow-lg mt-8">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: -10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="year" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(71, 85, 105, 0.5)' }} />
          <Legend wrapperStyle={{ color: '#e2e8f0' }} />
          <Bar dataKey="count" name="Antal filmer" fill="#0ea5e9" cursor="pointer" onClick={(data) => onBarClick(data.payload)} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MovieChart;