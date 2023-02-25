import "dotenv-safe/config";
import express from "express";
import "reflect-metadata";
import { COOKIE_NAME, __prod__ } from "./constants";

import { ApolloServerPluginLandingPageLocalDefault } from "apollo-server-core";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver, PostResolver, UserResolver } from "./resolvers";

import connectRedis from "connect-redis";
import cors from "cors";
import session from "express-session";
import Redis from "ioredis";
import path from "path";
import { DataSource } from "typeorm";
import { Post } from "./entities/Post";
import { Updoot } from "./entities/Updoot";
import { User } from "./entities/User";
import { TContext } from "./types";
import { createUpdootLoader } from "./utils/createUpdootLoader";
import { createLoader } from "./utils/createUserLoader";

const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [User, Post, Updoot],
  logging: !__prod__,
  synchronize: true,
  migrations: [path.join(__dirname, "./migrations/*")],
});

const main = async () => {
  await AppDataSource.initialize();
  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);

  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
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
        domain: __prod__ ? ".socialtext.site" : undefined,
      },
      secret: process.env.SESSION_SECRET,
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
      dataLoader: createLoader(),
      updootLoader: createUpdootLoader(),
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

  app.listen(parseInt(process.env.PORT), () => {
    console.log(`server started on localhost:${process.env.PORT}`);
  });
};

main().catch((e) => console.error(e));

export default AppDataSource;
