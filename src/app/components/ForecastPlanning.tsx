import React from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import { ChartContainer } from './ChartContainer';

const forecastData = [
  { month: 'Jul', actual: 4000, forecast: 4200 },
  { month: 'Aug', actual: 3000, forecast: 3800 },
  { month: 'Sep', actual: 5000, forecast: 4500 },
  { month: 'Oct', actual: null, forecast: 4800 },
  { month: 'Nov', actual: null, forecast: 5100 },
  { month: 'Dec', actual: null, forecast: 6000 },
];

const trendData = [
  { month: 'Jan', failures: 2, replacements: 1 },
  { month: 'Feb', failures: 3, replacements: 2 },
  { month: 'Mar', failures: 1, replacements: 1 },
  { month: 'Apr', failures: 4, replacements: 4 },
  { month: 'May', failures: 2, replacements: 2 },
  { month: 'Jun', failures: 5, replacements: 3 },
];

export function ForecastPlanning() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400">
              <Lightbulb size={24} />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Optimization Opportunity</h4>
              <p className="text-slate-400 text-sm leading-relaxed">Consider bulk purchasing Hikvision cameras in Q4 to leverage end-of-year discounts (approx. 15% savings).</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Budget Surplus</h4>
              <p className="text-slate-400 text-sm leading-relaxed">Current spending is 8% below forecast. Recommended reallocation to preventive maintenance.</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-md">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-amber-500/20 rounded-lg text-amber-400">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Risk Alert</h4>
              <p className="text-slate-400 text-sm leading-relaxed">Storage costs rising due to 4K adoption. Forecast adjustment required for next quarter.</p>
            </div>
          </div>
        </div>
      </div>

      <ChartContainer title="Budget Forecast (Q3-Q4)" subtitle="Projected spending based on historical data" delay={0.2}>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={forecastData}>
            <defs>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Area type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorForecast)" name="Forecast" />
            <Area type="monotone" dataKey="actual" stroke="#06b6d4" fillOpacity={1} fill="url(#colorActual)" name="Actual" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      <ChartContainer title="Maintenance Trends" subtitle="Equipment failures vs Replacements" delay={0.3}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Line type="monotone" dataKey="failures" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4, fill: '#f43f5e' }} activeDot={{ r: 6 }} name="Failures" />
            <Line type="monotone" dataKey="replacements" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} name="Replacements" />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
