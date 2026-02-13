# Store ID Implementation

## Overview
Replaced PROJECT ID with STORE ID throughout the system. STORE ID is auto-generated using:
- First 3 letters of City (uppercase)
- First 3 letters of District (uppercase)  
- Full Dealer Code (uppercase)

**Example:** City: "Mumbai", District: "Mumbai Suburban", Dealer Code: "DLR001"
**Result:** MUMBDLR001

## Changes Made

### Backend (elora-api)

1. **store.model.ts**
   - Added `storeId` field to StoreDocument interface
   - Added `storeId` to schema with unique constraint
   - Created `generateStoreId()` helper function
   - Added pre-save hook to auto-generate storeId for new stores

2. **store.controller.ts**
   - Updated `uploadStoresBulk()` to include district field in location object
   - This ensures storeId is auto-generated during bulk upload

3. **Migration Script**
   - Created `src/scripts/migrateStoreIds.ts`
   - Run this to update existing stores: `npx ts-node src/scripts/migrateStoreIds.ts`
   - Updates all stores without storeId

### Frontend (elora-web)

1. **types/store.ts**
   - Added `storeId: string` field to Store interface

2. **stores/page.tsx**
   - Changed table header from "Project ID" to "Store ID"
   - Updated table cell to display `store.storeId` instead of `store.projectID`
   - Applied yellow color styling for emphasis

## Migration Steps

1. **Update existing stores:**
   ```bash
   cd elora-api
   npx ts-node src/scripts/migrateStoreIds.ts
   ```

2. **Verify migration:**
   - Check MongoDB to ensure all stores have storeId field
   - Stores without city/district will be skipped (logged in console)

3. **New stores:**
   - All new stores (bulk upload or manual add) will automatically get storeId
   - Generated on save via pre-save hook

## Notes

- storeId is unique across the system
- If city or district is missing, storeId generation will be skipped
- Existing projectID field is retained for backward compatibility
- Frontend now displays storeId prominently in yellow color
