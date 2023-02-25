import { Box, Heading, Text } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import { EditDeletePostButtons } from "../../components/EditDeletePostButtons";
import { Layout } from "../../components/Layout";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { useGetPostFromUrl } from "../../utils/useGetPostFromUrl";
import Card from "react-bootstrap/Card";
import { useCurrentUserQuery } from "../../generated/graphql";
import { Spinner } from "react-bootstrap";

interface PostProps {}

const Post: React.FC<PostProps> = ({}) => {
  const [{ data, fetching, error }] = useGetPostFromUrl();
  const [{ data: meData }] = useCurrentUserQuery();

  if (fetching) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    );
  }

  if (error) {
    return <div>{error.message}</div>;
  }

  if (!data?.post) {
    return (
      <Layout>
        <Box>Could not find post</Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Card>
        <Card.Body>
          <Card.Title>{data?.post?.title}</Card.Title>
          <Card.Text>{data?.post?.text}</Card.Text>
        </Card.Body>
        {meData?.currentUser?.id == data?.post?.creator.id && (
          <EditDeletePostButtons
            id={data?.post?.id}
            creatorId={data?.post?.creator.id}
          />
        )}
      </Card>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: false })(Post);
