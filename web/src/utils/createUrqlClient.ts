import {
  dedupExchange,
  Exchange,
  fetchExchange,
  stringifyVariables,
} from "urql";
import {
  LogoutMutation,
  CurrentUserQuery,
  CurrentUserDocument,
  LoginMutation,
  RegisterMutation,
  DeletePostMutationVariables,
} from "../generated/graphql";
import { cacheExchange, Resolver, Cache } from "@urql/exchange-graphcache";
import { betterUpdateQuery } from "./betterUpdateQuery";
import Router from "next/router";
import { pipe, tap } from "wonka";
import gql from "graphql-tag";
import { isServer } from "./isServer";

const errorExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    return pipe(
      forward(ops$),
      tap(({ error }) => {
        if (error?.message.includes("not authenticated")) {
          Router.replace("/login");
        }
      })
    );
  };

const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;

    const allFields = cache.inspectFields(entityKey);
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    const isInCache = cache.resolve(
      cache.resolve(entityKey, fieldKey) as string,
      "posts"
    );
    info.partial = !isInCache;
    let hasMore = true;

    const results: string[] = [];
    fieldInfos.forEach((fi) => {
      const key = cache.resolve(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(key, "posts") as string[];
      const _hasMore = cache.resolve(key, "hasMore");
      if (!_hasMore) {
        hasMore = _hasMore as boolean;
      }
      results.push(...data);
    });

    return {
      __typename: "PaginatedPosts",
      hasMore,
      posts: results,
    };
  };
};

const invalidateAllPosts = (cache: Cache) => {
  const allFields = cache.inspectFields("Query");
  const fieldInfos = allFields.filter((info) => info.fieldName === "posts");
  fieldInfos.forEach((fi) => {
    cache.invalidate("Query", "posts", fi.arguments || {});
  });
};

export const createUrqlClient = (ssrExchange: any, ctx: any) => ({
  url: process.env.NEXT_PUBLIC_API_URL as string,
  exchanges: [
    dedupExchange,
    cacheExchange({
      resolvers: {
        Query: {
          posts: cursorPagination(),
        },
      },
      updates: {
        Mutation: {
          deletePost: (_result, args, cache, info) => {
            cache.invalidate({
              __typename: "Post",
              id: (args as DeletePostMutationVariables).id,
            });
          },
          vote: (_result, args, cache, info) => {
            const { value, postId } = args as any;
            const data = cache.readFragment(
              gql`
                fragment _ on Post {
                  id
                  points
                  voteStatus
                }
              `,
              {
                id: postId,
              } as any
            );
            if (data) {
              if (data.voteStatus === value) {
                return;
              }
              const dataPoints = data.points as number;
              const newValue = dataPoints + (!data.voteStatus ? 1 : 2) * value;
              cache.writeFragment(
                gql`
                  fragment __ on Post {
                    points
                    voteStatus
                  }
                `,
                {
                  id: postId,
                  points: newValue,
                  voteStatus: value,
                } as any
              );
            }
          },
          createPost: (_result, args, cache, info) => {
            invalidateAllPosts(cache);
          },
          logout: (_result, args, cache, info) => {
            betterUpdateQuery<LogoutMutation, CurrentUserQuery>(
              cache,
              { query: CurrentUserDocument },
              _result,
              () => ({ currentUser: null })
            );
          },
          login: (_result, args, cache, info) => {
            betterUpdateQuery<LoginMutation, CurrentUserQuery>(
              cache,
              { query: CurrentUserDocument },
              _result,
              (result, query) => {
                if (result?.login?.errors) {
                  return query;
                } else {
                  return {
                    currentUser: result?.login?.user,
                  };
                }
              }
            );
            invalidateAllPosts(cache);
          },
          register: (_result, args, cache, info) => {
            betterUpdateQuery<RegisterMutation, CurrentUserQuery>(
              cache,
              { query: CurrentUserDocument },
              _result,
              (result, query) => {
                if (result?.register?.errors) {
                  return query;
                } else {
                  return {
                    currentUser: result?.register?.user,
                  };
                }
              }
            );
          },
        },
      },
    }),
    errorExchange,
    ssrExchange,
    fetchExchange,
  ],
  fetchOptions: {
    credentials: "include" as const,
    headers:
      isServer() && ctx?.req?.headers?.cookie
        ? { cookie: ctx?.req?.headers?.cookie }
        : undefined,
  },
});
