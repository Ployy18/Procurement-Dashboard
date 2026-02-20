import express from "express";
import cors from "cors";
import { google } from "googleapis";
import dotenv from "dotenv";
import { format, parse, isValid } from "date-fns";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const PORT = process.env.BACKEND_PORT || 3001;

// Google Sheets Auth
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID =
  process.env.SPREADSHEET_ID || "1v9WL4jYXR6IXwcZQKDjzaInvUu-ADEzlYRRrty1E0oE";

// --- Data Cleaning Logic (Ported from Frontend) ---

const DataCleaningService = {
  processMultiTableData(cleanedData, filename) {
    if (!cleanedData || !Array.isArray(cleanedData)) {
      throw new Error("Invalid data format: cleanedData must be an array");
    }

    // Separate Head and Line data
    const headData = cleanedData.filter(row => row._isHead);
    const lineData = cleanedData.filter(row => row._isLine);
    
    // Group data by source sheet
    const dataBySheet = cleanedData.reduce((acc, row) => {
      const sheetName = row._sourceSheet || 'Unknown';
      if (!acc[sheetName]) acc[sheetName] = [];
      acc[sheetName].push(row);
      return acc;
    }, {});
    
    console.log("📊 [DataCleaningService] Data grouped by sheets:", {
      totalSheets: Object.keys(dataBySheet).length,
      sheetNames: Object.keys(dataBySheet),
      sheetDataCounts: Object.entries(dataBySheet).map(([sheet, data]) => ({
        sheet,
        rows: data.length,
        heads: data.filter(r => r._isHead).length,
        lines: data.filter(r => r._isLine).length
      }))
    });
    
    // 1. Combined procurement data (for backward compatibility)
    const procurement_data = lineData; // Use line data as main data
    
    // 2. Head table (PO headers only)
    const procurement_head = headData.map(row => ({
      ...row,
      // Map head-specific fields
      date: row.date,
      poNumber: row.poNumber,
      supplierName: row.supplierName,
      itemDescription: "HEADER", // Mark as header
      quantity: 0,
      unit: "HEADER",
      projectCode: row.projectCode,
      unitPrice: 0,
      totalPrice: 0,
      vatRate: row.vatRate,
      engineerName: row.engineerName,
      category: "HEADER",
      sourceSheet: row.sourceSheet
    }));
    
    // 3. Line table (PO line items)
    const procurement_line = lineData.map(row => ({
      ...row,
      // Map line-specific fields
      date: row.date,
      poNumber: row.poNumber,
      supplierName: row.supplierName,
      itemDescription: row.itemDescription,
      quantity: row.quantity,
      unit: row.unit,
      projectCode: row.projectCode,
      unitPrice: row.unitPrice,
      totalPrice: row.totalPrice,
      vatRate: row.vatRate,
      engineerName: row.engineerName,
      category: row.category,
      sourceSheet: row.sourceSheet
    }));

    // 4. Suppliers Master (Unique suppliers from line data)
    const uniqueSuppliers = [
      ...new Set(lineData.map((row) => row.supplierName).filter(Boolean)),
    ];
    const suppliers_master = uniqueSuppliers.map((name) => ({
      name,
      last_seen: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    }));

    // 5. Categories Master (Unique categories from line data)
    const uniqueCategories = [
      ...new Set(lineData.map((row) => row.category).filter(Boolean)),
    ];
    const categories_master = uniqueCategories.map((name) => ({
      name,
      description: `Auto-generated category for ${name}`,
    }));

    // 6. Upload Logs
    const upload_logs = [
      {
        timestamp: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        filename: filename || "unknown_file",
        row_count: lineData.length,
        status: "Success",
        sheets_processed: Object.keys(dataBySheet).length,
        sheet_details: Object.entries(dataBySheet).map(([sheet, data]) => ({
          sheet,
          rows: data.length
        }))
      },
    ];

    return {
      procurement_data,
      procurement_head,
      procurement_line,
      suppliers_master,
      categories_master,
      upload_logs,
      dataBySheet: dataBySheet
    };
  },
};

// --- Google Sheets Operations ---

async function writeTableToSheet(sheetName, data) {
  if (!data || data.length === 0)
    return { sheet: sheetName, status: "skipped", rows: 0 };

  try {
    const headers = Object.keys(data[0]);
    const values = [
      headers,
      ...data.map((row) =>
        headers.map((h) =>
          row[h] !== undefined && row[h] !== null ? row[h] : "",
        ),
      ),
    ];

    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    let sheet = spreadsheet.data.sheets.find(
      (s) => s.properties.title === sheetName,
    );

    if (!sheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });
    } else {
      // Clear existing data - specifically A1:Z (adjust if more columns are needed)
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:Z`,
      });
    }

    // Write new data
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values },
    });

    return { sheet: sheetName, status: "success", rows: data.length };
  } catch (error) {
    console.error(`Error writing to ${sheetName}:`, error.message);
    throw new Error(`Failed to write to sheet ${sheetName}: ${error.message}`);
  }
}

async function appendTableToSheet(sheetName, data) {
  if (!data || data.length === 0)
    return { sheet: sheetName, status: "skipped", rows: 0 };

  try {
    const headers = Object.keys(data[0]);
    const values = data.map((row) =>
      headers.map((h) =>
        row[h] !== undefined && row[h] !== null ? row[h] : "",
      ),
    );

    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    let sheet = spreadsheet.data.sheets.find(
      (s) => s.properties.title === sheetName,
    );

    if (!sheet) {
      // Create with headers if doesn't exist
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers, ...values] },
      });
    } else {
      // Append data
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: "RAW",
        requestBody: { values },
      });
    }
    return { sheet: sheetName, status: "success", rows: data.length };
  } catch (error) {
    console.error(`Error appending to ${sheetName}:`, error.message);
    throw new Error(`Failed to append to sheet ${sheetName}: ${error.message}`);
  }
}

async function updateMasterSheet(sheetName, data, keyColumn) {
  if (!data || data.length === 0)
    return { sheet: sheetName, status: "skipped", rows: 0 };

  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    let sheet = spreadsheet.data.sheets.find(
      (s) => s.properties.title === sheetName,
    );

    if (!sheet) {
      return await writeTableToSheet(sheetName, data);
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:Z`,
    });

    const rows = response.data.values || [];
    const headers = rows[0] || [];
    const keyIndex = headers.indexOf(keyColumn);

    if (keyIndex === -1) {
      // If key column not found, just overwrite or handle error?
      // For now, let's append if headers exist, or overwrite if empty
      if (headers.length === 0) return await writeTableToSheet(sheetName, data);
      return await appendTableToSheet(sheetName, data);
    }

    const existingKeys = new Set(
      rows.slice(1).map((r) => r[keyIndex]?.toString().toLowerCase().trim()),
    );
    const newData = data.filter((item) => {
      const val = item[keyColumn]?.toString().toLowerCase().trim();
      return val && !existingKeys.has(val);
    });

    if (newData.length > 0) {
      const valuesToAppend = newData.map((item) =>
        headers.map((h) =>
          item[h] !== undefined && item[h] !== null ? item[h] : "",
        ),
      );
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: valuesToAppend },
      });
      return {
        sheet: sheetName,
        status: "success",
        appended: newData.length,
        total: data.length,
      };
    }

    return { sheet: sheetName, status: "no_new_data", total: data.length };
  } catch (error) {
    console.error(`Error updating master ${sheetName}:`, error.message);
    throw new Error(
      `Failed to update master sheet ${sheetName}: ${error.message}`,
    );
  }
}

// --- API Endpoints ---

// Main upload endpoint
app.post("/api/upload", async (req, res) => {
  const { data, filename } = req.body;

  if (!data || !Array.isArray(data)) {
    return res.status(400).json({
      success: false,
      message: "Required 'data' field missing or not an array",
    });
  }

  try {
    // Process and split data
    const tables = DataCleaningService.processMultiTableData(
      data,
      filename || "web-upload.xlsx",
    );

    const results = {};

    // 1. Procurement Data (Overwrite) - Line items only
    results.procurement = await writeTableToSheet(
      "procurement_data",
      tables.procurement_data,
    );

    // 2. Procurement Head (Overwrite) - PO headers only
    results.head = await writeTableToSheet(
      "procurement_head",
      tables.procurement_head,
    );

    // 3. Procurement Line (Overwrite) - Line items separate
    results.line = await writeTableToSheet(
      "procurement_line",
      tables.procurement_line,
    );

    // 4. Create individual sheets for each source sheet
    if (tables.dataBySheet) {
      for (const [sheetName, sheetData] of Object.entries(tables.dataBySheet)) {
        const cleanSheetName = sheetName.replace(/[^a-zA-Z0-9_]/g, '_');
        const result = await writeTableToSheet(
          `sheet_${cleanSheetName}`,
          sheetData
        );
        results[`sheet_${cleanSheetName}`] = result;
        console.log(`📊 Created individual sheet: sheet_${cleanSheetName} with ${sheetData.length} rows`);
      }
    }

    // 5. Suppliers Master (Update - Only new)
    results.suppliers = await updateMasterSheet(
      "suppliers_master",
      tables.suppliers_master,
      "name",
    );

    // 6. Categories Master (Update - Only new)
    results.categories = await updateMasterSheet(
      "categories_master",
      tables.categories_master,
      "name",
    );

    // 7. Upload Logs (Append)
    results.logs = await appendTableToSheet("upload_logs", tables.upload_logs);

    res.json({
      success: true,
      message: "Data processed and saved to Google Sheets successfully",
      data: {
        timestamp: new Date().toISOString(),
        filename: filename,
        stats: {
          procurementRows: tables.procurement_data.length,
          headRows: tables.procurement_head.length,
          lineRows: tables.procurement_line.length,
          suppliersCount: tables.suppliers_master.length,
          categoriesCount: tables.categories_master.length,
          sheetsProcessed: Object.keys(tables.dataBySheet || {}).length,
          sheetDetails: Object.entries(tables.dataBySheet || {}).map(([sheet, data]) => ({
            sheet,
            rows: data.length
          }))
        },
        details: results,
      },
    });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during data upload",
      error: error.message,
    });
  }
});

// Alias for compatibility
app.post("/api/import-multi-table", async (req, res) => {
  // Just forward to /api/upload
  req.url = "/api/upload";
  return app.handle(req, res);
});

// Get available sheets
app.get("/api/sheets", async (req, res) => {
  try {
    // List of standard sheets we manage
    const standardSheets = [
      "procurement_data",
      "procurement_head",  // New: Head table
      "procurement_line",  // New: Line table
      "suppliers_master",
      "categories_master",
      "upload_logs",
    ];

    // Optionally fetch all sheet names from the spreadsheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    const allSheets = spreadsheet.data.sheets.map((s) => s.properties.title);

    res.json({
      success: true,
      data: {
        sheets: standardSheets,
        availableOnGoogle: allSheets,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch sheet names",
      error: error.message,
    });
  }
});

// Get specific sheet data
app.get("/api/sheets/:sheetName", async (req, res) => {
  try {
    const { sheetName } = req.params;

    // First check if sheet exists to avoid "Unable to parse range" error
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheet = spreadsheet.data.sheets.find(
      (s) => s.properties.title === sheetName,
    );

    if (!sheet) {
      return res.json({
        success: true,
        data: { headers: [], rows: [] },
        message: `Sheet '${sheetName}' does not exist yet.`,
      });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return res.json({
        success: true,
        data: { headers: [], rows: [] },
      });
    }

    const headers = rows[0] || [];
    const data = rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] !== undefined ? row[index] : "";
      });
      return obj;
    });

    res.json({
      success: true,
      data: {
        headers,
        rows: data,
      },
    });
  } catch (error) {
    console.error(
      `Error fetching sheet ${req.params.sheetName}:`,
      error.message,
    );
    res.status(500).json({
      success: false,
      message: `Failed to fetch data from sheet: ${req.params.sheetName}`,
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
