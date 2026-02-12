import { Request, Response } from "express";
import Store, { StoreStatus } from "../store/store.model";
import User from "../user/user.model";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. KPI COUNTS
    const totalStores = await Store.countDocuments();
    const newStoresToday = await Store.countDocuments({
      createdAt: { $gte: today },
    });
    
    // Recce Logic
    const recceDoneTotal = await Store.countDocuments({
        currentStatus: { $in: [StoreStatus.RECCE_SUBMITTED, StoreStatus.RECCE_APPROVED, StoreStatus.INSTALLATION_ASSIGNED, StoreStatus.INSTALLATION_SUBMITTED, StoreStatus.COMPLETED] }
    });
    const recceDoneToday = await Store.countDocuments({
      "recce.submittedDate": { $gte: today },
    });

    // Installation Logic
    const installationDoneTotal = await Store.countDocuments({
        currentStatus: { $in: [StoreStatus.INSTALLATION_SUBMITTED, StoreStatus.COMPLETED] }
    });
    const installationDoneToday = await Store.countDocuments({
      "installation.submittedDate": { $gte: today },
    });

    // 2. ASSIGNED PERSONNEL STATS
    // Find users with roles RECCE or INSTALLATION and count their assigned stores
    // This is a bit complex, we might need aggregation
    const personnelStats = await User.aggregate([
      {
        $lookup: {
          from: "roles",
          localField: "roles",
          foreignField: "_id",
          as: "roleDetails",
        },
      },
      {
        $match: {
          "roleDetails.code": { $in: ["RECCE", "INSTALLATION"] },
          isActive: true,
        },
      },
      {
        $lookup: {
          from: "stores",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$workflow.recceAssignedTo", "$$userId"] },
                    { $eq: ["$workflow.installationAssignedTo", "$$userId"] },
                  ],
                },
              },
            },
          ],
          as: "assignedStores",
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: { $arrayElemAt: ["$roleDetails.name", 0] },
          assignedCount: { $size: "$assignedStores" },
          completedCount: {
            $size: {
              $filter: {
                input: "$assignedStores",
                as: "store",
                cond: {
                   $or: [
                       // If recce assigned & recce done
                       { $and: [ { $eq: ["$$store.workflow.recceAssignedTo", "$_id"] }, { $in: ["$$store.currentStatus", ["RECCE_SUBMITTED", "RECCE_APPROVED", "COMPLETED"]] } ] },
                       // If installation assigned & installation done
                       { $and: [ { $eq: ["$$store.workflow.installationAssignedTo", "$_id"] }, { $in: ["$$store.currentStatus", ["INSTALLATION_SUBMITTED", "COMPLETED"]] } ] }
                   ]
                }
              }
            }
          }
        },
      },
    ]);

    // 3. RECENT STORES (Limit 5)
    const recentStores = await Store.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("storeName dealerCode location.city currentStatus createdAt");

    res.json({
      kpi: {
        totalStores,
        newStoresToday,
        recceDoneTotal,
        recceDoneToday,
        installationDoneTotal,
        installationDoneToday,
      },
      personnelStats,
      recentStores,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};
