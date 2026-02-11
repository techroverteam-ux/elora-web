import mongoose, { Schema, Document } from "mongoose";

export enum StoreStatus {
  UPLOADED = "UPLOADED",
  RECCE_ASSIGNED = "RECCE_ASSIGNED",
  RECCE_SUBMITTED = "RECCE_SUBMITTED",
  RECCE_APPROVED = "RECCE_APPROVED",
  RECCE_REJECTED = "RECCE_REJECTED",
  INSTALLATION_ASSIGNED = "INSTALLATION_ASSIGNED",
  INSTALLATION_SUBMITTED = "INSTALLATION_SUBMITTED",
  INSTALLATION_REJECTED = "INSTALLATION_REJECTED",
  COMPLETED = "COMPLETED",
}

export interface StoreDocument extends Document {
  projectID: string;
  dealerCode: string;
  storeCode?: string;
  storeName?: string;
  vendorCode?: string; // NEW: Added Vendor Code

  location: {
    zone?: string; // NEW
    state?: string; // NEW
    district?: string; // NEW
    city?: string;
    area?: string;
    address?: string;
    pincode?: string;
    coordinates?: { lat: number; lng: number };
  };

  contact: {
    personName?: string;
    mobile?: string;
  };

  // NEW: Commercial Details (PO & Invoice)
  commercials: {
    poNumber?: string;
    poMonth?: string;
    invoiceNumber?: string;
    invoiceRemarks?: string;
    totalCost?: number;
  };

  // NEW: Detailed Costing Breakdown
  costDetails: {
    boardRate?: number;
    totalBoardCost?: number;
    angleCharges?: number;
    scaffoldingCharges?: number;
    transportation?: number;
    flanges?: number;
    lollipop?: number;
    oneWayVision?: number;
    sunboard?: number;
  };

  specs: {
    boardSize?: string;
    type?: string;
    width?: number; // NEW
    height?: number; // NEW
    qty?: number; // NEW
  };

  currentStatus: StoreStatus;

  workflow: {
    recceAssignedTo?: mongoose.Types.ObjectId;
    installationAssignedTo?: mongoose.Types.ObjectId;
    priority: "HIGH" | "MEDIUM" | "LOW";
  };

  recce?: {
    assignedDate?: Date;
    submittedDate?: Date;
    sizes?: { width: number; height: number };
    photos?: { front: string; side: string; closeUp: string };
    notes?: string;
  };

  installation?: {
    assignedDate?: Date;
    submittedDate?: Date;
    photos?: {
      after1?: string;
      after2?: string;
    };
  };
}

const StoreSchema = new Schema<StoreDocument>(
  {
    projectID: { type: String },
    dealerCode: { type: String, required: true, unique: true, index: true },
    storeCode: { type: String },
    storeName: { type: String },
    vendorCode: { type: String }, // NEW

    location: {
      zone: { type: String }, // NEW
      state: { type: String }, // NEW
      district: { type: String }, // NEW
      city: { type: String },
      area: { type: String },
      address: { type: String },
      pincode: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },

    contact: {
      personName: { type: String },
      mobile: { type: String },
    },

    // NEW SECTION
    commercials: {
      poNumber: { type: String },
      poMonth: { type: String },
      invoiceNumber: { type: String },
      invoiceRemarks: { type: String },
      totalCost: { type: Number },
    },

    // NEW SECTION
    costDetails: {
      boardRate: { type: Number },
      totalBoardCost: { type: Number },
      angleCharges: { type: Number },
      scaffoldingCharges: { type: Number },
      transportation: { type: Number },
      flanges: { type: Number },
      lollipop: { type: Number },
      oneWayVision: { type: Number },
      sunboard: { type: Number },
    },

    specs: {
      boardSize: { type: String },
      type: { type: String },
      width: { type: Number }, // NEW
      height: { type: Number }, // NEW
      qty: { type: Number }, // NEW
    },

    currentStatus: {
      type: String,
      enum: Object.values(StoreStatus),
      default: StoreStatus.UPLOADED,
      index: true,
    },

    workflow: {
      recceAssignedTo: { type: Schema.Types.ObjectId, ref: "User" },
      installationAssignedTo: { type: Schema.Types.ObjectId, ref: "User" },
      priority: {
        type: String,
        enum: ["HIGH", "MEDIUM", "LOW"],
        default: "MEDIUM",
      },
    },

    recce: {
      assignedDate: Date,
      submittedDate: Date,
      sizes: { width: Number, height: Number },
      photos: { front: String, side: String, closeUp: String },
      notes: String,
    },

    installation: {
      assignedDate: Date,
      submittedDate: Date,
      photos: {
        after1: String,
        after2: String,
      },
    },
  },
  { timestamps: true },
);

export default mongoose.model<StoreDocument>("Store", StoreSchema);
