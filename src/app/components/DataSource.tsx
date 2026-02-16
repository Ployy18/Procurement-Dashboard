import React, { useState, useEffect } from "react";
import {
  Upload,
  RefreshCw,
  Database,
  EyeOff,
  Settings,
  Eye,
  Filter,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { ChartContainer } from "./ChartContainer";

interface DataSourceConfig {
  id: string;
  name: string;
  type: "google-sheets" | "api" | "database";
  status: "connected" | "disconnected" | "syncing";
  lastSync?: string;
  url?: string;
  apiKey?: string;
}

interface DataSourceItem {
  id: string;
  name: string;
  type: string;
  size: string;
  records: number;
  lastUpdated: string;
  status: "active" | "inactive";
}

export function DataSource() {
  const [configs, setConfigs] = useState<DataSourceConfig[]>([
    {
      id: "1",
      name: "Google Sheets - df_HEADER",
      type: "google-sheets",
      status: "connected",
      lastSync: "2025-02-16 10:30:00",
      url: "https://docs.google.com/spreadsheets/d/...",
    },
    {
      id: "2",
      name: "Google Sheets - df_LINE",
      type: "google-sheets",
      status: "connected",
      lastSync: "2025-02-16 10:30:00",
      url: "https://docs.google.com/spreadsheets/d/...",
    },
  ]);

  const [dataItems, setDataItems] = useState<DataSourceItem[]>([
    {
      id: "1",
      name: "Purchase Orders",
      type: "Main Dataset",
      size: "2.4 MB",
      records: 1250,
      lastUpdated: "2025-02-16 09:15:00",
      status: "active",
    },
    {
      id: "2",
      name: "Line Items",
      type: "Supporting Dataset",
      size: "1.8 MB",
      records: 3420,
      lastUpdated: "2025-02-16 09:15:00",
      status: "active",
    },
    {
      id: "3",
      name: "Suppliers",
      type: "Reference Data",
      size: "0.3 MB",
      records: 45,
      lastUpdated: "2025-02-15 14:30:00",
      status: "active",
    },
  ]);

  const [selectedConfig, setSelectedConfig] = useState<string>("1");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleSync = async (configId: string) => {
    setIsSyncing(true);
    // Simulate sync process
    setTimeout(() => {
      setConfigs((prev) =>
        prev.map((config) =>
          config.id === configId
            ? {
                ...config,
                status: "connected" as const,
                lastSync: new Date().toLocaleString(),
              }
            : config,
        ),
      );
      setIsSyncing(false);
    }, 2000);
  };

  const handleTestConnection = async (configId: string) => {
    setConfigs((prev) =>
      prev.map((config) =>
        config.id === configId
          ? { ...config, status: "syncing" as const }
          : config,
      ),
    );

    // Simulate connection test
    setTimeout(() => {
      setConfigs((prev) =>
        prev.map((config) =>
          config.id === configId
            ? { ...config, status: "connected" as const }
            : config,
        ),
      );
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "text-green-600 bg-green-100";
      case "disconnected":
        return "text-red-600 bg-red-100";
      case "syncing":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <Database size={16} />;
      case "disconnected":
        return <EyeOff size={16} />;
      case "syncing":
        return <RefreshCw size={16} className="animate-spin" />;
      default:
        return <Database size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ChartContainer
        title="Data Source Management"
        subtitle="Configure and monitor your data connections"
        delay={0.1}
      >
        <div className="flex gap-4 mb-6">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Upload size={16} />
            Add New Source
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
            <RefreshCw size={16} />
            Refresh All
          </button>
        </div>

        {/* Data Source Configurations */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Data Source Configurations
          </h3>

          {configs.map((config) => (
            <div
              key={config.id}
              className={`border rounded-lg p-4 transition-all ${
                selectedConfig === config.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${getStatusColor(config.status)}`}
                  >
                    {getStatusIcon(config.status)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {config.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {config.type === "google-sheets"
                        ? "Google Sheets Integration"
                        : "API Connection"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedConfig(config.id)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedConfig === config.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Select
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Status</p>
                  <p
                    className={`font-medium ${getStatusColor(config.status)} inline-flex items-center gap-2 px-2 py-1 rounded`}
                  >
                    {getStatusIcon(config.status)}
                    {config.status.charAt(0).toUpperCase() +
                      config.status.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Last Sync</p>
                  <p className="font-medium text-gray-900">{config.lastSync}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 mb-1">URL</p>
                  <p className="font-mono text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                    {config.url}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleTestConnection(config.id)}
                  disabled={config.status === "syncing"}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Settings size={14} />
                  Test Connection
                </button>
                <button
                  onClick={() => handleSync(config.id)}
                  disabled={isSyncing || config.status === "syncing"}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={isSyncing ? "animate-spin" : ""}
                  />
                  Sync Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Data Items Summary */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Data Items Summary
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-600">
              <thead className="text-xs bg-gray-50 text-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left rounded-l-lg">Name</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Size</th>
                  <th className="px-4 py-3 text-left">Records</th>
                  <th className="px-4 py-3 text-left">Last Updated</th>
                  <th className="px-4 py-3 text-left rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dataItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.type}</td>
                    <td className="px-4 py-3 text-gray-600">{item.size}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {item.records.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.lastUpdated}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            item.status === "active"
                              ? "bg-green-600"
                              : "bg-gray-400"
                          }`}
                        />
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* API Key Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            API Configuration
          </h3>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-500" />
                <span className="font-medium text-gray-900">API Key</span>
              </div>
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                {showApiKey ? "Hide" : "Show"}
              </button>
            </div>

            {showApiKey && (
              <div className="mt-3">
                <input
                  type="text"
                  value="sk-1234567890abcdef1234567890abcdef"
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </ChartContainer>
    </div>
  );
}
