import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { MysqlError } from "mysql";
import {
  ApiFailureResponse,
  ApiSuccessResponse,
} from "@adminApi/helpers/helpers";
import { conOperation } from "@adminApi/utils/constants";

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

// Create a new location
export const createLocation = (req: Request, res: Response) => {
  const { name, address, phone, mapUrl } = req.body;

  if (!name || !address) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(ApiFailureResponse("Name and address are required."));
  }

  const sql = `
    INSERT INTO locations (name, address, phone, mapUrl)
    VALUES (?, ?, ?, ?)
  `;

  conOperation.query(
    sql,
    [name, address, phone || null, mapUrl || null],
    (err: MysqlError | null, result: any) => {
      if (err) {
        console.error("Failed to create location:", err);
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json(ApiFailureResponse("Failed to create location."));
      }

      return res
        .status(StatusCodes.OK)
        .json(
          ApiSuccessResponse({ id: result?.insertId }, "Location created.")
        );
    }
  );
};

// List locations with pagination (admin)
export const getLocations = (req: Request, res: Response) => {
  const page = Number(req.params.page) || 1;
  const size = Number(req.params.size) || 20;
  const offset = (page - 1) * size;

  const sql = `
    SELECT id, name, address, phone, mapUrl, createdAt
    FROM locations
    ORDER BY createdAt DESC, id DESC
    LIMIT ? OFFSET ?
  `;

  conOperation.query(
    sql,
    [size, offset],
    (err: MysqlError | null, rows: LocationRow[]) => {
      if (err) {
        console.error("Failed to fetch locations:", err);
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json(ApiFailureResponse("Failed to fetch locations."));
      }

      return res
        .status(StatusCodes.OK)
        .json(ApiSuccessResponse(rows.map(mapRow), "Locations fetched."));
    }
  );
};

// Public list for client apps (no auth)
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

// Update an existing location
export const updateLocation = (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, address, phone, mapUrl } = req.body;

  const sql = `
    UPDATE locations
    SET name = COALESCE(?, name),
        address = COALESCE(?, address),
        phone = COALESCE(?, phone),
        mapUrl = COALESCE(?, mapUrl)
    WHERE id = ?
  `;

  conOperation.query(
    sql,
    [name || null, address || null, phone || null, mapUrl || null, id],
    (err: MysqlError | null, result: any) => {
      if (err) {
        console.error("Failed to update location:", err);
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json(ApiFailureResponse("Failed to update location."));
      }

      if (result?.affectedRows < 1) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ApiFailureResponse("Location not found."));
      }

      return res
        .status(StatusCodes.OK)
        .json(ApiSuccessResponse(null, "Location updated."));
    }
  );
};

// Delete a location
export const deleteLocation = (req: Request, res: Response) => {
  const { id } = req.params;

  const sql = `DELETE FROM locations WHERE id = ?`;

  conOperation.query(sql, [id], (err: MysqlError | null, result: any) => {
    if (err) {
      console.error("Failed to delete location:", err);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(ApiFailureResponse("Failed to delete location."));
    }

    if (result?.affectedRows < 1) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json(ApiFailureResponse("Location not found."));
    }

    return res
      .status(StatusCodes.OK)
      .json(ApiSuccessResponse(null, "Location deleted."));
  });
};
