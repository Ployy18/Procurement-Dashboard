# Dynamic Sheet Management Documentation

## Overview

The Google Sheets service now supports dynamic sheet configuration management from a database, allowing you to add, update, and manage sheet configurations without modifying the codebase.

## Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Database Configuration for Dynamic Sheet Management
VITE_DATABASE_API_URL=http://localhost:3000/api
VITE_DATABASE_API_KEY=your_api_key_here
VITE_DATABASE_ENDPOINT=/sheet-configs
```

### Environment Variables

- `VITE_DATABASE_API_URL`: Base URL for your database API
- `VITE_DATABASE_API_KEY`: API key for authentication (optional)
- `VITE_DATABASE_ENDPOINT`: Endpoint path for sheet configurations (default: `/sheet-configs`)

## Database API Requirements

Your database API should support the following endpoints:

### GET `/sheet-configs`

Returns an array of sheet configurations:

```json
[
  {
    "name": "P65019_ปี2565",
    "gid": "0",
    "columns": ["Project Code", "DATE", "Description", "Amount", "Status"],
    "filters": {}
  },
  {
    "name": "P65019_ปี2566",
    "gid": "2117651605",
    "columns": ["Project Code", "DATE", "Description", "Amount", "Status", "Category"],
    "filters": {}
  }
]
```

### POST `/sheet-configs`

Accepts a new sheet configuration:

```json
{
  "name": "New_Sheet_2024",
  "gid": "1234567890",
  "columns": ["Project Code", "DATE", "Description", "Amount", "Status"],
  "filters": {}
}
```

## New Functions

### `initializeSheetConfigs()`

Initializes sheet configurations from the database on application startup.

```typescript
import { initializeSheetConfigs } from './services/googleSheetsService';

// Call this when your app starts
await initializeSheetConfigs();
```

### `updateSheetConfigsFromDatabase()`

Updates the local sheet configurations from the database.

```typescript
import { updateSheetConfigsFromDatabase } from './services/googleSheetsService';

await updateSheetConfigsFromDatabase();
```

### `addSheetURL(sheetName, gid, columns?)`

Adds a new sheet configuration to the database and local storage.

```typescript
import { addSheetURL } from './services/googleSheetsService';

const success = await addSheetURL(
  "New_Project_2024",
  "9876543210",
  ["Project Code", "DATE", "Description", "Amount", "Status", "Category"]
);

if (success) {
  console.log("Sheet added successfully to database");
} else {
  console.log("Sheet added to local storage only");
}
```

### `getSheetConfigs()`

Returns the current sheet configurations.

```typescript
import { getSheetConfigs } from './services/googleSheetsService';

const configs = getSheetConfigs();
console.log(configs);
```

### `getSheetNamesDynamic()`

Enhanced function that first updates configurations from database, then fetches sheet names from Google Sheets.

```typescript
import { getSheetNamesDynamic } from './services/googleSheetsService';

const sheetNames = await getSheetNamesDynamic();
```

## Usage Example

### 1. Application Initialization

```typescript
// In your main.tsx or App.tsx
import { initializeSheetConfigs } from './services/googleSheetsService';

async function initializeApp() {
  try {
    await initializeSheetConfigs();
    console.log("Sheet configurations loaded from database");
  } catch (error) {
    console.error("Failed to initialize sheet configs:", error);
  }
}

initializeApp();
```

### 2. Adding a New Sheet

```typescript
// In a component or service
import { addSheetURL } from './services/googleSheetsService';

async function handleAddSheet() {
  try {
    const success = await addSheetURL(
      "P68012_ปี2568",
      "4567890123",
      ["Project Code", "DATE", "Description", "Amount", "Status", "Priority", "Budget"]
    );
    
    if (success) {
      alert("Sheet added successfully!");
    } else {
      alert("Sheet added locally only");
    }
  } catch (error) {
    alert("Error adding sheet: " + error.message);
  }
}
```

### 3. Refreshing Configurations

```typescript
import { updateSheetConfigsFromDatabase, getSheetNamesDynamic } from './services/googleSheetsService';

async function refreshSheets() {
  try {
    await updateSheetConfigsFromDatabase();
    const sheetNames = await getSheetNamesDynamic();
    console.log("Updated sheet names:", sheetNames);
  } catch (error) {
    console.error("Error refreshing sheets:", error);
  }
}
```

## Fallback Behavior

- If the database API is not configured or fails, the system falls back to the hardcoded configurations
- If adding a sheet to the database fails, it will be added to local storage only
- The system maintains backward compatibility with existing functionality

## Error Handling

The service includes comprehensive error handling:

- Network timeouts (10 seconds)
- Invalid API responses
- Missing or invalid environment variables
- Database connection failures

All errors are logged to the console with appropriate fallback actions.

## Migration from Hardcoded Configs

1. Set up your database API with the required endpoints
2. Configure the environment variables
3. Call `initializeSheetConfigs()` on app startup
4. Replace hardcoded sheet additions with `addSheetURL()` calls
5. Use `getSheetNamesDynamic()` instead of `getSheetNames()` for dynamic updates

## Security Considerations

- API keys should be stored securely in environment variables
- The database API should include proper authentication and authorization
- Consider rate limiting for API endpoints
- Validate all incoming data to prevent injection attacks
