import { Request, Response } from "express";
import { conOperation } from "@adminApi/utils/constants";
import {
  ApiFailureResponse,
  ApiSuccessResponse,
} from "@adminApi/helpers/helpers";
import { MysqlError } from "mysql";
import { StatusCodes } from "http-status-codes";

type LocationRow = {
  id: number;
  name: string;
  address: string;
  phone?: string | null;
  mapUrl?: string | null;
  createdAt?: string;
};

const mapRow = (row: LocationRow) => ({
  id: row.id,
  name: row.name,
  address: row.address,
  phone: row.phone || "",
  mapUrl: row.mapUrl || "",
  createdAt: row.createdAt,
});

// Public list for client apps
export const getClientLocations = (_req: Request, res: Response) => {
  const sql = `
    SELECT id, name, address, phone, mapUrl, createdAt
    FROM locations
    ORDER BY createdAt DESC, id DESC
  `;

  conOperation.query(sql, (err: MysqlError | null, rows: LocationRow[]) => {
    if (err) {
      console.error("Failed to fetch locations:", err);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ApiFailureResponse("Failed to fetch locations."));
    }

    return res
      .status(StatusCodes.OK)
      .json(ApiSuccessResponse(rows.map(mapRow), "Locations fetched."));
  });
};
