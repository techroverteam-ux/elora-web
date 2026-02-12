import express from "express";
import { createEnquiry, getAllEnquiries } from "./enquiry.controller";

const router = express.Router();

router.post("/", createEnquiry);
router.get("/", getAllEnquiries);

export default router;
