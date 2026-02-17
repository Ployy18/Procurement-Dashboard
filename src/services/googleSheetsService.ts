import Papa from "papaparse";

// Google Sheets URLs for different sheets
const SHEET_URLS = {
  P65019_ปี2565:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQpap4q0Sdy5O1x5WNDuI3ZurwY3LNSbtDilGliHHfDgePvHDFHBsSQ30_InxxY2Pysz_LOXHVhl_cp/pub?gid=0&single=true&output=csv",
  P65019_ปี2566:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQpap4q0Sdy5O1x5WNDuI3ZurwY3LNSbtDilGliHHfDgePvHDFHBsSQ30_InxxY2Pysz_LOXHVhl_cp/pub?gid=2117651605&single=true&output=csv",
  P66011_ปี2566:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQpap4q0Sdy5O1x5WNDuI3ZurwY3LNSbtDilGliHHfDgePvHDFHBsSQ30_InxxY2Pysz_LOXHVhl_cp/pub?gid=1223130728&single=true&output=csv",
  P66011_ปี2567:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQpap4q0Sdy5O1x5WNDuI3ZurwY3LNSbtDilGliHHfDgePvHDFHBsSQ30_InxxY2Pysz_LOXHVhl_cp/pub?gid=1234567890&single=true&output=csv",
  P67025_ปี2567:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQpap4q0Sdy5O1x5WNDuI3ZurwY3LNSbtDilGliHHfDgePvHDFHBsSQ30_InxxY2Pysz_LOXHVhl_cp/pub?gid=2345678901&single=true&output=csv",
  P67025_ปี2568:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQpap4q0Sdy5O1x5WNDuI3ZurwY3LNSbtDilGliHHfDgePvHDFHBsSQ30_InxxY2Pysz_LOXHVhl_cp/pub?gid=3456789012&single=true&output=csv",
  // Fallback URL for new sheets
  default:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQpap4q0Sdy5O1x5WNDuI3ZurwY3LNSbtDilGliHHfDgePvHDFHBsSQ30_InxxY2Pysz_LOXHVhl_cp/pub?output=csv",
};

// Sheet names based on the image - can be dynamically updated
let SHEET_NAMES = [
  "P65019_ปี2565",
  "P65019_ปี2566",
  "P66011_ปี2566",
  "P66011_ปี2567",
  "P67025_ปี2567",
  "P67025_ปี2568",
];

// Function to add new sheet dynamically
export function addNewSheet(sheetName: string): void {
  if (!SHEET_NAMES.includes(sheetName)) {
    SHEET_NAMES.push(sheetName);
  }
}

// Function to get current sheet names
export function getSheetNames(): string[] {
  return [...SHEET_NAMES]; // Return a copy to prevent external modification
}

// Function to update sheet names (for future API integration)
export function updateSheetNames(newSheetNames: string[]): void {
  SHEET_NAMES = [...newSheetNames];
}

export interface SheetData {
  headers: string[];
  rows: Record<string, string | number>[];
}

/**
 * Fetch data from Google Sheets CSV export
 */
async function fetchCSVData(url: string): Promise<SheetData> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve({
            headers: results.meta.fields || [],
            rows: results.data as Record<string, string | number>[],
          });
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    throw error;
  }
}

/**
 * Get data from specific sheet by name
 */
export async function getSheetDataByName(
  sheetName: string,
): Promise<SheetData> {
  // Get URL for the specific sheet, fallback to default if not found
  const url =
    SHEET_URLS[sheetName as keyof typeof SHEET_URLS] || SHEET_URLS.default;
  return fetchCSVData(url);
}

/**
 * Get data from main sheet (fallback)
 */
export async function getMainSheetData(): Promise<SheetData> {
  return fetchCSVData(SHEET_URLS.default);
}

/**
 * Get data from Tab 1 (fallback - maps to P65019_ปี2566)
 */
export async function getTab1Data(): Promise<SheetData> {
  return fetchCSVData(SHEET_URLS["P65019_ปี2566"]);
}

/**
 * Get data from Tab 2 (fallback - maps to P66011_ปี2566)
 */
export async function getTab2Data(): Promise<SheetData> {
  return fetchCSVData(SHEET_URLS["P66011_ปี2566"]);
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
 * Function to add URL for new sheet
 */
export function addSheetURL(sheetName: string, url: string): void {
  (SHEET_URLS as any)[sheetName] = url;
}
