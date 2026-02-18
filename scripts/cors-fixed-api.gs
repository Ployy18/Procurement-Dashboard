// ========================================
// CORS-Fixed Apps Script API for Web Integration
// ========================================

// ===============================
// WEB API FUNCTIONS
// ===============================

/**
 * Handle POST requests from web interface
 */
function doPost(e) {
  try {
    // Enable CORS
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    // Set CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    // Handle preflight OPTIONS request
    if (e.request.method === "OPTIONS") {
      output.setContent(
        JSON.stringify({ status: "success", message: "CORS enabled" }),
      );
      Object.keys(headers).forEach((key) => {
        output.addHeader(key, headers[key]);
      });
      return output;
    }

    const data = JSON.parse(e.postData.contents);

    let result;
    switch (data.action) {
      case "importData":
        result = handleImportData(data);
        break;
      case "processData":
        result = handleProcessData();
        break;
      case "importAndProcess":
        result = handleImportAndProcess(data);
        break;
      case "importAndCreateChart":
        result = handleImportAndCreateChart(data);
        break;
      default:
        result = { status: "error", message: "Invalid action" };
    }

    output.setContent(JSON.stringify(result));
    Object.keys(headers).forEach((key) => {
      output.addHeader(key, headers[key]);
    });

    return output;
  } catch (error) {
    const errorOutput = ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: error.toString(),
        timestamp: new Date().toISOString(),
      }),
    );
    errorOutput.setMimeType(ContentService.MimeType.JSON);

    // Add CORS headers to error response
    errorOutput.addHeader("Access-Control-Allow-Origin", "*");
    errorOutput.addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    errorOutput.addHeader("Access-Control-Allow-Headers", "Content-Type");

    return errorOutput;
  }
}

/**
 * Handle GET requests
 */
function doGet(e) {
  try {
    // Enable CORS
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    // Set CORS headers
    output.addHeader("Access-Control-Allow-Origin", "*");
    output.addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    output.addHeader("Access-Control-Allow-Headers", "Content-Type");

    const action = e.parameter.action;
    let result;

    switch (action) {
      case "status":
        result = { status: "success", message: "API is running" };
        break;
      case "processData":
        result = handleProcessData();
        break;
      default:
        result = { status: "success", message: "Data Processing API is ready" };
    }

    output.setContent(JSON.stringify(result));
    return output;
  } catch (error) {
    const errorOutput = ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: error.toString(),
        timestamp: new Date().toISOString(),
      }),
    );
    errorOutput.setMimeType(ContentService.MimeType.JSON);

    // Add CORS headers to error response
    errorOutput.addHeader("Access-Control-Allow-Origin", "*");
    errorOutput.addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    errorOutput.addHeader("Access-Control-Allow-Headers", "Content-Type");

    return errorOutput;
  }
}

/**
 * Handle import data from web
 */
function handleImportData(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Create or clear import sheet
    let importSheet = ss.getSheetByName("IMPORT_DATA");
    if (!importSheet) {
      importSheet = ss.insertSheet("IMPORT_DATA");
    } else {
      importSheet.clear();
    }

    // Write imported data
    if (data.data && data.data.length > 0) {
      const headers = Object.keys(data.data[0]);
      const rows = data.data.map((row) =>
        headers.map((header) => row[header] || ""),
      );

      // Add headers
      importSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

      // Add data
      if (rows.length > 0) {
        importSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
    }

    return {
      status: "success",
      message: `Imported ${data.data.length} rows successfully`,
    };
  } catch (error) {
    return { status: "error", message: `Import failed: ${error.toString()}` };
  }
}

/**
 * Handle data processing request
 */
function handleProcessData() {
  try {
    // Call the existing processAllData function
    processAllData();
    return { status: "success", message: "Data processed successfully" };
  } catch (error) {
    return {
      status: "error",
      message: `Processing failed: ${error.toString()}`,
    };
  }
}

/**
 * Handle import and create chart in one step
 */
function handleImportAndCreateChart(data) {
  try {
    // Step 1: Import data
    const importResult = handleImportDataWithDestination(data);

    if (importResult.status !== "success") {
      return importResult;
    }

    let message = `Imported ${importResult.message}`;

    // Step 2: Create chart if requested
    if (data.createChart) {
      try {
        const chartResult = createChartsForSheet(data.destination);
        if (chartResult.status === "success") {
          message += `. ${chartResult.message}`;
        } else {
          message += `. Chart creation failed: ${chartResult.message}`;
        }
      } catch (chartError) {
        message += `. Chart creation failed: ${chartError.toString()}`;
      }
    }

    return {
      status: "success",
      message: message,
    };
  } catch (error) {
    return {
      status: "error",
      message: `Import & Chart creation failed: ${error.toString()}`,
    };
  }
}

/**
 * Handle import data to specific destination
 */
function handleImportDataWithDestination(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = data.destination || "IMPORT_DATA";

    // Create or clear destination sheet
    let targetSheet = ss.getSheetByName(sheetName);
    if (!targetSheet) {
      targetSheet = ss.insertSheet(sheetName);
    } else {
      targetSheet.clear();
    }

    // Write imported data
    if (data.data && data.data.length > 0) {
      const headers = Object.keys(data.data[0]);
      const rows = data.data.map((row) =>
        headers.map((header) => row[header] || ""),
      );

      // Add headers
      targetSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

      // Add data
      if (rows.length > 0) {
        targetSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
    }

    return {
      status: "success",
      message: `Imported ${data.data.length} rows to ${sheetName} successfully`,
    };
  } catch (error) {
    return { status: "error", message: `Import failed: ${error.toString()}` };
  }
}

/**
 * Create charts for the specified sheet
 */
function createChartsForSheet(sheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return { status: "error", message: `Sheet ${sheetName} not found` };
    }

    const dataRange = sheet.getDataRange();
    const numRows = dataRange.getNumRows();

    if (numRows <= 1) {
      return {
        status: "error",
        message: "No data available for chart creation",
      };
    }

    // Remove existing charts
    sheet.getCharts().forEach((chart) => sheet.removeChart(chart));

    const headers = sheet
      .getRange(1, 1, 1, dataRange.getNumColumns())
      .getValues()[0];
    const charts = [];

    // Create different types of charts based on data

    // 1. Amount column chart (if Amount column exists)
    const amountColIndex = headers.findIndex(
      (header) => header && header.toString().toLowerCase().includes("amount"),
    );

    if (amountColIndex !== -1) {
      const amountChart = sheet
        .newChart()
        .setChartType(Charts.ChartType.COLUMN)
        .addRange(sheet.getRange(2, amountColIndex + 1, numRows - 1, 1))
        .setPosition(1, dataRange.getNumColumns() + 2, 0, 0)
        .setOption("title", "Amount Distribution")
        .setOption("vAxis.title", "Amount")
        .setOption("hAxis.title", "Records")
        .build();

      sheet.addChart(amountChart);
      charts.push("Amount Column Chart");
    }

    // 2. Status pie chart (if Status column exists)
    const statusColIndex = headers.findIndex(
      (header) => header && header.toString().toLowerCase().includes("status"),
    );

    if (statusColIndex !== -1) {
      // Create status summary
      const statusData = createStatusSummary(sheet, statusColIndex);
      if (statusData.length > 0) {
        const statusChartSheet = ss.insertSheet(sheetName + "_Status_Chart");
        statusChartSheet
          .getRange(1, 1, statusData.length, 2)
          .setValues(statusData);

        const statusChart = statusChartSheet
          .newChart()
          .setChartType(Charts.ChartType.PIE)
          .addRange(statusChartSheet.getRange(1, 1, statusData.length, 2))
          .setPosition(1, 4, 0, 0)
          .setOption("title", "Status Distribution")
          .build();

        statusChartSheet.addChart(statusChart);
        charts.push("Status Pie Chart");
      }
    }

    // 3. Timeline chart (if DATE column exists)
    const dateColIndex = headers.findIndex(
      (header) =>
        header &&
        (header.toString().toLowerCase().includes("date") ||
          header.toString().toLowerCase().includes("วันที่")),
    );

    if (dateColIndex !== -1 && amountColIndex !== -1) {
      const timelineChart = sheet
        .newChart()
        .setChartType(Charts.ChartType.LINE)
        .addRange(sheet.getRange(2, dateColIndex + 1, numRows - 1, 1))
        .addRange(sheet.getRange(2, amountColIndex + 1, numRows - 1, 1))
        .setPosition(20, dataRange.getNumColumns() + 2, 0, 0)
        .setOption("title", "Amount Timeline")
        .setOption("vAxis.title", "Amount")
        .setOption("hAxis.title", "Date")
        .build();

      sheet.addChart(timelineChart);
      charts.push("Timeline Chart");
    }

    // 4. Category chart (if Category column exists)
    const categoryColIndex = headers.findIndex(
      (header) =>
        header && header.toString().toLowerCase().includes("category"),
    );

    if (categoryColIndex !== -1 && amountColIndex !== -1) {
      const categoryData = createCategorySummary(
        sheet,
        categoryColIndex,
        amountColIndex,
      );
      if (categoryData.length > 0) {
        const categoryChartSheet = ss.insertSheet(
          sheetName + "_Category_Chart",
        );
        categoryChartSheet
          .getRange(1, 1, categoryData.length, 2)
          .setValues(categoryData);

        const categoryChart = categoryChartSheet
          .newChart()
          .setChartType(Charts.ChartType.BAR)
          .addRange(categoryChartSheet.getRange(1, 1, categoryData.length, 2))
          .setPosition(1, 4, 0, 0)
          .setOption("title", "Amount by Category")
          .build();

        categoryChartSheet.addChart(categoryChart);
        charts.push("Category Bar Chart");
      }
    }

    if (charts.length === 0) {
      return {
        status: "warning",
        message: "No suitable columns found for automatic chart creation",
      };
    }

    return {
      status: "success",
      message: `Created ${charts.length} charts: ${charts.join(", ")}`,
    };
  } catch (error) {
    return {
      status: "error",
      message: `Chart creation failed: ${error.toString()}`,
    };
  }
}

/**
 * Create status summary for pie chart
 */
function createStatusSummary(sheet, statusColIndex) {
  const dataRange = sheet.getDataRange();
  const numRows = dataRange.getNumRows();
  const statusColumn = sheet
    .getRange(2, statusColIndex + 1, numRows - 1, 1)
    .getValues();

  const statusCounts = {};
  statusColumn.forEach((row) => {
    const status = row[0];
    if (status) {
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }
  });

  const summary = Object.entries(statusCounts).map(([status, count]) => [
    status,
    count,
  ]);
  return summary;
}

/**
 * Create category summary for bar chart
 */
function createCategorySummary(sheet, categoryColIndex, amountColIndex) {
  const dataRange = sheet.getDataRange();
  const numRows = dataRange.getNumRows();
  const categoryColumn = sheet
    .getRange(2, categoryColIndex + 1, numRows - 1, 1)
    .getValues();
  const amountColumn = sheet
    .getRange(2, amountColIndex + 1, numRows - 1, 1)
    .getValues();

  const categoryTotals = {};
  for (let i = 0; i < categoryColumn.length; i++) {
    const category = categoryColumn[i][0];
    const amount = parseFloat(amountColumn[i][0]) || 0;

    if (category) {
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    }
  }

  const summary = Object.entries(categoryTotals).map(([category, total]) => [
    category,
    total,
  ]);
  return summary.sort((a, b) => b[1] - a[1]); // Sort by amount descending
}

// ===============================
// COPY ALL YOUR EXISTING FUNCTIONS HERE
// ===============================

// วางฟังก์ชันทั้งหมดจาก Apps Script เดิมของคุณที่นี่
// เช่น: clearExistingSheets, removePOHeaders, cleanPO_cancelAllRows, cleanDatePO_df,
// splitSupplierItem_df, splitVendorDescription_df, splitDescriptionQuantity_df,
// splitUnitProjectCode_df, cleanUnitPrice_df, formatVATColumn, splitVATAndEngineer,
// addRowtype_df, autoCategory_df, renameColumns, splitHeaderLine_df,
// parseDate, formatDateISO, formatNumber, etc.

// ===============================
// CUSTOM MENU
// ===============================

/**
 * Create custom menu
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Data Processing")
    .addItem("Process All Data", "processAllData")
    .addSeparator()
    .addItem("Merge Sheets", "mergeSheetsToDF")
    .addItem("Clean PO Data", "cleanPO_cancelAllRows")
    .addSeparator()
    .addItem("Split Header/Line", "splitHeaderLine_df")
    .addSeparator()
    .addItem("Get API URL", "getApiUrl")
    .addSeparator()
    .addItem("Test CORS", "testCORS")
    .addToUi();
}

/**
 * Get API URL for web integration
 */
function getApiUrl() {
  const url = ScriptApp.getService().getUrl();
  SpreadsheetApp.getUi().alert(`API URL: ${url}`);
}

/**
 * Test CORS functionality
 */
function testCORS() {
  try {
    const url = ScriptApp.getService().getUrl();
    const response = UrlFetchApp.fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://your-website-domain.com",
      },
      payload: JSON.stringify({
        action: "status",
      }),
    });

    SpreadsheetApp.getUi().alert(
      `CORS Test Result: ${response.getContentText()}`,
    );
  } catch (error) {
    SpreadsheetApp.getUi().alert(`CORS Test Error: ${error.toString()}`);
  }
}
