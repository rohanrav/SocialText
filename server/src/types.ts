import { Request, Response } from "express";
import Redis from "ioredis";
import { DataSource } from "typeorm";

export type TContext = {
  req: Request;
  res: Response;
  redis: Redis;
  dataSource: DataSource;
};
