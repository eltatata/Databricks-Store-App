import type { Response } from 'express';
import type { PaginationMeta } from '../interfaces/api.interface';

export function sendOk<T>(response: Response, data: T, meta?: PaginationMeta): void {
  response.status(200).json(meta ? { data, meta } : { data });
}

export function sendCreated<T>(response: Response, data: T): void {
  response.status(201).json({ data });
}

export function sendNoContent(response: Response): void {
  response.status(204).send();
}
