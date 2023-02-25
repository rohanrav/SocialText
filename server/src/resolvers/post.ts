import { Post } from "../entities/Post";
import {
  Resolver,
  Mutation,
  Query,
  Arg,
  Int,
  InputType,
  Field,
  Ctx,
  UseMiddleware,
  FieldResolver,
  Root,
  ObjectType,
} from "type-graphql";
import { TContext } from "src/types";
import { isAuth } from "../middleware/isAuth";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { dataLoader }: TContext) {
    return dataLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(@Root() post: Post, @Ctx() { updootLoader, req }: TContext) {
    if (!req.session.userId) {
      return null;
    }

    const updoot = await updootLoader.load({
      postId: post.id,
      userId: req.session.userId,
    });

    return updoot ? updoot.value : null;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req, dataSource }: TContext
  ) {
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;

    const updoot = await Updoot.findOne({
      where: {
        postId,
        userId,
      },
    });

    await dataSource.transaction(async (tm) => {
      if (updoot && updoot.value === realValue) return true;
      const updatedValue = updoot ? realValue * 2 : realValue;
      if (updoot) {
        await tm
          .getRepository(Updoot)
          .increment({ postId, userId }, "value", updatedValue);
      } else if (!updoot) {
        await Updoot.insert({
          userId,
          postId,
          value: updatedValue,
        });
      }
      await tm
        .getRepository(Post)
        .increment({ id: postId }, "points", updatedValue);
      return;
    });
    return true;
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | null> {
    return Post.findOne({ where: { id }, relations: ["creator"] });
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input", () => PostInput) input: PostInput,
    @Ctx() { req }: TContext
  ): Promise<Post | null> {
    return Post.create({ ...input, creatorId: req.session.userId }).save();
  }

  @Mutation(() => Post)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String) title: string,
    @Arg("text", () => String) text: string,
    @Ctx() { req }: TContext
  ): Promise<Post | null> {
    const post = await Post.findOneBy({ id });
    if (!post) {
      throw new Error("Post does not exist");
    }
    if (post.creatorId !== req.session.userId) {
      throw new Error("Not authorized to update this post");
    }

    const updatedPost = await Post.update({ id }, { title, text });
    return updatedPost.raw[0];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: TContext
  ): Promise<Boolean> {
    const post = await Post.findOne({ where: { id } });
    if (!post) throw new Error("Post does not exist");
    if (post.creatorId !== req.session.userId) {
      throw new Error("Not authorized to delete this post");
    }
    await Post.delete({ id, creatorId: req.session.userId });
    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { dataSource }: TContext
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const replacements: any[] = [realLimitPlusOne];
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }

    const posts = await dataSource.query(
      `
      select p.*
      from post p
      ${cursor ? `where p."createdAt" < $2` : ""}
      order by p."createdAt" DESC
      limit $1
      `,
      replacements
    );

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }
}
