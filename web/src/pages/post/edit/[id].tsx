import React from "react";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../../../utils/createUrqlClient";
import { Box } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import router, { useRouter } from "next/router";
import { InputField } from "../../../components";
import { Layout } from "../../../components/Layout";
import { useUpdatePostMutation } from "../../../generated/graphql";
import { useGetPostFromUrl } from "../../../utils/useGetPostFromUrl";
import { Button } from "react-bootstrap";

const EditPost = ({}) => {
  const router = useRouter();
  const intId =
    typeof router.query.id === "string" ? parseInt(router.query.id) : -1;
  const [{ data, fetching, error }] = useGetPostFromUrl();
  const [, updatePost] = useUpdatePostMutation();

  if (fetching) {
    return (
      <Layout>
        <div>loading...</div>
      </Layout>
    );
  }

  if (error) {
    return <div>{error.message}</div>;
  }

  return (
    <Layout variant="small">
      <Formik
        initialValues={{
          title: data?.post?.title || "",
          text: data?.post?.text || "",
        }}
        onSubmit={async (values, { setErrors }) => {
          await updatePost({ ...values, id: intId });
          router.back();
        }}
      >
        {({ isSubmitting }) => {
          return (
            <Form>
              <InputField name="title" placeholder="title" label="Title" />
              <Box mt={4}>
                <InputField
                  name="text"
                  placeholder="text..."
                  label="Body"
                  textarea
                />
              </Box>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                style={{ marginTop: "8px", width: "100%" }}
              >
                Update Post
              </Button>
            </Form>
          );
        }}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(EditPost);
