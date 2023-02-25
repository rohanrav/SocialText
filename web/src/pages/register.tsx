import React from "react";
import { Formik, Form } from "formik";
import { InputField, Wrapper } from "../components";
import { toErrorMap } from "../utils/toErrorMap";
import { useRegisterMutation } from "../generated/graphql";
import { useRouter } from "next/router";
import { createUrqlClient } from "../utils/createUrqlClient";
import { withUrqlClient } from "next-urql";
import { Button } from "react-bootstrap";
import { Layout } from "../components/Layout";

const Register: React.FC = () => {
  const router = useRouter();
  const [_, register] = useRegisterMutation();
  return (
    <Layout variant="small">
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
              placeholder="Email"
              label="Email"
              type="email"
            />
            <InputField
              name="username"
              placeholder="Username"
              label="Username"
            />
            <InputField
              name="password"
              placeholder="Password"
              label="Password"
              type="password"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              style={{ marginTop: "8px", width: "100%" }}
            >
              Register
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(Register);
