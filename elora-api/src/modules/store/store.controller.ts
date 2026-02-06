import { Request, Response } from "express";
import Store, { StoreStatus } from "./store.model";
import * as XLSX from "xlsx";
import fs from "fs";
import PptxGenJS from "pptxgenjs";

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

// ... Rest of the controller (createStore, getAllStores, etc.) stays exactly the same ...
export const createStore = async (req: Request, res: Response) => {
  try {
    const store = await Store.create(req.body);
    res.status(201).json({ store });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Dealer Code already exists" });
    }
    res
      .status(500)
      .json({ message: "Failed to create store", error: error.message });
  }
};

export const getAllStores = async (req: Request | any, res: Response) => {
  try {
    let query = {};
    const userRole = req.user.role.code;

    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      query = {
        $or: [
          { "workflow.recceAssignedTo": req.user._id },
          { "workflow.installationAssignedTo": req.user._id },
        ],
      };
    }

    const stores = await Store.find(query)
      .populate("workflow.recceAssignedTo", "name email")
      .populate("workflow.installationAssignedTo", "name email")
      .sort({ updatedAt: -1 });

    res.status(200).json({ stores });
  } catch (error: any) {
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

    // 1. Find Store
    const store = await Store.findById(id);
    if (!store) return res.status(404).json({ message: "Store not found" });

    // 2. Security Check: Is this user actually assigned?
    // (Skip check if Admin, but strictly enforce for Field Staff)
    const isAssigned =
      store.workflow.recceAssignedTo?.toString() === req.user._id.toString();
    const isAdmin =
      req.user.role.code === "SUPER_ADMIN" || req.user.role.code === "ADMIN";

    if (!isAssigned && !isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this store" });
    }

    // 3. Prepare Recce Data
    const recceUpdate: any = {
      "recce.submittedDate": new Date(),
      "recce.notes": notes,
      "recce.sizes": {
        width: Number(width),
        height: Number(height),
      },
      // Change status to SUBMITTED so Admin knows it's ready for review
      currentStatus: StoreStatus.RECCE_SUBMITTED,
    };

    // 4. Handle Image Paths (If uploaded)
    // We save the local path (e.g., "uploads/filename.jpg")
    if (files.front) recceUpdate["recce.photos.front"] = files.front[0].path;
    if (files.side) recceUpdate["recce.photos.side"] = files.side[0].path;
    if (files.closeUp)
      recceUpdate["recce.photos.closeUp"] = files.closeUp[0].path;

    // 5. Save
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
      path: string | undefined,
      label: string,
      x: number,
      y: number,
    ) => {
      if (path) {
        // Path safety check
        slide2.addImage({ path: path, x: x, y: y, w: 3, h: 2.25 });
        slide2.addText(label, {
          x: x,
          y: y + 2.3,
          fontSize: 12,
          bold: true,
          align: "center",
          w: 3,
        });
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

// --- NEW: Submit Installation Data ---
export const submitInstallation = async (req: Request | any, res: Response) => {
  try {
    const { id } = req.params;
    // We only need one final photo for installation usually, but let's be flexible
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const store = await Store.findById(id);
    if (!store) return res.status(404).json({ message: "Store not found" });

    // Security Check
    const isAssigned =
      store.workflow.installationAssignedTo?.toString() ===
      req.user._id.toString();
    const isAdmin =
      req.user.role.code === "SUPER_ADMIN" || req.user.role.code === "ADMIN";

    if (!isAssigned && !isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not the assigned installer" });
    }

    // Prepare Update
    const installUpdate: any = {
      "installation.submittedDate": new Date(),
      currentStatus: StoreStatus.INSTALLATION_SUBMITTED,
    };

    // Save Photo (Assuming field name is 'final')
    if (files.final) {
      installUpdate["installation.photos.final"] = files.final[0].path;
    }

    await Store.findByIdAndUpdate(id, { $set: installUpdate });

    res.status(200).json({ message: "Installation submitted successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Submission failed", error: error.message });
  }
};

// --- NEW: Generate Installation PPT ---
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

    // Helper for images
    const addImage = (path: string | undefined, label: string, x: number) => {
      if (path) {
        slide2.addImage({ path, x, y: 1.5, w: 4.5, h: 3.5 });
        slide2.addText(label, {
          x,
          y: 5.1,
          w: 4.5,
          align: "center",
          bold: true,
          fontSize: 14,
        });
      } else {
        slide2.addShape("rect", {
          x,
          y: 1.5,
          w: 4.5,
          h: 3.5,
          line: { color: "CCCCCC", dashType: "dash" },
          fill: { color: "F5F5F5" },
        });
        slide2.addText(`No ${label} Image`, {
          x,
          y: 3,
          w: 4.5,
          align: "center",
          color: "999999",
        });
      }
    };

    // Left: Before (Recce Front View) - Optional but nice context
    addImage(store.recce?.photos?.front, "BEFORE (Recce)", 0.3);

    // Right: After (Installation Final)
    addImage(
      store.installation.photos?.final,
      "AFTER (Final Installation)",
      5.2,
    );

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
