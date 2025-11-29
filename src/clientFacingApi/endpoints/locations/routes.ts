import express from "express";
import { getClientLocations } from "./controller";

const locationRouter = express.Router();

locationRouter.get("/list", getClientLocations);

export default locationRouter;
