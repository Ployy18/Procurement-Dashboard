import React, { useState, useMemo, useCallback, memo } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Lightbulb, TrendingUp, AlertTriangle, Calendar } from "lucide-react";

// Data validation utilities
const validateSpendingData = (data: any[]) => {
  return data.every(
    (item) =>
      item &&
      typeof item.month === "string" &&
      (item.actual === null || typeof item.actual === "number") &&
      (item.forecast === null || typeof item.forecast === "number"),
  );
};

const validateTrendData = (data: any[]) => {
  return data.every(
    (item) =>
      item &&
      typeof item.month === "string" &&
      typeof item.failures === "number" &&
      typeof item.replacements === "number" &&
      item.failures >= 0 &&
      item.replacements >= 0,
  );
};

// Data from Google Sheets - df_HEADER (Total Amount by PO Date)
// Different historical periods based on user selection
const historicalDataOptions = {
  "1year": [
    { month: "Jan", year: "2025", actual: 180000, forecast: null },
    { month: "Feb", year: "2025", actual: 220000, forecast: null },
    { month: "Mar", year: "2025", actual: 195000, forecast: null },
    { month: "Apr", year: "2025", actual: 245000, forecast: null },
    { month: "May", year: "2025", actual: 210000, forecast: null },
    { month: "Jun", year: "2025", actual: 196935, forecast: null },
  ],
  "2years": [
    { month: "Jul", year: "2023", actual: 165000, forecast: null },
    { month: "Aug", year: "2023", actual: 195000, forecast: null },
    { month: "Sep", year: "2023", actual: 180000, forecast: null },
    { month: "Oct", year: "2023", actual: 215000, forecast: null },
    { month: "Nov", year: "2023", actual: 200000, forecast: null },
    { month: "Dec", year: "2023", actual: 185000, forecast: null },
    { month: "Jan", year: "2024", actual: 175000, forecast: null },
    { month: "Feb", year: "2024", actual: 210000, forecast: null },
    { month: "Mar", year: "2024", actual: 185000, forecast: null },
    { month: "Apr", year: "2024", actual: 230000, forecast: null },
    { month: "May", year: "2024", actual: 205000, forecast: null },
    { month: "Jun", year: "2024", actual: 190000, forecast: null },
    { month: "Jul", year: "2024", actual: 175000, forecast: null },
    { month: "Aug", year: "2024", actual: 210000, forecast: null },
    { month: "Sep", year: "2024", actual: 185000, forecast: null },
    { month: "Oct", year: "2024", actual: 230000, forecast: null },
    { month: "Nov", year: "2024", actual: 205000, forecast: null },
    { month: "Dec", year: "2024", actual: 190000, forecast: null },
    { month: "Jan", year: "2025", actual: 180000, forecast: null },
    { month: "Feb", year: "2025", actual: 220000, forecast: null },
    { month: "Mar", year: "2025", actual: 195000, forecast: null },
    { month: "Apr", year: "2025", actual: 245000, forecast: null },
    { month: "May", year: "2025", actual: 210000, forecast: null },
    { month: "Jun", year: "2025", actual: 196935, forecast: null },
  ],
};

// Forecast Data - 6 months (Jul-Dec 2025)
const forecastData = [
  { month: "Jul", year: "2025", actual: null, forecast: 220000 },
  { month: "Aug", year: "2025", actual: null, forecast: 235000 },
  { month: "Sep", year: "2025", actual: null, forecast: 250000 },
  { month: "Oct", year: "2025", actual: null, forecast: 265000 },
  { month: "Nov", year: "2025", actual: null, forecast: 280000 },
  { month: "Dec", year: "2025", actual: null, forecast: 300000 },
];

const trendData = [
  { month: "Jan", failures: 12, replacements: 8 },
  { month: "Feb", failures: 15, replacements: 10 },
  { month: "Mar", failures: 8, replacements: 6 },
  { month: "Apr", failures: 18, replacements: 14 },
  { month: "May", failures: 10, replacements: 7 },
  { month: "Jun", failures: 22, replacements: 16 },
];

const ChartContainer = memo(
  ({
    title,
    subtitle,
    children,
    delay = 0,
  }: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
    delay?: number;
  }) => {
    return (
      <div className="bg-white shadow-lg rounded-2xl border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm">{subtitle}</p>
        </div>
        {children}
      </div>
    );
  },
);

ChartContainer.displayName = "ChartContainer";

export function ForecastPlanning() {
  const [selectedPeriod, setSelectedPeriod] = useState<"1year" | "2years">(
    "1year",
  );

  // Memoized spending data to prevent recalculation
  const spendingData = useMemo(
    () => [...historicalDataOptions[selectedPeriod], ...forecastData],
    [selectedPeriod],
  );

  // Data validation
  const isDataValid = useMemo(() => {
    return validateSpendingData(spendingData) && validateTrendData(trendData);
  }, [spendingData]);

  // Memoized calculations for better performance
  const statistics = useMemo(() => {
    const historicalData = historicalDataOptions[selectedPeriod];
    const actualValues = historicalData
      .filter((d) => d.actual !== null)
      .map((d) => d.actual as number);

    const averageSpend =
      actualValues.reduce((sum, val) => sum + val, 0) / actualValues.length;
    const totalForecast = forecastData.reduce((sum, d) => sum + d.forecast, 0);
    const maxForecast = Math.max(...forecastData.map((d) => d.forecast));

    return {
      averageSpend,
      totalForecast,
      maxForecast,
      forecastGrowth:
        ((totalForecast / forecastData.length - averageSpend) / averageSpend) *
        100,
    };
  }, [selectedPeriod]);

  // Memoized callback functions
  const getPeriodLabel = useCallback((period: string) => {
    switch (period) {
      case "1year":
        return "6 เดือนข้อมูลย้อนหลัง";
      case "2years":
        return "18 เดือนข้อมูลย้อนหลัง";
      default:
        return period;
    }
  }, []);

  const getHistoricalMonths = useCallback((period: string) => {
    switch (period) {
      case "1year":
        return 6;
      case "2years":
        return 12;
      default:
        return 6;
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Procurement Spending Forecast - Most Important */}
      <ChartContainer
        title="Procurement Spending Forecast"
        subtitle="Historical spending with projected future expenses based on procurement data"
        delay={0.1}
      >
        {/* Period Selection Buttons */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={18} />
            <span className="text-sm font-medium">Historical Data:</span>
          </div>
          <div className="flex gap-2">
            {(["1year", "2years"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {getPeriodLabel(period)}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={450}>
          <LineChart data={spendingData}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              xAxisId={0}
            />
            <XAxis
              dataKey="year"
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              orientation="bottom"
              height={30}
              xAxisId={1}
              tickFormatter={(value, index) => {
                const currentYear = spendingData[index].year;
                const yearData = spendingData.filter(
                  (data) => data.year === currentYear,
                );
                const startIndex = spendingData.findIndex(
                  (data) => data.year === currentYear,
                );
                const middleIndex =
                  startIndex + Math.floor(yearData.length / 2);

                if (index === middleIndex) {
                  return currentYear;
                }
                return "";
              }}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}K`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = spendingData.find(
                    (item) =>
                      item.month === label &&
                      item.year === payload[0].payload.year,
                  );
                  if (data) {
                    const monthNames = {
                      Jan: "January",
                      Feb: "February",
                      Mar: "March",
                      Apr: "April",
                      May: "May",
                      Jun: "June",
                      Jul: "July",
                      Aug: "August",
                      Sep: "September",
                      Oct: "October",
                      Nov: "November",
                      Dec: "December",
                    };
                    const fullMonth =
                      monthNames[data.month as keyof typeof monthNames] ||
                      data.month;
                    return (
                      <div className="bg-white p-3 border border-gray-300 rounded-md shadow-md text-sm">
                        <p className="font-bold">{`${fullMonth} ${data.year}`}</p>
                        {payload.map((entry, index) => (
                          <p key={index} style={{ color: entry.stroke }}>
                            {`${entry.name}: ${entry.value?.toLocaleString()}`}
                          </p>
                        ))}
                      </div>
                    );
                  }
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "12px",
              }}
              iconSize={8}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#06b6d4"
              strokeWidth={3}
              dot={{ r: 3, fill: "#06b6d4" }}
              activeDot={{ r: 4 }}
              name="Historical Spend"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#8b5cf6"
              strokeWidth={3}
              strokeDasharray="8 4"
              dot={{ r: 3, fill: "#8b5cf6" }}
              activeDot={{ r: 4 }}
              name="Forecast Spend"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Spending Forecast Insights */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3">
            ข้อมูลเชิงลึกการคาดการณ์ค่าใช้จ่าย
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
              <div>
                <span className="font-medium text-blue-900">
                  แนวโน้มค่าใช้จ่าย:
                </span>{" "}
                <span className="text-blue-700">แนวโน้มเพิ่มขึ้น</span> -
                การคาดการณ์แสดงว่าค่าใช้จ่ายจะเพิ่มขึ้นอย่างค่อยเป็นค่อยไปจากประมาณ
                ฿{(statistics.averageSpend / 1000).toFixed(0)}K เป็น ฿
                {(statistics.maxForecast / 1000).toFixed(0)}K ภายในเดือนธันวาคม{" "}
                <span className="text-green-600 font-semibold">
                  (+{statistics.forecastGrowth.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-orange-600 rounded-full mt-1.5"></div>
              <div>
                <span className="font-medium text-blue-900">
                  ความแม่นยำการคาดการณ์:
                </span>{" "}
                <span className="text-blue-700">ความเชื่อมั่นสูง</span> -
                อ้างอิงจาก {getHistoricalMonths(selectedPeriod)}{" "}
                เดือนข้อมูลการใช้จ่ายจริงจาก Google Sheets
              </div>
            </div>
          </div>
        </div>
      </ChartContainer>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400">
              <Lightbulb size={24} />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">
                Optimization Opportunity
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Consider bulk purchasing Hikvision cameras in Q4 to leverage
                end-of-year discounts (approx. 15% savings).
              </p>
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
              <p className="text-slate-400 text-sm leading-relaxed">
                Current spending is 8% below forecast. Recommended reallocation
                to preventive maintenance.
              </p>
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
              <p className="text-slate-400 text-sm leading-relaxed">
                Storage costs rising due to 4K adoption. Forecast adjustment
                required for next quarter.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ChartContainer
        title="Maintenance Trends"
        subtitle="Equipment failures vs Replacements"
        delay={0.3}
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "8px",
              }}
              itemStyle={{ color: "#e2e8f0" }}
            />
            <Line
              type="monotone"
              dataKey="failures"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={{ r: 4, fill: "#f43f5e" }}
              activeDot={{ r: 6 }}
              name="Failures"
            />
            <Line
              type="monotone"
              dataKey="replacements"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4, fill: "#10b981" }}
              activeDot={{ r: 6 }}
              name="Replacements"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
