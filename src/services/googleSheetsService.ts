import Papa from "papaparse";

// Configuration
const SHEET_CONFIG = {
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  TIMEOUT: 10000,
} as const;

// Google Sheets configuration from environment
const SHEET_BASE_URL =
  import.meta.env.VITE_GOOGLE_SHEETS_BASE_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQpap4q0Sdy5O1x5WNDuI3ZurwY3LNSbtDilGliHHfDgePvHDFHBsSQ30_InxxY2Pysz_LOXHVhl_cp/pub";

// DataFrame interface for structured data
interface DataFrame {
  headers: string[];
  data: Record<string, string | number>[];
  rows?: Record<string, string | number>[]; // For backward compatibility
  metadata?: {
    rowCount: number;
    columnCount: number;
    sheetName?: string;
  };
}

// SheetData interface (backward compatibility)
export interface SheetData {
  headers: string[];
  rows: Record<string, string | number>[];
  data?: Record<string, string | number>[]; // For DataFrame compatibility
  metadata?: {
    rowCount: number;
    columnCount: number;
    sheetName?: string;
  };
}

// Sheet configuration with column filters
interface SheetConfig {
  name: string;
  gid: string;
  columns?: string[]; // Specific columns to extract
  filters?: {
    [column: string]: string | number | (string | number)[];
  };
}

// Sheet configurations with their GIDs and column specifications
// This will be replaced with dynamic database fetching
let SHEET_CONFIGS: SheetConfig[] = [
  {
    name: "P65019_ปี2565",
    gid: "0",
    columns: ["Project Code", "DATE", "Description", "Amount", "Status"],
  },
  {
    name: "P65019_ปี2566",
    gid: "2117651605",
    columns: [
      "Project Code",
      "DATE",
      "Description",
      "Amount",
      "Status",
      "Category",
    ],
  },
  {
    name: "P66011_ปี2566",
    gid: "1223130728",
    columns: ["Project Code", "DATE", "Description", "Amount", "Status"],
  },
  {
    name: "P66011_ปี2567",
    gid: "1234567890",
    columns: [
      "Project Code",
      "DATE",
      "Description",
      "Amount",
      "Status",
      "Priority",
    ],
  },
  {
    name: "P67025_ปี2567",
    gid: "2345678901",
    columns: ["Project Code", "DATE", "Description", "Amount", "Status"],
  },
  {
    name: "P67025_ปี2568",
    gid: "3456789012",
    columns: [
      "Project Code",
      "DATE",
      "Description",
      "Amount",
      "Status",
      "Budget",
    ],
  },
];

// Initial sheet names (immutable)
const INITIAL_SHEET_NAMES = SHEET_CONFIGS.map((config) => config.name);

// Runtime sheet names (mutable)
let sheetNames: string[] = [...INITIAL_SHEET_NAMES];

// Database configuration
interface DatabaseConfig {
  apiUrl?: string;
  apiKey?: string;
  endpoint?: string;
}

// Get database configuration from environment
const getDatabaseConfig = (): DatabaseConfig => ({
  apiUrl: import.meta.env.VITE_DATABASE_API_URL,
  apiKey: import.meta.env.VITE_DATABASE_API_KEY,
  endpoint: import.meta.env.VITE_DATABASE_ENDPOINT || "/sheet-configs",
});

// Simple cache for API responses
const dataCache = new Map<string, { data: SheetData; timestamp: number }>();

// Function to generate sheet URL dynamically
const generateSheetURL = (gid: string): string => {
  return `${SHEET_BASE_URL}?gid=${gid}&single=true&output=csv`;
};

// Function to filter DataFrame by columns
const filterDataFrame = (df: DataFrame, columns?: string[]): DataFrame => {
  if (!columns || columns.length === 0) {
    return df;
  }

  const filteredHeaders = df.headers.filter((header) =>
    columns.includes(header),
  );
  const filteredData = df.data.map((row) => {
    const filteredRow: Record<string, string | number> = {};
    filteredHeaders.forEach((header) => {
      if (header in row) {
        filteredRow[header] = row[header];
      }
    });
    return filteredRow;
  });

  return {
    headers: filteredHeaders,
    data: filteredData,
    rows: filteredData, // For SheetData compatibility
    metadata: {
      ...df.metadata,
      columnCount: filteredHeaders.length,
      rowCount: filteredData.length,
    },
  };
};

// Function to filter DataFrame by values
const filterDataFrameByValues = (
  df: DataFrame,
  filters?: { [column: string]: string | number | (string | number)[] },
): DataFrame => {
  if (!filters || Object.keys(filters).length === 0) {
    return df;
  }

  const filteredData = df.data.filter((row) => {
    return Object.entries(filters).every(([column, filterValue]) => {
      const rowValue = row[column];

      if (Array.isArray(filterValue)) {
        return filterValue.includes(rowValue);
      } else {
        return rowValue === filterValue;
      }
    });
  });

  return {
    headers: df.headers,
    data: filteredData,
    rows: filteredData, // For SheetData compatibility
    metadata: {
      ...df.metadata,
      columnCount: df.headers.length,
      rowCount: filteredData.length,
    },
  };
};

// Function to add new sheet dynamically
export function addNewSheet(sheetName: string): void {
  if (!sheetNames.includes(sheetName)) {
    sheetNames = [...sheetNames, sheetName];
  }
}

// Function to fetch sheet configurations from database
export async function fetchSheetConfigsFromDatabase(): Promise<SheetConfig[]> {
  const config = getDatabaseConfig();

  if (!config.apiUrl) {
    console.debug("Database API URL not configured, using fallback configs");
    return SHEET_CONFIGS;
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (config.apiKey) {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
    }

    const response = await fetch(`${config.apiUrl}${config.endpoint}`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(
        `Database API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Validate and transform data to SheetConfig format
    if (Array.isArray(data)) {
      const validConfigs = data
        .filter(
          (item) =>
            item &&
            typeof item.name === "string" &&
            typeof item.gid === "string" &&
            (!item.columns || Array.isArray(item.columns)),
        )
        .map((item) => ({
          name: item.name,
          gid: item.gid,
          columns: item.columns || [],
          filters: item.filters || undefined,
        }));

      if (validConfigs.length > 0) {
        console.log(
          `Loaded ${validConfigs.length} sheet configurations from database`,
        );
        return validConfigs;
      }
    }

    console.warn("Invalid data format from database, using fallback configs");
    return SHEET_CONFIGS;
  } catch (error) {
    console.error("Error fetching sheet configs from database:", error);
    return SHEET_CONFIGS;
  }
}

// Function to update sheet configurations from database
export async function updateSheetConfigsFromDatabase(): Promise<void> {
  try {
    const newConfigs = await fetchSheetConfigsFromDatabase();
    SHEET_CONFIGS = newConfigs;

    // Update sheet names
    const newSheetNames = newConfigs.map((config) => config.name);
    updateSheetNames(newSheetNames);

    console.log("Sheet configurations updated successfully from database");
  } catch (error) {
    console.error(
      "Failed to update sheet configurations from database:",
      error,
    );
  }
}

// Function to add new sheet configuration to database
export async function addSheetConfigToDatabase(
  config: SheetConfig,
): Promise<boolean> {
  const dbConfig = getDatabaseConfig();

  if (!dbConfig.apiUrl) {
    console.warn("Database API URL not configured, adding to local only");
    // Add to local configs
    if (!SHEET_CONFIGS.find((c) => c.name === config.name)) {
      SHEET_CONFIGS.push(config);
      addNewSheet(config.name);
    }
    return true;
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (dbConfig.apiKey) {
      headers["Authorization"] = `Bearer ${dbConfig.apiKey}`;
    }

    const response = await fetch(`${dbConfig.apiUrl}${dbConfig.endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(config),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(
        `Database API error: ${response.status} ${response.statusText}`,
      );
    }

    // Update local configs after successful database addition
    if (!SHEET_CONFIGS.find((c) => c.name === config.name)) {
      SHEET_CONFIGS.push(config);
      addNewSheet(config.name);
    }

    console.log(`Sheet configuration '${config.name}' added to database`);
    return true;
  } catch (error) {
    console.error("Error adding sheet config to database:", error);
    // Fallback to local addition
    if (!SHEET_CONFIGS.find((c) => c.name === config.name)) {
      SHEET_CONFIGS.push(config);
      addNewSheet(config.name);
    }
    return false;
  }
}

// Function to get sheet names from Google Sheets API
export async function fetchSheetNamesFromGoogle(): Promise<string[]> {
  try {
    // Get the main sheet to extract all available sheets
    const mainSheetUrl = `${SHEET_BASE_URL}?output=csv`;
    const response = await fetch(mainSheetUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch main sheet: ${response.status}`);
    }

    // Parse the main sheet to extract sheet information
    const csvText = await response.text();
    const result = await new Promise<any[]>((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data as any[]),
        error: (error: any) => reject(error),
      });
    });

    // Extract unique sheet names from data (assuming there's a column with sheet names)
    const sheetNames = result
      .map((row: any) => row["Sheet Name"] || row["ชื่อชีท"] || row["Sheet"])
      .filter(
        (name: any) => name && typeof name === "string" && name.trim() !== "",
      )
      .map((name: string) => name.trim());

    // Remove duplicates and return
    return [...new Set(sheetNames)];
  } catch (error) {
    console.error("Error fetching sheet names from Google:", error);
    // Fallback to initial sheet names
    return [...INITIAL_SHEET_NAMES];
  }
}

// Enhanced getSheetNames function with dynamic fetching
export async function getSheetNamesDynamic(): Promise<string[]> {
  try {
    // First try to update configs from database
    await updateSheetConfigsFromDatabase();

    // Then try to fetch from Google
    const dynamicSheets = await fetchSheetNamesFromGoogle();

    // Update runtime sheet names
    updateSheetNames(dynamicSheets);

    return dynamicSheets;
  } catch (error) {
    console.error(
      "Failed to fetch dynamic sheet names, using fallback:",
      error,
    );
    return [...sheetNames];
  }
}

// Keep original getSheetNames for backward compatibility
export function getSheetNames(): string[] {
  return [...sheetNames];
}

// Function to update sheet names (for future API integration)
export function updateSheetNames(newSheetNames: string[]): void {
  sheetNames = [...newSheetNames];
}

async function fetchCSVData(url: string, useCache = true): Promise<SheetData> {
  // Check cache first
  if (useCache) {
    const cached = dataCache.get(url);
    if (cached && Date.now() - cached.timestamp < SHEET_CONFIG.CACHE_DURATION) {
      return cached.data;
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      SHEET_CONFIG.TIMEOUT,
    );

    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch: ${response.status} ${response.statusText}`,
      );
    }

    const csvText = await response.text();

    const result: SheetData = await new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as Record<string, string | number>[];
          resolve({
            headers: results.meta.fields || [],
            rows: data,
            data: data, // For DataFrame compatibility
            metadata: {
              rowCount: data.length,
              columnCount: results.meta.fields?.length || 0,
            },
          });
        },
        error: (error: Error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        },
      });
    });

    // Cache the result
    if (useCache) {
      dataCache.set(url, { data: result, timestamp: Date.now() });
    }

    return result;
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    throw new Error(
      `Failed to fetch sheet data: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get data from specific sheet by name
 */
export async function getSheetDataByName(
  sheetName: string,
): Promise<SheetData> {
  // Find sheet config by name
  const config = SHEET_CONFIGS.find((c) => c.name === sheetName);
  if (config) {
    const url = generateSheetURL(config.gid);
    return fetchCSVData(url);
  }

  // Fallback to default URL if sheet not found
  const fallbackUrl = `${SHEET_BASE_URL}?output=csv`;
  return fetchCSVData(fallbackUrl);
}

/**
 * Get data from main sheet (fallback)
 */
export async function getMainSheetData(): Promise<SheetData> {
  const fallbackUrl = `${SHEET_BASE_URL}?output=csv`;
  return fetchCSVData(fallbackUrl);
}

/**
 * Get data from Tab 1 (fallback - maps to P65019_ปี2566)
 */
export async function getTab1Data(): Promise<SheetData> {
  const config = SHEET_CONFIGS.find((c) => c.name === "P65019_ปี2566");
  if (config) {
    const url = generateSheetURL(config.gid);
    return fetchCSVData(url);
  }
  throw new Error("Tab1 configuration not found");
}

/**
 * Get data from Tab 2 (fallback - maps to P66011_ปี2566)
 */
export async function getTab2Data(): Promise<SheetData> {
  const config = SHEET_CONFIGS.find((c) => c.name === "P66011_ปี2566");
  if (config) {
    const url = generateSheetURL(config.gid);
    return fetchCSVData(url);
  }
  throw new Error("Tab2 configuration not found");
}

/**
 * Get data from both tabs
 */
export async function getAllSheetData(): Promise<{
  tab1: SheetData;
  tab2: SheetData;
  main: SheetData;
}> {
  try {
    const [tab1, tab2, main] = await Promise.all([
      getTab1Data(),
      getTab2Data(),
      getMainSheetData(),
    ]);
    return { tab1, tab2, main };
  } catch (error) {
    console.error("Error fetching all sheet data:", error);
    throw error;
  }
}

/**
 * Function to add URL for new sheet (updated for database integration)
 */
export async function addSheetURL(
  sheetName: string,
  gid: string,
  columns?: string[],
): Promise<boolean> {
  if (typeof sheetName !== "string" || typeof gid !== "string") {
    throw new Error("Invalid parameters: sheetName and gid must be strings");
  }

  const newConfig: SheetConfig = {
    name: sheetName,
    gid: gid,
    columns: columns || [
      "Project Code",
      "DATE",
      "Description",
      "Amount",
      "Status",
    ],
  };

  try {
    // Try to add to database first
    const success = await addSheetConfigToDatabase(newConfig);

    if (success) {
      console.log(`Successfully added sheet '${sheetName}' to database`);
    } else {
      console.log(`Added sheet '${sheetName}' to local storage only`);
    }

    return success;
  } catch (error) {
    console.error("Error adding sheet URL:", error);
    throw error;
  }
}

/**
 * Get current sheet configurations
 */
export function getSheetConfigs(): SheetConfig[] {
  return [...SHEET_CONFIGS];
}

/**
 * Initialize sheet configurations from database on startup
 */
export async function initializeSheetConfigs(): Promise<void> {
  try {
    console.log("Initializing sheet configurations...");
    await updateSheetConfigsFromDatabase();
    console.log("Sheet configurations initialization completed");
  } catch (error) {
    console.error("Failed to initialize sheet configurations:", error);
  }
}

/**
 * Clear cache (useful for testing or force refresh)
 */
export function clearCache(): void {
  dataCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: dataCache.size,
    keys: Array.from(dataCache.keys()),
  };
}
