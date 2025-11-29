import express from "express";
import { authenticateToken } from "@adminApi/middleware/auth-tokens";
import {
  createLocation,
  deleteLocation,
  getLocations,
  updateLocation,
} from "./controller";

const adminLocationRouter = express.Router();

adminLocationRouter.post("/", authenticateToken, createLocation);
adminLocationRouter.get("/list/:page/:size", authenticateToken, getLocations);
adminLocationRouter.put("/:id", authenticateToken, updateLocation);
adminLocationRouter.delete("/:id", authenticateToken, deleteLocation);

export default adminLocationRouter;
