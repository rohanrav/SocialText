import React from "react";
import { Formik, Form } from "formik";
import { Button } from "@chakra-ui/react";
import { InputField, Wrapper } from "../components";
import { toErrorMap } from "../utils/toErrorMap";
import { useRegisterMutation } from "../generated/graphql";
import { useRouter } from "next/router";
import { createUrqlClient } from "../utils/createUrqlClient";
import { withUrqlClient } from "next-urql";

const Register: React.FC = () => {
  const router = useRouter();
  const [_, register] = useRegisterMutation();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ email: "", username: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          const response = await register({ options: values });
          if (response.data?.register?.errors) {
            setErrors(toErrorMap(response.data.register.errors));
          } else if (response.data?.register?.user) {
            router.push("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="email"
              placeholder="username"
              label="Email"
              type="email"
            />
            <InputField
              name="username"
              placeholder="username"
              label="Username"
            />
            <InputField
              name="password"
              placeholder="password"
              label="Password"
              type="password"
            />
            <Button
              type="submit"
              mt={4}
              colorScheme="teal"
              isLoading={isSubmitting}
            >
              Register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Register);
