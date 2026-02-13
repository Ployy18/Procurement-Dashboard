import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Filter, ChevronDown, Download } from 'lucide-react';
import { ChartContainer } from './ChartContainer';

const categoryData = [
  { name: 'Equipment (HW)', value: 550000, color: '#6366f1' },
  { name: 'Software / Licenses', value: 120000, color: '#8b5cf6' },
  { name: 'Maintenance', value: 80000, color: '#ec4899' },
  { name: 'Services / Labor', value: 100000, color: '#06b6d4' },
];

const comparisonData = [
  { name: 'Cameras', budget: 4000, spend: 3800 },
  { name: 'Storage', budget: 3000, spend: 2800 },
  { name: 'Network', budget: 2000, spend: 2200 },
  { name: 'Cabling', budget: 1500, spend: 1200 },
  { name: 'Install', budget: 1800, spend: 1900 },
];

const items = [
  { id: 1, name: 'Hikvision 4K Dome Camera', category: 'Equipment', supplier: 'Hikvision', price: '$245.00', qty: 50, total: '$12,250' },
  { id: 2, name: 'NVR 64-Channel', category: 'Equipment', supplier: 'Dahua', price: '$1,200.00', qty: 5, total: '$6,000' },
  { id: 3, name: 'Cat6 Cable Roll (305m)', category: 'Cabling', supplier: 'Belden', price: '$120.00', qty: 20, total: '$2,400' },
  { id: 4, name: 'Annual Maintenance Contract', category: 'Maintenance', supplier: 'LocalService Co.', price: '$15,000.00', qty: 1, total: '$15,000' },
  { id: 5, name: 'Cisco Switch 48-Port PoE', category: 'Network', supplier: 'Cisco', price: '$2,800.00', qty: 4, total: '$11,200' },
];

export function CategoryAnalysis() {
  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-slate-900/50 backdrop-blur-md border border-slate-800 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center text-slate-400 mr-2">
            <Filter size={18} className="mr-2" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          {['Year: 2024', 'Supplier: All', 'Project: All'].map((filter, i) => (
            <button key={i} className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors border border-slate-700">
              <span>{filter}</span>
              <ChevronDown size={14} />
            </button>
          ))}
        </div>
        <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 text-sm hover:bg-indigo-600/30 transition-colors border border-indigo-500/30">
          <Download size={16} />
          <span>Export Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Budget Distribution" subtitle="By Category" delay={0.1}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Budget vs Spend" subtitle="Variance Analysis" delay={0.2}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip 
                cursor={{ fill: '#1e293b', opacity: 0.4 }}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Bar dataKey="budget" name="Allocated Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spend" name="Actual Spend" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Detailed Table */}
      <ChartContainer title="Itemized Expenses" subtitle="Detailed breakdown of recent purchases" delay={0.3}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-slate-800/50 text-slate-300">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Item Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 rounded-r-lg text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-300">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">{item.supplier}</td>
                  <td className="px-4 py-3 text-right">{item.price}</td>
                  <td className="px-4 py-3 text-center">{item.qty}</td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-medium">{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>
    </div>
  );
}
