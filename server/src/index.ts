import "reflect-metadata";

import { COOKIE_NAME, __prod__ } from "./constants";
import express from "express";

import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginLandingPageLocalDefault } from "apollo-server-core";
import { buildSchema } from "type-graphql";
import { HelloResolver, PostResolver, UserResolver } from "./resolvers";

import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { TContext } from "./types";
import cors from "cors";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Post } from "./entities/Post";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const main = async () => {
  const AppDataSource = new DataSource({
    type: "postgres",
    username: "postgres",
    password: "password",
    database: "lireddit",
    entities: [User, Post],
    logging: !__prod__,
    synchronize: true,
  });
  await AppDataSource.initialize();

  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis();

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: __prod__,
        sameSite: "lax",
      },
      secret: "keyboard cat",
      resave: false,
      saveUninitialized: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): TContext => ({
      req,
      res,
      redis,
      dataSource: AppDataSource,
    }),
    csrfPrevention: true,
    cache: "bounded",
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

main().catch((e) => console.error(e));
