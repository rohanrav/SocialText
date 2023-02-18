import React from "react";
import { Formik, Form } from "formik";
import { Button, Box, Flex, Link } from "@chakra-ui/react";
import { InputField, Wrapper } from "../components";
import { toErrorMap } from "../utils/toErrorMap";
import { useLoginMutation } from "../generated/graphql";
import { useRouter } from "next/router";
import { createUrqlClient } from "../utils/createUrqlClient";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";

const Login: React.FC = () => {
  const router = useRouter();
  const [_, login] = useLoginMutation();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ usernameOrEmail: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          const response = await login(values);
          if (response.data?.login?.errors) {
            setErrors(toErrorMap(response.data.login.errors));
          } else if (response.data?.login?.user) {
            router.push("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="usernameOrEmail"
              placeholder="username or email"
              label="Username or Email"
            />
            <InputField
              name="password"
              placeholder="password"
              label="Password"
              type="password"
            />
            <Flex alignItems="center" justifyContent="space-between">
              <Button
                type="submit"
                mt={4}
                colorScheme="teal"
                isLoading={isSubmitting}
              >
                Login
              </Button>
              <NextLink href="/forgot-password">
                <Link>forgot password?</Link>
              </NextLink>
            </Flex>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Login);
