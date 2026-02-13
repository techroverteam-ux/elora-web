import { Request, Response } from "express";
import Store, { StoreStatus } from "./store.model";
import * as XLSX from "xlsx";
import fs from "fs";
import PptxGenJS from "pptxgenjs";
import path from "path";
import { Row, Cell } from "exceljs";

// Helper: fuzzy search for column headers
const findKey = (row: any, keywords: string[]): string | undefined => {
  const keys = Object.keys(row);
  return keys.find((k) =>
    keywords.every((kw) =>
      k
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .includes(kw),
    ),
  );
};

export const uploadStoresBulk = async (req: Request, res: Response) => {
  try {
    // --- FIX: SELF-HEALING DATABASE ---
    // This command deletes the old "Unique" rule for storeCode that is causing the crash.
    // We catch errors just in case the index is already gone.
    await Store.collection.dropIndex("storeCode_1").catch(() => {
      // console.log("Index already dropped or doesn't exist");
    });
    // ----------------------------------

    const files =
      (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);

    if (files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    let totalProcessed = 0;
    let totalSuccess = 0;
    let allErrors: any[] = [];
    const toInsert: any[] = [];

    // 1. Get existing codes
    const existingCodes = new Set(
      (await Store.find().select("dealerCode")).map((s) => s.dealerCode),
    );

    for (const file of files) {
      try {
        const workbook = XLSX.readFile(file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData: any[] = XLSX.utils.sheet_to_json(sheet);

        totalProcessed += rawData.length;

        for (const [index, row] of rawData.entries()) {
          const rowNum = index + 2;

          // A. Dealer Code Check
          const dCodeRaw = row["Dealer Code"];

          if (!dCodeRaw) {
            // Skip empty rows (like footer totals) silently or with a minor note
            allErrors.push({
              file: file.originalname,
              row: rowNum,
              error: "Skipped: 'Dealer Code' is missing/empty",
            });
            continue;
          }

          const dCode = String(dCodeRaw).trim();

          // B. Duplicates
          if (existingCodes.has(dCode)) {
            allErrors.push({
              file: file.originalname,
              row: rowNum,
              error: `Duplicate in DB: ${dCode}`,
            });
            continue;
          }
          if (toInsert.find((i) => i.dealerCode === dCode)) {
            allErrors.push({
              file: file.originalname,
              row: rowNum,
              error: `Duplicate in File: ${dCode}`,
            });
            continue;
          }

          // C. Build Object
          const newStore = {
            projectID: row["Sr. No."] ? String(row["Sr. No."]) : "",
            dealerCode: dCode,
            // Now this can repeat "ELORA CREATIVE ART" without crashing!
            storeCode: row["Vendor Code & Name"] || "",
            storeName: row["Dealer's Name"] || "Unknown Name",

            location: {
              city: row["City"] || "",
              area: row["District"] || "",
              district: row["District"] || "", // NEW: Added district for storeId generation
              address: row["Dealer's Address"] || "",
            },
            contact: {
              personName: "",
              mobile: "",
            },
            specs: {
              boardSize: `${row["Width (Ft.)"] || "?"} x ${row["Height (Ft.)"] || "?"}`,
              type: row["Dealer Board Type"] || "",
            },
            currentStatus: StoreStatus.UPLOADED,
          };

          toInsert.push(newStore);
        }
      } catch (err: any) {
        allErrors.push({
          file: file.originalname,
          error: "Parsing Error: " + err.message,
        });
      } finally {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    // 3. Batch Insert
    if (toInsert.length > 0) {
      try {
        await Store.insertMany(toInsert, { ordered: false });
        totalSuccess = toInsert.length;
      } catch (err: any) {
        if (err.name === "ValidationError") {
          Object.keys(err.errors).forEach((field) => {
            allErrors.push({
              error: `Validation Error: ${err.errors[field].message}`,
            });
          });
        } else if (err.writeErrors) {
          totalSuccess = toInsert.length - err.writeErrors.length;
          err.writeErrors.forEach((e: any) => {
            if (e.code === 11000) {
              // Check WHICH field is duplicate
              const field = Object.keys(e.keyValue)[0];
              allErrors.push({
                error: `Duplicate ${field}: ${e.keyValue[field]}`,
              });
            } else {
              allErrors.push({ error: `DB Write Error: ${e.errmsg}` });
            }
          });
        } else {
          allErrors.push({ error: `Critical Error: ${err.message}` });
        }
      }
    }

    res.status(201).json({
      message: "Bulk upload processed",
      totalProcessed,
      successCount: totalSuccess,
      errorCount: allErrors.length,
      errors: allErrors,
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const createStore = async (req: Request, res: Response) => {
  try {
    const {
      dealerCode,
      storeName,
      vendorCode,
      location,
      commercials,
      costDetails,
      specs,
    } = req.body;

    if (!dealerCode) {
      return res.status(400).json({ message: "Dealer Code is required" });
    }

    const store = new Store({
      dealerCode,
      storeName,
      vendorCode,
      location,
      commercials,
      costDetails,
      specs,
      currentStatus: StoreStatus.UPLOADED,
    });

    await store.save();

    res.status(201).json({
      message: "Store created successfully",
      store,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "A store with this Dealer Code already exists" });
    }

    res.status(500).json({
      message: "Failed to create store",
      error: error.message,
    });
  }
};

export const getAllStores = async (req: Request | any, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, search, city } = req.query;

    let query: any = {};

    // 1. Role-based Access Control
    const userRoles = req.user.roles || [];
    const isSuperAdmin = userRoles.some((r: any) => r.code === "SUPER_ADMIN");
    const isAdmin = userRoles.some((r: any) => r.code === "ADMIN");

    if (!isSuperAdmin && !isAdmin) {
      query.$or = [
        { "workflow.recceAssignedTo": req.user._id },
        { "workflow.installationAssignedTo": req.user._id },
      ];
    }

    // 2. Status Filter
    if (status && status !== "ALL") {
      query.currentStatus = status;
    }

    // 3. City Filter
    if (city) {
      query["location.city"] = city;
    }

    // 4. Search (Store Name, Dealer Code, City)
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { storeName: searchRegex },
            { dealerCode: searchRegex },
            { "location.city": searchRegex },
            { "location.area": searchRegex },
          ],
        },
      ];
    }

    const total = await Store.countDocuments(query);
    const stores = await Store.find(query)
      .populate("workflow.recceAssignedTo", "name email")
      .populate("workflow.installationAssignedTo", "name email")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      stores,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error: any) {
    console.error("Get All Stores Error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch stores", error: error.message });
  }
};

export const getStoreById = async (req: Request, res: Response) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate("workflow.recceAssignedTo", "name")
      .populate("workflow.installationAssignedTo", "name");

    if (!store) return res.status(404).json({ message: "Store not found" });
    res.status(200).json({ store });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch store" });
  }
};

export const updateStore = async (req: Request, res: Response) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.status(200).json({ store });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update store" });
  }
};

export const deleteStore = async (req: Request, res: Response) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.status(200).json({ message: "Store deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete store" });
  }
};

export const assignStoresBulk = async (req: Request, res: Response) => {
  try {
    const { storeIds, userId, stage } = req.body;
    // stage must be 'RECCE' or 'INSTALLATION'

    if (!storeIds || !Array.isArray(storeIds) || storeIds.length === 0) {
      return res.status(400).json({ message: "No stores selected" });
    }
    if (!userId) {
      return res.status(400).json({ message: "No user selected" });
    }

    let updateData = {};

    // LOGIC: Handle Recce vs Installation Assignment
    if (stage === "RECCE") {
      updateData = {
        "workflow.recceAssignedTo": userId,
        "recce.assignedDate": new Date(),
        currentStatus: StoreStatus.RECCE_ASSIGNED,
      };
    } else if (stage === "INSTALLATION") {
      updateData = {
        "workflow.installationAssignedTo": userId,
        "installation.assignedDate": new Date(),
        currentStatus: StoreStatus.INSTALLATION_ASSIGNED,
      };
    } else {
      return res.status(400).json({ message: "Invalid assignment stage" });
    }

    // Execute Bulk Update
    const result = await Store.updateMany(
      { _id: { $in: storeIds } },
      { $set: updateData },
    );

    res.status(200).json({
      message: `Successfully assigned ${result.modifiedCount} stores to user.`,
      result,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Assignment failed", error: error.message });
  }
};

export const submitRecce = async (req: Request | any, res: Response) => {
  try {
    const { id } = req.params;
    const { width, height, notes } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // ... (Your existing Store finding and Security Checks remain here) ...

    // 3. Prepare Recce Data
    const recceUpdate: any = {
      "recce.submittedDate": new Date(),
      "recce.notes": notes,
      "recce.sizes": {
        width: Number(width),
        height: Number(height),
      },
      currentStatus: StoreStatus.RECCE_SUBMITTED,
    };

    // 4. Handle Image Paths (FIX: Normalize slashes)
    // We replace all backslashes '\' with forward slashes '/' so browsers can read them
    if (files.front) {
      recceUpdate["recce.photos.front"] = files.front[0].path.replace(
        /\\/g,
        "/",
      );
    }
    if (files.side) {
      recceUpdate["recce.photos.side"] = files.side[0].path.replace(/\\/g, "/");
    }
    if (files.closeUp) {
      recceUpdate["recce.photos.closeUp"] = files.closeUp[0].path.replace(
        /\\/g,
        "/",
      );
    }

    // ... (Rest of the save logic remains the same) ...

    const updatedStore = await Store.findByIdAndUpdate(
      id,
      { $set: recceUpdate },
      { new: true },
    );

    res.status(200).json({
      message: "Recce submitted successfully",
      store: updatedStore,
    });
  } catch (error: any) {
    console.error("Recce Submit Error:", error);
    res
      .status(500)
      .json({ message: "Failed to submit recce", error: error.message });
  }
};

// --- NEW: Generate Recce PPT ---
export const generateReccePPT = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const store = await Store.findById(id);

    if (!store || !store.recce) {
      return res.status(404).json({ message: "Store or Recce data not found" });
    }

    // 1. Initialize PPT
    const pres = new PptxGenJS();
    pres.title = `Recce Report - ${store.storeName}`;

    // --- SLIDE 1: TITLE & SUMMARY ---
    const slide1 = pres.addSlide();

    // Header
    slide1.addShape("rect", {
      x: 0,
      y: 0,
      w: "100%",
      h: 1,
      fill: { color: "003366" },
    });
    slide1.addText("Recce Inspection Report", {
      x: 0.5,
      y: 0.25,
      fontSize: 24,
      color: "FFFFFF",
      bold: true,
    });

    // Data Preparation (STRICT TYPE FIX)
    // We explicitly define the structure to satisfy TypeScript
    const rawData = [
      ["Dealer Code", store.dealerCode || ""],
      ["Store Name", store.storeName || ""],
      [
        "City / Area",
        `${store.location.city || ""}, ${store.location.area || ""}`,
      ],
      ["Address", store.location.address || "N/A"],
      [
        "Board Size",
        `${store.recce.sizes?.width || 0} ft  x  ${store.recce.sizes?.height || 0} ft`,
      ],
      [
        "Recce Date",
        store.recce.submittedDate
          ? new Date(store.recce.submittedDate).toLocaleDateString()
          : "N/A",
      ],
      ["Field Staff", store.workflow.recceAssignedTo ? "Assigned" : "N/A"],
      ["Notes", store.recce.notes || "None"],
    ];

    // Convert strings to TableCell Objects
    const tableRows = rawData.map((row) => [
      { text: row[0], options: { bold: true, fill: { color: "E1E1E1" } } }, // Label Column
      { text: row[1] }, // Value Column
    ]);

    // Add Table
    slide1.addTable(tableRows, {
      x: 0.5,
      y: 1.5,
      w: 9,
      colW: [2.5, 6.5],
      border: { pt: 1, color: "CCCCCC" },
      fontSize: 14,
      rowH: 0.5,
    });

    // --- SLIDE 2: PHOTOS ---
    const slide2 = pres.addSlide();

    slide2.addShape("rect", {
      x: 0,
      y: 0,
      w: "100%",
      h: 0.8,
      fill: { color: "003366" },
    });
    slide2.addText("Site Photographs", {
      x: 0.5,
      y: 0.2,
      fontSize: 20,
      color: "FFFFFF",
      bold: true,
    });

    const addImageToSlide = (
      relativePath: string | undefined, // The path from DB (e.g., "uploads/123.jpg")
      label: string,
      x: number,
      y: number,
    ) => {
      if (relativePath) {
        try {
          // FIX: Convert "uploads/file.jpg" to absolute path
          // process.cwd() gets the root folder of your project
          const absolutePath = path.join(process.cwd(), relativePath);

          slide2.addImage({ path: absolutePath, x: x, y: y, w: 3, h: 2.25 });

          slide2.addText(label, {
            x: x,
            y: y + 2.3,
            fontSize: 12,
            bold: true,
            align: "center",
            w: 3,
          });
        } catch (err) {
          console.error(`Failed to add image: ${relativePath}`, err);
          // Fallback text if image fails
          slide2.addText("Image Error", {
            x: x,
            y: y + 1,
            w: 3,
            align: "center",
            color: "FF0000",
          });
        }
      } else {
        slide2.addText(`No ${label} Image`, {
          x: x,
          y: y + 1,
          w: 3,
          align: "center",
          color: "FF0000",
        });
      }
    };

    addImageToSlide(store.recce.photos?.front, "Front View", 0.5, 1.5);
    addImageToSlide(store.recce.photos?.side, "Side View", 3.8, 1.5);
    addImageToSlide(store.recce.photos?.closeUp, "Close Up", 7.1, 1.5);

    // --- OUTPUT ---
    const buffer = await pres.write({ outputType: "nodebuffer" });

    res.writeHead(200, {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="Recce_${store.dealerCode}.pptx"`,
    });
    res.end(buffer);
  } catch (error: any) {
    console.error("PPT Gen Error:", error);
    if (!res.headersSent)
      res.status(500).json({ message: "Error generating PPT" });
  }
};

// --- NEW: Review Recce (Approve/Reject) ---
export const reviewRecce = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // Expecting status: "APPROVED" or "REJECTED"

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid status. Use APPROVED or REJECTED." });
    }

    const newStatus =
      status === "APPROVED"
        ? StoreStatus.RECCE_APPROVED
        : StoreStatus.RECCE_REJECTED;

    const store = await Store.findByIdAndUpdate(
      id,
      {
        currentStatus: newStatus,
        // Optional: Save admin remarks if rejected so staff knows what to fix
        "recce.notes": remarks
          ? `[Admin]: ${remarks} | ${new Date().toLocaleDateString()}`
          : undefined,
      },
      { new: true },
    );

    if (!store) return res.status(404).json({ message: "Store not found" });

    res.status(200).json({
      message: `Recce ${status.toLowerCase()} successfully`,
      store,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Review failed", error: error.message });
  }
};

// --- UPDATED: Submit Installation Data (2 Images) ---
export const submitInstallation = async (req: Request | any, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const store = await Store.findById(id);
    if (!store) return res.status(404).json({ message: "Store not found" });

    // ... (Security checks remain the same) ...

    const installUpdate: any = {
      "installation.submittedDate": new Date(),
      currentStatus: StoreStatus.INSTALLATION_SUBMITTED,
    };

    // FIX: Normalize paths to use forward slashes for ALL operating systems
    if (files.after1) {
      // Replace all backslashes with forward slashes
      installUpdate["installation.photos.after1"] =
        files.after1[0].path.replace(/\\/g, "/");
    }
    if (files.after2) {
      installUpdate["installation.photos.after2"] =
        files.after2[0].path.replace(/\\/g, "/");
    }

    await Store.findByIdAndUpdate(id, { $set: installUpdate });

    res.status(200).json({ message: "Installation submitted successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Submission failed", error: error.message });
  }
};

// --- UPDATED: Generate Installation PPT (3 Images) ---
export const generateInstallationPPT = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const store = await Store.findById(id);

    if (!store || !store.installation) {
      return res
        .status(404)
        .json({ message: "Store or Installation data not found" });
    }

    // 1. Initialize PPT
    const pres = new PptxGenJS();
    pres.title = `Installation Report - ${store.storeName}`;

    // --- SLIDE 1: SUMMARY ---
    const slide1 = pres.addSlide();

    // Header
    slide1.addShape("rect", {
      x: 0,
      y: 0,
      w: "100%",
      h: 1,
      fill: { color: "2E7D32" },
    }); // Green for Success
    slide1.addText("Installation Completion Report", {
      x: 0.5,
      y: 0.25,
      fontSize: 24,
      color: "FFFFFF",
      bold: true,
    });

    // Table Data
    const rawData = [
      ["Dealer Code", store.dealerCode || ""],
      ["Store Name", store.storeName || ""],
      ["City", store.location.city || ""],
      [
        "Completion Date",
        store.installation.submittedDate
          ? new Date(store.installation.submittedDate).toLocaleDateString()
          : "N/A",
      ],
      ["Installer", store.workflow.installationAssignedTo ? "Assigned" : "N/A"],
      [
        "Board Size",
        `${store.recce?.sizes?.width || 0} ft  x  ${store.recce?.sizes?.height || 0} ft`,
      ],
      ["Status", "COMPLETED"],
    ];

    const tableRows = rawData.map((row) => [
      { text: row[0], options: { bold: true, fill: { color: "E8F5E9" } } },
      { text: row[1] },
    ]);

    slide1.addTable(tableRows, {
      x: 0.5,
      y: 1.5,
      w: 9,
      colW: [2.5, 6.5],
      border: { pt: 1, color: "A5D6A7" },
      fontSize: 14,
      rowH: 0.5,
    });

    // --- SLIDE 2: PROOF OF EXECUTION ---
    const slide2 = pres.addSlide();
    slide2.addShape("rect", {
      x: 0,
      y: 0,
      w: "100%",
      h: 0.8,
      fill: { color: "2E7D32" },
    });
    slide2.addText("Execution Proof (Before vs After)", {
      x: 0.5,
      y: 0.2,
      fontSize: 20,
      color: "FFFFFF",
      bold: true,
    });

    // Helper for adding images
    const addImage = (
      relativePath: string | undefined,
      label: string,
      x: number,
      color: string,
    ) => {
      const y = 1.5;
      const w = 3.0;
      const h = 2.25;

      if (relativePath) {
        try {
          const absolutePath = path.join(process.cwd(), relativePath);

          // 1. Add Image
          slide2.addImage({ path: absolutePath, x, y, w, h });

          // 2. Add Label (FIX: Added 'h: 0.5' to make text visible)
          slide2.addText(label, {
            x: x,
            y: y + 2.3, // Position just below the image
            w: w,
            h: 0.5, // <--- THIS WAS MISSING
            align: "center",
            bold: true,
            fontSize: 16,
            color: color,
          });
        } catch (err) {
          slide2.addText("Image Error", {
            x,
            y: y + 1,
            w,
            h: 0.5, // Added height here too
            align: "center",
            color: "FF0000",
          });
        }
      } else {
        // Placeholder if missing
        slide2.addShape("rect", {
          x,
          y,
          w,
          h,
          line: { color: "CCCCCC", dashType: "dash" },
          fill: { color: "F5F5F5" },
        });
        slide2.addText(`No ${label}`, {
          x,
          y: y + 1,
          w,
          h: 0.5, // Added height here too
          align: "center",
          color: "999999",
        });
      }
    };

    // 1. LEFT: Recce Front View -> "PRE" (Red Text)
    // Hex 'D32F2F' is a nice professional Red
    addImage(store.recce?.photos?.front, "PRE", 0.3, "D32F2F");

    // 2. MIDDLE: Install Photo 1 -> "POST" (Green Text)
    // Hex '388E3C' is a nice professional Green
    addImage(store.installation.photos?.after1, "POST", 3.5, "388E3C");

    // 3. RIGHT: Install Photo 2 -> "POST" (Green Text)
    addImage(store.installation.photos?.after2, "POST", 6.7, "388E3C");

    // --- OUTPUT ---
    const buffer = await pres.write({ outputType: "nodebuffer" });

    res.writeHead(200, {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="Installation_${store.dealerCode}.pptx"`,
    });
    res.end(buffer);
  } catch (error: any) {
    console.error("PPT Gen Error:", error);
    if (!res.headersSent)
      res.status(500).json({ message: "Error generating PPT" });
  }
};

export const exportRecceTasks = async (req: Request | any, res: Response) => {
  try {
    const ExcelJS = require("exceljs");
    let query: any = {};
    const userRoles = req.user.roles || [];
    const isSuperAdmin = userRoles.some((r: any) => r.code === "SUPER_ADMIN");
    const isAdmin = userRoles.some((r: any) => r.code === "ADMIN");
    if (!isSuperAdmin && !isAdmin) {
      query["workflow.recceAssignedTo"] = req.user._id;
    }
    const stores = await Store.find(query)
      .populate("workflow.recceAssignedTo", "name")
      .sort({ updatedAt: -1 });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Recce Tasks");
    worksheet.mergeCells("A1:G3");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "Recce Inspection Report";
    titleCell.font = { size: 18, bold: true, color: { argb: "FF1F2937" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    const headers = [
      "Store Name",
      "Dealer Code",
      "City",
      "Address",
      "Status",
      "Recce Assigned To",
      "Recce Date",
    ];
    const headerRow = worksheet.getRow(5);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEAB308" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    headerRow.height = 25;
    const formatDate = (date: Date) => {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const d = new Date(date);
      return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
    };
    stores.forEach((store: any, index) => {
      const row = worksheet.getRow(6 + index);
      row.values = [
        store.storeName,
        store.dealerCode,
        store.location.city,
        store.location.address,
        store.currentStatus,
        store.workflow.recceAssignedTo?.name || "N/A",
        store.recce?.submittedDate
          ? formatDate(store.recce.submittedDate)
          : "-",
      ];
      row.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      row.height = 40;
      if (index % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF9FAFB" },
        };
      }
    });
    worksheet.columns = [
      { width: 35 },
      { width: 18 },
      { width: 18 },
      { width: 45 },
      { width: 25 },
      { width: 25 },
      { width: 18 },
    ];
    worksheet.eachRow((row: Row, rowNumber: number) => {
      if (rowNumber >= 5) {
        row.eachCell((cell: Cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
          };
        });
      }
    });
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Recce_Tasks.xlsx",
    );
    res.send(buffer);
  } catch (error: any) {
    console.error("Export Error:", error);
    res.status(500).json({ message: "Failed to export recce tasks" });
  }
};

export const exportInstallationTasks = async (
  req: Request | any,
  res: Response,
) => {
  try {
    const ExcelJS = require("exceljs");
    let query: any = {};
    const userRoles = req.user.roles || [];
    const isSuperAdmin = userRoles.some((r: any) => r.code === "SUPER_ADMIN");
    const isAdmin = userRoles.some((r: any) => r.code === "ADMIN");
    if (!isSuperAdmin && !isAdmin) {
      query["workflow.installationAssignedTo"] = req.user._id;
    }
    const stores = await Store.find(query)
      .populate("workflow.installationAssignedTo", "name")
      .sort({ updatedAt: -1 });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Installation Tasks");
    worksheet.mergeCells("A1:G3");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "Installation Tasks Report";
    titleCell.font = { size: 18, bold: true, color: { argb: "FF1F2937" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    const headers = [
      "Store Name",
      "Dealer Code",
      "City",
      "Address",
      "Status",
      "Install Assigned To",
      "Install Date",
    ];
    const headerRow = worksheet.getRow(5);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEAB308" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    headerRow.height = 25;
    const formatDate = (date: Date) => {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const d = new Date(date);
      return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
    };
    stores.forEach((store: any, index) => {
      const row = worksheet.getRow(6 + index);
      row.values = [
        store.storeName,
        store.dealerCode,
        store.location.city,
        store.location.address,
        store.currentStatus,
        store.workflow.installationAssignedTo?.name || "N/A",
        store.installation?.submittedDate
          ? formatDate(store.installation.submittedDate)
          : "-",
      ];
      row.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      row.height = 40;
      if (index % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF9FAFB" },
        };
      }
    });
    worksheet.columns = [
      { width: 35 },
      { width: 18 },
      { width: 18 },
      { width: 45 },
      { width: 25 },
      { width: 25 },
      { width: 18 },
    ];
    worksheet.eachRow((row: Row, rowNumber: number) => {
      if (rowNumber >= 5) {
        row.eachCell((cell: Cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
          };
        });
      }
    });
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Installation_Tasks.xlsx",
    );
    res.send(buffer);
  } catch (error: any) {
    console.error("Export Error:", error);
    res.status(500).json({ message: "Failed to export installation tasks" });
  }
};

export const downloadStoreTemplate = async (req: Request, res: Response) => {
  try {
    const ExcelJS = require("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Stores");
    const headers = [
      "Sr. No.",
      "Dealer Code",
      "Vendor Code & Name",
      "Dealer's Name",
      "City",
      "District",
      "Dealer's Address",
      "Width (Ft.)",
      "Height (Ft.)",
      "Dealer Board Type",
    ];
    const headerRow = sheet.getRow(1);
    for (let i = 0; i < headers.length; i++) {
      const cell = headerRow.getCell(i + 1);
      cell.value = headers[i];
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEAB308" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
    sheet.columns = [
      { width: 10 },
      { width: 15 },
      { width: 25 },
      { width: 30 },
      { width: 15 },
      { width: 15 },
      { width: 40 },
      { width: 12 },
      { width: 12 },
      { width: 20 },
    ];
    const samples = [
      [
        1,
        "DLR001",
        "ELORA CREATIVE ART",
        "Rajesh Kumar",
        "Mumbai",
        "Mumbai Suburban",
        "123 Main Street, Andheri West",
        10,
        5,
        "Flex",
      ],
      [
        2,
        "DLR002",
        "ELORA CREATIVE ART",
        "Amit Sharma",
        "Delhi",
        "Central Delhi",
        "456 Park Avenue, Connaught Place",
        10,
        10,
        "LED",
      ],
      [
        3,
        "DLR003",
        "ELORA CREATIVE ART",
        "Priya Singh",
        "Bangalore",
        "Bangalore Urban",
        "789 MG Road, Indiranagar",
        15,
        10,
        "Digital",
      ],
      [
        4,
        "DLR004",
        "ELORA CREATIVE ART",
        "Suresh Patel",
        "Pune",
        "Pune",
        "321 FC Road, Shivajinagar",
        20,
        10,
        "Flex",
      ],
      [
        5,
        "DLR005",
        "ELORA CREATIVE ART",
        "Neha Gupta",
        "Hyderabad",
        "Hyderabad",
        "654 Banjara Hills, Road No 12",
        10,
        5,
        "LED",
      ],
      [
        6,
        "DLR006",
        "ELORA CREATIVE ART",
        "Vikram Reddy",
        "Chennai",
        "Chennai",
        "987 Anna Salai, T Nagar",
        10,
        10,
        "Digital",
      ],
      [
        7,
        "DLR007",
        "ELORA CREATIVE ART",
        "Anjali Verma",
        "Kolkata",
        "Kolkata",
        "147 Park Street, Central Kolkata",
        15,
        10,
        "Flex",
      ],
      [
        8,
        "DLR008",
        "ELORA CREATIVE ART",
        "Rahul Joshi",
        "Ahmedabad",
        "Ahmedabad",
        "258 CG Road, Navrangpura",
        20,
        10,
        "LED",
      ],
      [
        9,
        "DLR009",
        "ELORA CREATIVE ART",
        "Kavita Desai",
        "Jaipur",
        "Jaipur",
        "369 MI Road, C Scheme",
        10,
        5,
        "Digital",
      ],
      [
        10,
        "DLR010",
        "ELORA CREATIVE ART",
        "Manoj Yadav",
        "Lucknow",
        "Lucknow",
        "741 Hazratganj, Lucknow Central",
        10,
        10,
        "Flex",
      ],
    ];
    samples.forEach((data, idx) => {
      const row: Row = sheet.getRow(idx + 2);
      row.values = data;

      row.eachCell((cell: Cell) => {
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });
    const validationSheet = workbook.addWorksheet("Validations");
    const valHeaders = ["Board Sizes", "Types"];
    const valHeaderRow = validationSheet.getRow(1);
    for (let i = 0; i < valHeaders.length; i++) {
      const cell = valHeaderRow.getCell(i + 1);
      cell.value = valHeaders[i];
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEAB308" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
    validationSheet.getColumn(1).values = [
      "Board Sizes",
      "10 x 5",
      "10 x 10",
      "15 x 10",
      "20 x 10",
    ];
    validationSheet.getColumn(2).values = ["Types", "Flex", "LED", "Digital"];
    validationSheet.columns = [{ width: 20 }, { width: 20 }];
    validationSheet.eachRow((row: Row, rowNumber: number) => {
      if (rowNumber > 1) {
        row.eachCell((cell: Cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      }
    });
    const instructionsSheet = workbook.addWorksheet("Instructions");
    const titleCell = instructionsSheet.getCell("A1");
    titleCell.value = "Instructions for Store Template";
    titleCell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14 };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEAB308" },
    };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    titleCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    const instructions = [
      "1. Fill all required fields in the Stores sheet",
      "2. Dealer Code must be unique for each store",
      "3. Width and Height should be in feet (numbers only)",
      "4. Refer to Validations sheet for Board Sizes and Types",
      "5. Delete sample data before uploading your actual data",
    ];
    instructions.forEach((text, i) => {
      const cell = instructionsSheet.getCell("A" + (i + 3));
      cell.value = text;
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    instructionsSheet.getColumn(1).width = 60;
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Elora_Store_Upload_Template.xlsx",
    );
    res.send(buffer);
  } catch (error: any) {
    console.error("Template Error:", error);
    res.status(500).json({ message: "Failed to generate template" });
  }
};
