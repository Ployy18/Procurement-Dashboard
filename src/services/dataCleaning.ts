import { format, parse, isValid } from "date-fns";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface RawDataRow {
  [key: string]: string | number | null | undefined | boolean;
}

export interface CleanedDataRow {
  date: string;
  poNumber: string;
  supplierName: string;
  itemDescription: string;
  quantity: number;
  unit: string;
  projectCode: string;
  unitPrice: number;
  totalPrice: number;
  vatRate: string;
  engineerName: string;
  category: string;
  sourceSheet?: string;
  _isHead?: boolean;
  _isLine?: boolean;
  _headPO?: string;
}

export interface MultiTableData {
  procurement_data: CleanedDataRow[];
  procurement_head: CleanedDataRow[]; // New: Head table
  procurement_line: CleanedDataRow[]; // New: Line table
  suppliers_master: { name: string; last_seen: string }[];
  categories_master: { name: string; description: string }[];
  upload_logs: {
    timestamp: string;
    filename: string;
    row_count: number;
    status: string;
    sheets_processed?: number;
    sheet_details?: { sheet: string; rows: number }[];
  }[];
  dataBySheet?: Record<string, CleanedDataRow[]>; // New: Data grouped by sheet
}

/**
 * Service for cleaning and standardizing procurement data
 */
export const DataCleaningService = {
  /**
   * Main cleaning pipeline
   */
  cleanData(rawData: RawDataRow[]): CleanedDataRow[] {
    console.log("🧹 [DataCleaningService] Starting data cleaning pipeline...");
    console.log("📊 [DataCleaningService] Input data:", {
      totalRows: rawData.length,
      sampleRow: rawData[0],
    });

    const validRows = rawData.filter((row) => this.isValidRow(row));
    console.log("✅ [DataCleaningService] Valid rows after filtering:", {
      validRows: validRows.length,
      filteredRows: rawData.length - validRows.length,
    });

    const processedRows = validRows.map((row) => this.processRow(row));
    console.log(
      "🔄 [DataCleaningService] Processing completed. Final result:",
      {
        processedRows: processedRows.length,
        sampleProcessedRow: processedRows[0],
      },
    );

    return processedRows;
  },

  /**
   * Parse Excel file buffer
   */
  async parseExcel(file: File): Promise<RawDataRow[]> {
    console.log(
      "📊 [DataCleaningService] Starting Excel parsing for:",
      file.name,
    );

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          
          console.log("📋 [DataCleaningService] Found sheets:", workbook.SheetNames);
          
          let allData: RawDataRow[] = [];
          
          // Process ALL sheets in the workbook
          for (const sheetName of workbook.SheetNames) {
            console.log(`📄 [DataCleaningService] Processing sheet: ${sheetName}`);
            
            const worksheet = workbook.Sheets[sheetName];
            const sheetData = XLSX.utils.sheet_to_json(worksheet) as RawDataRow[];
            
            // Add sheet source information
            const sheetDataWithSource = sheetData.map(row => ({
              ...row,
              _sourceSheet: sheetName,
              _sheetIndex: workbook.SheetNames.indexOf(sheetName)
            }));
            
            console.log(`✅ [DataCleaningService] Sheet "${sheetName}" completed:`, {
              rowsParsed: sheetDataWithSource.length,
              sampleRow: sheetDataWithSource[0]
            });
            
            allData = allData.concat(sheetDataWithSource);
          }
          
          console.log("📊 [DataCleaningService] All sheets parsing completed:", {
            totalSheets: workbook.SheetNames.length,
            totalRows: allData.length,
            sheetsProcessed: workbook.SheetNames
          });

          // Check if this is Head/Line structure (apply to all data)
          const processedData = this.processHeadLineStructure(allData);

          resolve(processedData);
        } catch (err) {
          console.error("❌ [DataCleaningService] Excel parsing error:", err);
          reject(err);
        }
      };
      reader.onerror = (err) => {
        console.error("❌ [DataCleaningService] File reading error:", err);
        reject(err);
      };
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Process Excel files with Head/Line structure
   */
  processHeadLineStructure(rawData: RawDataRow[]): RawDataRow[] {
    console.log("🔧 [DataCleaningService] Processing Head/Line structure...");

    const processedRows: RawDataRow[] = [];
    let currentHead: any = null;

    // Define search keys matching isValidRow/processRow logic
    const poKeys = [
      "PO",
      "PO_Number",
      "เลขที่ PO",
      "PO.NO.",
      "PO NO",
      "NO.PO",
      "No.PO",
      "__EMPTY_1",
    ];
    const dateKeys = ["DATE", "Date", "วันที่", "PO Date", "__EMPTY_2"];
    const supplierKeys = ["Supplier", "ผู้ขาย", "ชื่อผู้ขาย", "Supplier Name", "Vendor", "__EMPTY_3", "__EMPTY_4", "__EMPTY_5", "__EMPTY_6"];

    // Helper function to check if row is a header row (contains column names)
    const isHeaderRow = (row: RawDataRow): boolean => {
      const rowValues = Object.values(row).map(v => v?.toString().toLowerCase() || "");
      const headerKeywords = ["ผู้ขาย", "supplier", "วันที่", "date", "po", "รายการ", "description", "จำนวน", "quantity"];
      
      // Check if row contains multiple header keywords
      const headerMatches = rowValues.filter(value => 
        headerKeywords.some(keyword => value.includes(keyword))
      ).length;
      
      return headerMatches >= 2; // If row contains 2+ header keywords, it's likely a header row
    };

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];

      // Skip header rows (rows with column names)
      if (isHeaderRow(row)) {
        console.log("⏭️ [DataCleaningService] Skipping header row:", Object.values(row));
        continue;
      }

      // Find PO value using shared logic to detect Head row
      const poValue = this.findValue(row, poKeys);

      // LOGIC: If row has a PO number, it is a HEAD row.
      if (poValue && poValue.toString().trim() !== "") {
        // This is a HEAD row
        currentHead = { ...row };
        currentHead._isHead = true;
        
        // Extract supplier from E6 column for Head rows (based on image analysis)
        const supplierValue = this.findValue(row, supplierKeys);
        if (supplierValue) {
          currentHead["Supplier"] = supplierValue;
        }
        
        // Ensure PO is accessible via standard key if needed (optional but helpful)
        if (!currentHead["PO"]) currentHead["PO"] = poValue;

        processedRows.push(currentHead);
        console.log("📋 [DataCleaningService] Found Head row:", poValue, "Supplier:", supplierValue);
      }
      // LOGIC: If row has NO PO number, but we have a currentHead, it is a LINE row.
      else if (currentHead) {
        // This is a LINE row - needs parent context to be valid
        const mergedRow = { ...row };

        // Inject Head context so it passes isValidRow and processRow grabs correct info
        mergedRow["PO"] =
          currentHead["PO"] || this.findValue(currentHead, poKeys);
        mergedRow["Date"] = this.findValue(currentHead, dateKeys);
        mergedRow["Supplier"] = this.findValue(currentHead, supplierKeys);

        // Mark as Line
        mergedRow._isLine = true;
        mergedRow._headPO = mergedRow["PO"];

        processedRows.push(mergedRow);
        console.log("📝 [DataCleaningService] Added Line row for PO:", mergedRow["PO"]);
      }
      // Else: No PO and No Head context -> Skip (likely header junk or empty rows)
    }

    console.log("📊 [DataCleaningService] Head/Line processing completed:", {
      originalRows: rawData.length,
      processedRows: processedRows.length,
      headerRowsSkipped: rawData.length - processedRows.length,
      headRows: processedRows.filter((r) => r._isHead).length,
      lineRows: processedRows.filter((r) => r._isLine).length,
    });

    return processedRows;
  },

  /**
   * Process data into multiple tables
   */
  processMultiTableData(
    cleanedData: CleanedDataRow[],
    filename: string,
  ): MultiTableData {
    // Separate Head and Line data
    const headData = cleanedData.filter((row) => (row as any)._isHead);
    const lineData = cleanedData.filter((row) => (row as any)._isLine);
    
    // Group data by source sheet
    const dataBySheet = cleanedData.reduce((acc, row) => {
      const sheetName = (row as any)._sourceSheet || 'Unknown';
      if (!acc[sheetName]) acc[sheetName] = [];
      acc[sheetName].push(row);
      return acc;
    }, {} as Record<string, CleanedDataRow[]>);
    
    console.log("📊 [DataCleaningService] Data grouped by sheets:", {
      totalSheets: Object.keys(dataBySheet).length,
      sheetNames: Object.keys(dataBySheet),
      sheetDataCounts: Object.entries(dataBySheet).map(([sheet, data]) => ({
        sheet,
        rows: data.length,
        heads: data.filter(r => (r as any)._isHead).length,
        lines: data.filter(r => (r as any)._isLine).length
      }))
    });
    
    // 1. Combined procurement data (for backward compatibility)
    const procurement_data = lineData; // Use line data as main data
    
    // 2. Head table (PO headers only)
    const procurement_head = headData.map((row) => ({
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
      sourceSheet: row.sourceSheet,
    }));

    // 3. Line table (PO line items)
    const procurement_line = lineData.map((row) => ({
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
      sourceSheet: row.sourceSheet,
    }));

    // 4. Suppliers Master (Unique suppliers from line data)
    const uniqueSuppliers = [
      ...new Set(lineData.map((row) => row.supplierName)),
    ];
    const suppliers_master = uniqueSuppliers.map((name) => ({
      name,
      last_seen: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    }));

    // 5. Categories Master (Unique categories from line data)
    const uniqueCategories = [...new Set(lineData.map((row) => row.category))];
    const categories_master = uniqueCategories.map((name) => ({
      name,
      description: `Auto-generated category for ${name}`,
    }));

    // 6. Upload Logs
    const upload_logs = [
      {
        timestamp: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        filename: filename,
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
      // Add sheet-specific data for advanced processing
      dataBySheet: dataBySheet as any,
    };
  },

  /**
   * Check if a row is valid (must have a PO number and not be cancelled)
   */
  isValidRow(row: RawDataRow): boolean {
    console.log(
      "🔍 [DataCleaningService] Checking row validity. Available columns:",
      Object.keys(row),
    );
    console.log("📊 [DataCleaningService] Row data sample:", row);

    const poValue = this.findValue(row, [
      "PO",
      "PO_Number",
      "เลขที่ PO",
      "PO.NO.",
      "PO NO",
      "NO.PO",
      "No.PO",
      "__EMPTY_1", // For Excel files with merged headers
    ]);

    console.log("🎯 [DataCleaningService] PO value found:", poValue);

    if (!poValue || poValue.toString().trim() === "") {
      console.log("❌ [DataCleaningService] Invalid row: No PO number found");
      return false;
    }

    // Check for "cancelled" keywords in the PO number itself
    const poStr = poValue.toString().toLowerCase();
    if (poStr.includes("ยกเลิก") || poStr.includes("cancelled")) {
      console.log("❌ [DataCleaningService] Invalid row: PO cancelled");
      return false;
    }

    // Also check status column if it exists
    const statusValue = this.findValue(row, ["PO Status", "Status", "สถานะ"]);
    if (statusValue) {
      const statusStr = statusValue.toString().toLowerCase();
      if (statusStr.includes("ยกเลิก") || statusStr.includes("cancelled")) {
        console.log("❌ [DataCleaningService] Invalid row: Status cancelled");
        return false;
      }
    }

    console.log("✅ [DataCleaningService] Valid row passed all checks");
    return true;
  },

  /**
   * Process and standardize a single row
   */
  processRow(row: RawDataRow): CleanedDataRow {
    // 1. Extract Date
    const rawDate = this.findValue(row, [
      "DATE",
      "Date",
      "วันที่",
      "PO Date",
      "__EMPTY_2",
    ]); // __EMPTY_2 for Excel merged headers
    const cleanedDate = this.parseDate(rawDate);

    // 2. Extract PO Number
    const poNumber = (
      this.findValue(row, [
        "PO",
        "PO_Number",
        "เลขที่ PO",
        "PO.NO.",
        "PO NO",
        "NO.PO",
        "No.PO",
        "__EMPTY_1", // For Excel files with merged headers
      ]) || ""
    )
      .toString()
      .trim();

    // 3. Extract Supplier and Item (often merged in some formats)
    const rawSupplier = this.findValue(row, [
      "Supplier",
      "ผู้ขาย",
      "ชื่อผู้ขาย",
      "Supplier Name",
      "Vendor",
    ]);
    const rawDescription = this.findValue(row, [
      "Description",
      "รายละเอียด",
      "รายการ",
      "Item Description",
      "Item_Description",
      "__EMPTY_3", // For Excel merged headers
      "__EMPTY_4", // Alternative location
    ]);

    let { supplierName, itemDescription } = this.splitCombinedField(
      rawSupplier?.toString() || "",
    );
    if (!itemDescription) {
      itemDescription = rawDescription?.toString() || "";
    }

    // 4. Extract Project Code
    const rawProject = this.findValue(row, [
      "Project",
      "Project Code",
      "โครงการ",
      "Project_Code",
      "ProjectNo",
    ]);
    let { unit, projectCode } = this.splitProjectUnit(
      rawProject?.toString() || "",
    );

    // 5. Extract Quantity and Price
    const rawQty = this.findValue(row, [
      "Qty",
      "Quantity",
      "จำนวน",
      "__EMPTY_5",
    ]);
    const rawPrice = this.findValue(row, [
      "Price",
      "Amount",
      "ราคา",
      "จำนวนเงิน",
      "Unit_Price",
      "Total Amount",
      "TotalValue",
      "__EMPTY_6", // For Excel merged headers
      "__EMPTY_7", // Alternative location for Amount
      "__EMPTY_8", // Alternative location
      "__EMPTY_9", // Additional location
      "__EMPTY_10", // Additional location
    ]);

    const quantity = this.parseNumber(rawQty) || 1;
    const unitPrice = this.parseNumber(rawPrice);
    const totalPrice = quantity * unitPrice;

    // 6. Extract VAT and Engineer
    const rawVat = this.findValue(row, [
      "VAT", 
      "ภาษี", 
      "VAT_Rate",
      "__EMPTY_11", // Excel column for VAT
      "__EMPTY_12"  // Alternative VAT location
    ]);
    const rawEngineer = this.findValue(row, [
      "Engineer",
      "ผู้อนุมัติ",
      "วิศวกร",
      "Engineer_Name",
      "__EMPTY_13", // Excel column for Engineer
      "__EMPTY_14"  // Alternative Engineer location
    ]);

    const vatRate = this.formatVat(rawVat?.toString() || "");
    const engineerName = rawEngineer?.toString().trim() || "Unassigned";

    // 7. Auto Category - Enhanced with Excel columns
    const rawCategory = this.findValue(row, [
      "Category",
      "หมวดหมู่",
      "ประเภท",
      "__EMPTY_15", // Excel column for Category
      "__EMPTY_16", // Alternative Category location
      "__EMPTY_17", // Additional Category location
      "__EMPTY_18", // Additional Category location
    ]);
    const category = rawCategory
      ? rawCategory.toString()
      : this.autoCategorize(itemDescription);

    return {
      date: cleanedDate,
      poNumber,
      supplierName: supplierName || rawSupplier?.toString() || "Unknown",
      itemDescription,
      quantity,
      unit: unit || "Unit",
      projectCode: projectCode || rawProject?.toString() || "N/A",
      unitPrice,
      totalPrice,
      vatRate,
      engineerName,
      category,
      sourceSheet: row.Source_Sheet?.toString() || "Web Upload",
      _isHead: (row as any)._isHead,
      _isLine: (row as any)._isLine,
      _headPO: (row as any)._headPO,
    };
  },

  /**
   * Helper to find value across multiple possible headers
   */
  findValue(
    row: RawDataRow,
    possibleHeaders: string[],
  ): string | number | null | undefined {
    for (const header of possibleHeaders) {
      const key = Object.keys(row).find(
        (k) => k.toLowerCase() === header.toLowerCase(),
      );
      if (key && row[key] !== undefined && row[key] !== null)
        return row[key] as string | number | null | undefined;
    }
    return null;
  },

  /**
   * Standardize date to ISO format (YYYY-MM-DD)
   */
  parseDate(dateValue: any): string {
    if (!dateValue) return format(new Date(), "yyyy-MM-dd");

    let dateStr = dateValue.toString().trim();
    
    // Handle Excel serial date numbers (common issue)
    if (typeof dateValue === "number" && dateValue > 40000) {
      console.log("📅 [DataCleaningService] Detected Excel serial date:", dateValue);
      
      // Excel serial date starts from 1900-01-01 (day 1)
      const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
      const daysSinceEpoch = dateValue - 1; // Excel uses 1-based indexing
      const parsedDate = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
      
      const result = format(parsedDate, "yyyy-MM-dd");
      console.log("✅ [DataCleaningService] Converted serial date:", dateValue, "→", result);
      return result;
    }
    
    // Handle various date formats from app_script.js
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    
    // Handle YYYY-MM-DD format
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
    
    // Try to parse with date-fns for other formats
    const formats = ['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy'];
    for (const fmt of formats) {
      const parsed = parse(dateStr, fmt, new Date());
      if (isValid(parsed)) {
        return format(parsed, 'yyyy-MM-dd');
      }
    }
    
    console.warn("⚠️ [DataCleaningService] Could not parse date:", dateStr, "Type:", typeof dateValue);
    return format(new Date(), "yyyy-MM-dd");
  },

  parseNumber(value: any): number {
    if (!value) return 0;
    if (typeof value === "number") return value;
    const cleanStr = value.toString().replace(/[^0-9.-]/g, "");
    return parseFloat(cleanStr) || 0;
  },

  splitCombinedField(value: string): {
    supplierName: string;
    itemDescription: string;
  } {
    const parts = value.split(/[-–—]/);
    if (parts.length < 2) return { supplierName: value, itemDescription: "" };
    return {
      supplierName: parts[0]?.trim() || "",
      itemDescription: parts.slice(1).join("-")?.trim() || "",
    };
  },

  splitProjectUnit(value: string): { unit: string; projectCode: string } {
    const parts = value.split(/[-–—]/);
    if (parts.length < 2) return { unit: value, projectCode: "" };
    return {
      unit: parts[0]?.trim() || "",
      projectCode: parts[1]?.trim() || "",
    };
  },

  formatVat(value: string): string {
    const clean = value.replace(/[^0-9]/g, "");
    if (!clean) return "7%";
    return `${clean}%`;
  },

  autoCategorize(description: string): string {
    const desc = description.toLowerCase();
    
    // Enhanced categories from app_script.js
    const categories = {
      'CCTV': ['cctv', 'camera', 'กล้อง', 'วงจร', 'กล้องวงจร'],
      'IT Equipment': ['computer', 'laptop', 'server', 'คอม', 'เซิร์ฟเวอร์', 'คอมพิวเตอร์'],
      'Office Supplies': ['paper', 'pen', 'desk', 'กระดาษ', 'ปากกา', 'โต๊ะ', 'เก้าอี้'],
      'Network': ['router', 'switch', 'cable', 'เน็ตเวิร์ก', 'สายแลน', 'สายเครือข่าย'],
      'Software': ['license', 'software', 'ซอฟต์แวร์', 'ลิขสิทธิ์', 'โปรแกรม'],
      'Construction': ['เหล็ก', 'ปูน', 'material', 'วัสดุ', 'ก่อสร้าง'],
      'Services': ['ค่าแรง', 'labor', 'service', 'บริการ', 'ติดตั้ง'],
      'Furniture': ['โต๊ะ', 'เก้าอี้', 'furniture', 'เฟอร์นิเจอร์']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category;
      }
    }
    
    return 'Other';
  },
};
