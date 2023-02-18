import { Post } from "../entities/Post";
import { Resolver, Mutation, Query, Arg, Int } from "type-graphql";

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  posts(): Promise<Post[]> {
    return Post.find();
  }

  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | null> {
    return Post.findOneBy({ id });
  }

  @Mutation(() => Post)
  async createPost(
    @Arg("title", () => String) title: string
  ): Promise<Post | null> {
    return Post.create({ title }).save();
  }

  @Mutation(() => Post)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOneBy({ id });
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      await Post.update({ id }, { title });
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("id", () => Int) id: number): Promise<Boolean> {
    try {
      await Post.delete({ id });
    } catch (e) {
      console.error(e);
      return false;
    }
    return true;
  }
}
