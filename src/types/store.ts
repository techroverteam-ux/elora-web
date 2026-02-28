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

export interface Store {
  _id: string;
  projectID: string;
  storeId: string; // NEW: Auto-generated Store ID
  dealerCode: string;
  storeCode?: string;
  storeName: string;
  vendorCode?: string;
  clientCode?: string;
  clientId?: string;

  location: {
    zone?: string;
    state?: string;
    district?: string;
    city: string;
    area: string;
    address: string;
    pincode?: string;
    coordinates?: { lat: number; lng: number };
  };

  contact?: {
    personName?: string;
    mobile?: string;
  };

  commercials?: {
    poNumber?: string;
    poMonth?: string;
    invoiceNumber?: string;
    invoiceRemarks?: string;
    totalCost?: number;
  };

  costDetails?: {
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

  specs?: {
    boardSize?: string;
    type?: string;
    width?: number;
    height?: number;
    qty?: number;
  };

  remark?: string;
  imagesAttached?: boolean;

  currentStatus: StoreStatus;

  workflow: {
    recceAssignedTo?: { _id: string; name: string; email: string };
    recceAssignedBy?: { _id: string; name: string; email: string };
    installationAssignedTo?: { _id: string; name: string; email: string };
    installationAssignedBy?: { _id: string; name: string; email: string };
    priority: "HIGH" | "MEDIUM" | "LOW";
  };

  recce?: {
    assignedDate?: string;
    submittedDate?: string;
    initialPhotos?: string[];
    reccePhotos?: Array<{
      photo: string;
      measurements: { width: number; height: number; unit: string };
      elements?: Array<{ elementId?: string; elementName: string; quantity: number }>;
    }>;
    notes?: string;
    submittedBy?: string;
  };

  installation?: {
    assignedDate?: string;
    submittedDate?: string;
    photos?: Array<{
      reccePhotoIndex: number;
      installationPhoto: string;
    }>;
  };

  createdAt: string;
  updatedAt: string;
}
