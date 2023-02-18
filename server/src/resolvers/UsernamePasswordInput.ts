import { InputType, Field } from "type-graphql";

@InputType()
export class UsernamePasswordInput {
  @Field(() => String)
  username: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  password: string;
}
