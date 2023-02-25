import { Request, Response } from "express";
import { Session, SessionData } from "express-session";
import Redis from "ioredis";
import { DataSource } from "typeorm";
import { createUpdootLoader } from "./utils/createUpdootLoader";
import { createLoader } from "./utils/createUserLoader";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export type TContext = {
  req: Request & { session: Session & Partial<SessionData> };
  res: Response;
  redis: Redis;
  dataSource: DataSource;
  dataLoader: ReturnType<typeof createLoader>;
  updootLoader: ReturnType<typeof createUpdootLoader>;
};
