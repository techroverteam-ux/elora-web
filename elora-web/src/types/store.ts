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
  dealerCode: string; // Added this
  storeCode?: string;
  storeName: string;

  location: {
    city: string;
    area: string;
    address: string;
    pincode?: string;
    coordinates?: { lat: number; lng: number };
  };

  // This was missing!
  specs?: {
    boardSize: string;
    type?: string;
  };

  currentStatus: StoreStatus;

  workflow: {
    recceAssignedTo?: { _id: string; name: string; email: string };
    installationAssignedTo?: { _id: string; name: string; email: string };
    priority: "HIGH" | "MEDIUM" | "LOW";
  };

  // Optional: If you need to show recce details on frontend later
  recce?: {
    assignedDate?: string;
    submittedDate?: string;
    sizes?: { width: number; height: number };
    photos?: { front: string; side: string; closeUp: string };
    notes?: string;
  };

  createdAt: string;
}
