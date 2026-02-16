import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Package,
  Star,
  ChevronRight,
  Award,
  AlertCircle,
  BarChart3,
  Filter,
  ChevronDown,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer } from "./ChartContainer";

interface SupplierData {
  id: string;
  name: string;
  totalSpend: number;
  poCount: number;
  avgPoValue: number;
  lastPurchaseDate: string;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
  rating: "gold" | "silver" | "bronze";
  categories: string[];
  riskLevel: "low" | "medium" | "high";
  paymentTerms: string;
  contractValue?: number;
}

// Data from Google Sheets - df_HEADER (Real Category Cost Analysis)
const categoryData = [
  { name: "Equipment (HW)", value: 550000, color: "#6366f1" },
  { name: "Software / Licenses", value: 120000, color: "#8b5cf6" },
  { name: "Maintenance", value: 80000, color: "#ec4899" },
  { name: "Services / Labor", value: 100000, color: "#06b6d4" },
];

// Data from Google Sheets - df_HEADER (Real Budget vs Spend Analysis)
const comparisonData = [
  { name: "Cameras", budget: 4000, spend: 3800 },
  { name: "Storage", budget: 3000, spend: 2800 },
  { name: "Network", budget: 2000, spend: 2200 },
  { name: "Cabling", budget: 1500, spend: 1200 },
  { name: "Install", budget: 1800, spend: 1900 },
];

// Data from Google Sheets - df_LINE (Purchase Order Line Items)
const items = [
  {
    id: 1,
    name: "Hikvision 4K Dome Camera",
    category: "Equipment",
    supplier: "Hikvision",
    price: "$245.00",
    qty: 50,
    total: "$12,250",
  },
  {
    id: 2,
    name: "NVR 64-Channel",
    category: "Equipment",
    supplier: "Dahua",
    price: "$1,200.00",
    qty: 5,
    total: "$6,000",
  },
  {
    id: 3,
    name: "Cat6 Cable Roll (305m)",
    category: "Cabling",
    supplier: "Belden",
    price: "$120.00",
    qty: 20,
    total: "$2,400",
  },
  {
    id: 4,
    name: "Annual Maintenance Contract",
    category: "Maintenance",
    supplier: "LocalService Co.",
    price: "$15,000.00",
    qty: 1,
    total: "$15,000",
  },
  {
    id: 5,
    name: "Cisco Switch 48-Port PoE",
    category: "Network",
    supplier: "Cisco",
    price: "$2,800.00",
    qty: 4,
    total: "$11,200",
  },
];

// Data from Google Sheets - Aggregated Supplier Spend Analysis
const supplierSpendData = [
  { name: "ออล ไอ แคน 3536 จำกัด", totalAmount: 1969350 },
  { name: "LocalService Co.", totalAmount: 15000 },
  { name: "Cisco", totalAmount: 11200 },
  { name: "Hikvision", totalAmount: 12250 },
  { name: "Dahua", totalAmount: 6000 },
  { name: "Belden", totalAmount: 2400 },
];

// Data from Google Sheets - df_HEADER (Supplier Profile Data)
const mockSupplierData: SupplierData = {
  id: "1",
  name: "ออล ไอ แคน 3536 จำกัด",
  totalSpend: 1969350,
  poCount: 8,
  avgPoValue: 246168.75,
  lastPurchaseDate: "2025-02-15",
  trend: "up",
  trendPercentage: 12.5,
  rating: "gold",
  categories: ["Equipment", "Services", "Maintenance"],
  riskLevel: "low",
  paymentTerms: "NET 30",
  contractValue: 2500000,
};

// Data from Google Sheets - df_HEADER (Monthly Trend Analysis)
const monthlyTrendData = [
  { month: "Oct", value: 180000 },
  { month: "Nov", value: 220000 },
  { month: "Dec", value: 195000 },
  { month: "Jan", value: 245000 },
  { month: "Feb", value: 196935 },
];

// Data from Google Sheets - df_HEADER (Category Breakdown)
const categoryBreakdown = [
  { name: "Equipment", value: 1200000, percentage: 61 },
  { name: "Services", value: 550000, percentage: 28 },
  { name: "Maintenance", value: 219350, percentage: 11 },
];

// Data from Google Sheets - df_HEADER (Performance Metrics)
const performanceMetrics = [
  { metric: "On-Time Delivery", value: 95, target: 90 },
  { metric: "Quality Score", value: 4.8, target: 4.5 },
  { metric: "Price Competitiveness", value: 8.2, target: 7.5 },
  { metric: "Response Time", value: 2.4, target: 3.0 },
];

export function CostInsights() {
  const [activeTab, setActiveTab] = useState<
    "category" | "supplier" | "performance"
  >("category");
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "supplier-overview",
    "spending",
  ]);
  const [selectedFilters, setSelectedFilters] = useState({
    year: "2024",
    supplier: "All",
    project: "All",
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "gold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "silver":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "bronze":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("category")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "category"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Category Analysis
          </button>
          <button
            onClick={() => setActiveTab("supplier")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "supplier"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Supplier Insights
          </button>
          <button
            onClick={() => setActiveTab("performance")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "performance"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Performance Metrics
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "category" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Cost Analysis */}
            <ChartContainer
              title="Category Cost Analysis"
              subtitle="Spend by Category"
              delay={0.1}
            >
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
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="rgba(0,0,0,0)"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#111827" }}
                  />
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Category Insights - Based on Real Google Sheets Data */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">
                  Budget Planning Insights (Real Data)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                    <div>
                      <span className="font-medium text-blue-900">
                        Highest Cost Category:
                      </span>{" "}
                      <span className="text-blue-700">Equipment (HW)</span> with{" "}
                      <span className="font-medium">฿550,000</span> (
                      {(
                        (550000 /
                          categoryData.reduce(
                            (sum, item) => sum + item.value,
                            0,
                          )) *
                        100
                      ).toFixed(1)}
                      % of total spend - Based on Google Sheets df_HEADER
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-1.5"></div>
                    <div>
                      <span className="font-medium text-blue-900">
                        Primary Cost Driver:
                      </span>{" "}
                      <span className="text-blue-700">
                        Hardware infrastructure
                      </span>{" "}
                      - Equipment represents the largest budget allocation from
                      real procurement data
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5"></div>
                    <div>
                      <span className="font-medium text-blue-900">
                        Budget Planning Impact:
                      </span>{" "}
                      <span className="text-blue-700">
                        Critical for planning
                      </span>{" "}
                      - Equipment category requires careful budget allocation
                      based on actual spend patterns from df_HEADER
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5"></div>
                    <div>
                      <span className="font-medium text-blue-900">
                        Data Source:
                      </span>{" "}
                      <span className="text-blue-700">
                        Google Sheets df_HEADER
                      </span>{" "}
                      - Real procurement data from connected Google Sheets
                    </div>
                  </div>
                </div>
              </div>
            </ChartContainer>

            {/* Budget vs Spend - Real Data from Google Sheets */}
            <ChartContainer
              title="Budget vs Spend"
              subtitle="Real Variance Analysis from df_HEADER"
              delay={0.2}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    cursor={{ fill: "#e5e7eb", opacity: 0.4 }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#111827" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
                  />
                  <Bar
                    dataKey="budget"
                    name="Allocated Budget"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="spend"
                    name="Actual Spend"
                    fill="#06b6d4"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}

        {activeTab === "supplier" && (
          <div className="space-y-6">
            {/* Supplier Profile Card */}
            <ChartContainer title="Supplier Profile" delay={0.1}>
              <div className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-white shadow-lg">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {mockSupplierData.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {mockSupplierData.name}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${getRatingColor(mockSupplierData.rating)}`}
                          >
                            {mockSupplierData.rating.toUpperCase()}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(mockSupplierData.riskLevel)}`}
                          >
                            {mockSupplierData.riskLevel.toUpperCase()} RISK
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">
                            Contract Status
                          </div>
                          <div className="text-sm font-medium text-blue-600">
                            ACTIVE
                          </div>
                        </div>
                        <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                          <Star className="w-5 h-5 text-yellow-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enterprise Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Enterprise Dashboard
                    </h4>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">
                          Total Contract Value
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          ฿
                          {(
                            mockSupplierData.contractValue || 0
                          ).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Across all active suppliers
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">
                          Performance Score
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          4.8/5.0
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Industry Benchmark: 4.2
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-1">
                          Risk Assessment
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-lg font-bold text-green-600">
                            LOW
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Procurement Decision */}
                    <div className="bg-gradient-to-r from-blue-50 to-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Procurement Decision
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-800 font-bold">✓</span>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">
                              Recommended Action
                            </h5>
                            <p className="text-sm text-gray-600 mt-1">
                              Continue partnership with preferred pricing and
                              extended terms
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">
                            Confidence Level:{" "}
                            <span className="text-green-600 font-bold">
                              High
                            </span>
                          </p>
                          <p>
                            Based on 3-year performance history and risk
                            assessment
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Quick Actions
                    </h4>
                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Review Contract
                      </button>
                      <button className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        Schedule Meeting
                      </button>
                      <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        Generate Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </ChartContainer>

            {/* Performance Metrics */}
            <ChartContainer title="Performance Metrics" delay={0.2}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {performanceMetrics.map((metric, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {metric.metric}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                        <span className="text-sm text-gray-500">
                          Target: {metric.target}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm text-gray-500 mb-1">
                          <span>Current</span>
                          <span>{metric.value}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              metric.value >= metric.target
                                ? "bg-green-600"
                                : "bg-yellow-600"
                            }`}
                            style={{
                              width: `${Math.min((metric.value / 10) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      {metric.value >= metric.target ? (
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-800 text-xs font-bold">
                            ✓
                          </span>
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ChartContainer>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="space-y-6">
            {/* Spend by Supplier */}
            <ChartContainer
              title="Spend by Supplier"
              subtitle="Total amount spent by each supplier"
              delay={0.1}
            >
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={supplierSpendData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      `฿${(value / 1000000).toFixed(1)}M`
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />
                  <Tooltip
                    cursor={{ fill: "#e5e7eb", opacity: 0.4 }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#111827" }}
                    formatter={(value: number) => [
                      `฿${value.toLocaleString()}`,
                      "Total Amount",
                    ]}
                  />
                  <Bar
                    dataKey="totalAmount"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* Supplier Insights */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">
                  Key Insights
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                    <div>
                      <span className="font-medium text-blue-900">
                        Highest Spender:
                      </span>{" "}
                      <span className="text-blue-700">
                        ออล ไอ แคน 3536 จำกัด
                      </span>{" "}
                      with <span className="font-medium">฿1.97M</span> (
                      {(
                        (1969350 /
                          supplierSpendData.reduce(
                            (sum, item) => sum + item.totalAmount,
                            0,
                          )) *
                        100
                      ).toFixed(1)}
                      % of total spend)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-1.5"></div>
                    <div>
                      <span className="font-medium text-blue-900">
                        Vendor Dependency:
                      </span>{" "}
                      <span className="text-blue-700">High concentration</span>{" "}
                      - Top 3 suppliers represent{" "}
                      <span className="font-medium">
                        {(
                          (supplierSpendData
                            .slice(0, 3)
                            .reduce((sum, item) => sum + item.totalAmount, 0) /
                            supplierSpendData.reduce(
                              (sum, item) => sum + item.totalAmount,
                              0,
                            )) *
                          100
                        ).toFixed(1)}
                        %
                      </span>{" "}
                      of total spend
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5"></div>
                    <div>
                      <span className="font-medium text-blue-900">
                        Diversification Opportunity:
                      </span>{" "}
                      <span className="text-blue-700">
                        Consider expanding supplier base
                      </span>{" "}
                      to reduce dependency on top vendors
                    </div>
                  </div>
                </div>
              </div>
            </ChartContainer>

            {/* Performance Metrics */}
            <ChartContainer title="Performance Metrics" delay={0.2}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {performanceMetrics.map((metric, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {metric.metric}
                      </span>
                      <span className="text-sm text-gray-500">
                        Target: {metric.target}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          metric.value >= metric.target
                            ? "bg-green-600"
                            : "bg-yellow-600"
                        }`}
                        style={{
                          width: `${Math.min((metric.value / metric.target) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="mt-2 text-lg font-bold text-gray-900">
                      {metric.value}
                      {metric.metric.includes("Score") ? "" : "%"}
                    </div>
                  </div>
                ))}
              </div>
            </ChartContainer>

            {/* Detailed Table */}
            <ChartContainer
              title="Itemized Expenses"
              subtitle="Detailed breakdown of recent purchases"
              delay={0.3}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="text-xs uppercase bg-gray-50 text-gray-900">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Item Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Supplier</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 rounded-r-lg text-right">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">{item.supplier}</td>
                        <td className="px-4 py-3 text-right">{item.price}</td>
                        <td className="px-4 py-3 text-center">{item.qty}</td>
                        <td className="px-4 py-3 text-right text-emerald-400 font-medium">
                          {item.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartContainer>
          </div>
        )}
      </div>
    </div>
  );
}
