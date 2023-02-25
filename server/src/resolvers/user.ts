import { User } from "../entities/User";
import {
  Resolver,
  Mutation,
  Ctx,
  Arg,
  Field,
  ObjectType,
  Query,
  FieldResolver,
  Root,
} from "type-graphql";
import { TContext } from "src/types";
import argon from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendMail } from "../utils/sendMail";
import { v4 } from "uuid";

@ObjectType()
class FieldError {
  @Field(() => String)
  field: string;

  @Field(() => String)
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: TContext) {
    if (req.session.userId === user.id) {
      return user.email;
    }
    return "";
  }

  @Query(() => User, { nullable: true })
  async currentUser(@Ctx() { req }: TContext): Promise<User | null> {
    if (!req.session.userId) {
      return null;
    }

    return User.findOneBy({ id: req.session.userId });
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options", () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { req, dataSource }: TContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) return { errors };

    const hashedPassword = await argon.hash(options.password);

    let user;
    try {
      const result = await dataSource
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: options.username,
          email: options.email,
          password: hashedPassword,
        })
        .returning("*")
        .execute();

      user = result.raw[0];
    } catch (error) {
      if (error.detail.includes("already exists")) {
        return {
          errors: [
            {
              field: "username",
              message: "Username already taken",
            },
          ],
        };
      }
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse, { nullable: true })
  async login(
    @Arg("usernameOrEmail", () => String) usernameOrEmail: string,
    @Arg("password", () => String) password: string,
    @Ctx() { req }: TContext
  ): Promise<UserResponse> {
    const user = await User.findOneBy(
      usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "That username or email doesn't exist",
          },
        ],
      };
    }
    const valid = await argon.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "Incorrect password",
          },
        ],
      };
    }

    req.session.userId = user.id;
    await req.session.save();

    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: TContext): Promise<Boolean> {
    return new Promise((resolve) => {
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Ctx() { redis }: TContext,
    @Arg("email", () => String) email: string
  ): Promise<Boolean> {
    const user = await User.findOneBy({ email });
    if (!user) {
      return false;
    }

    const token = v4();
    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      "EX",
      1000 * 60 * 60 * 24 * 3
    );

    sendMail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">Reset password</a>`
    );

    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token", () => String) token: string,
    @Arg("newPassword", () => String) newPassword: string,
    @Ctx() { redis, req }: TContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "Password must be greater than 2 characters",
          },
        ],
      };
    }

    const redisKey = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(redisKey);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "Token expired",
          },
        ],
      };
    }

    const userIdNum = parseInt(userId);
    const user = await User.findOneBy({ id: userIdNum });
    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "User no longer exists",
          },
        ],
      };
    }

    await User.update(
      { id: userIdNum },
      { password: await argon.hash(newPassword) }
    );

    await redis.del(redisKey);

    req.session.userId = user.id;

    return { user };
  }
}
