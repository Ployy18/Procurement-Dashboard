import Papa from "papaparse";

// Google Sheets URLs - Tab 1 (gid=2117651605) และ Tab 2 (gid=1223130728)
const SHEET_URLS = {
  tab1: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQpap4q0Sdy5O1x5WNDuI3ZurwY3LNSbtDilGliHHfDgePvHDFHBsSQ30_InxxY2Pysz_LOXHVhl_cp/pub?gid=2117651605&single=true&output=csv",
  tab2: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQpap4q0Sdy5O1x5WNDuI3ZurwY3LNSbtDilGliHHfDgePvHDFHBsSQ30_InxxY2Pysz_LOXHVhl_cp/pub?gid=1223130728&single=true&output=csv",
};

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
 * Get data from Tab 1 (gid=2117651605)
 */
export async function getTab1Data(): Promise<SheetData> {
  return fetchCSVData(SHEET_URLS.tab1);
}

/**
 * Get data from Tab 2 (gid=1223130728)
 */
export async function getTab2Data(): Promise<SheetData> {
  return fetchCSVData(SHEET_URLS.tab2);
}

/**
 * Get data from both tabs
 */
export async function getAllSheetData(): Promise<{
  tab1: SheetData;
  tab2: SheetData;
}> {
  try {
    const [tab1, tab2] = await Promise.all([getTab1Data(), getTab2Data()]);
    return { tab1, tab2 };
  } catch (error) {
    console.error("Error fetching all sheet data:", error);
    throw error;
  }
}
