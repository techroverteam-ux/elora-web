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
  dealerCode: string; // NEW: The Unique ID
  storeCode?: string; // Now Optional
  storeName?: string;

  location: {
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

  specs: {
    boardSize?: string;
    type?: string;
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
    photos?: { final: string };
  };
}

const StoreSchema = new Schema<StoreDocument>(
  {
    projectID: { type: String },

    // PRIMARY KEY SWITCH: dealerCode is now the unique identifier
    dealerCode: { type: String, required: true, unique: true, index: true },
    storeCode: { type: String }, // Optional

    storeName: { type: String },

    location: {
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

    specs: {
      boardSize: { type: String },
      type: { type: String },
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
      photos: { final: String },
    },
  },
  { timestamps: true },
);

export default mongoose.model<StoreDocument>("Store", StoreSchema);
