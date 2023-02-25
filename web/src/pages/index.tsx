import {
  Box,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React, { useState } from "react";
import { EditDeletePostButtons } from "../components/EditDeletePostButtons";
import { Layout } from "../components/Layout";
import { UpdootSection } from "../components/UpdootSection";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import Spinner from "react-bootstrap/Spinner";

import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";

const Index: React.FC = () => {
  const [variables, setVariables] = useState<{
    limit: number;
    cursor: string | null;
  }>({
    limit: 15,
    cursor: null,
  });
  const [{ data, fetching, error }] = usePostsQuery({
    variables,
  });
  const toast = useToast();

  if (error) {
    toast({
      title: "Error!",
      description: error.graphQLErrors[0]?.message,
      status: "error",
      duration: 500,
      isClosable: true,
    });
  }

  if ((!fetching && !data) || error) {
    console.error(`error: ${JSON.stringify(error)}`);
    return (
      <>
        <div>you got query failed for some reason</div>
        <div>{JSON.stringify(error)}</div>
      </>
    );
  }

  return (
    <Layout>
      <Stack spacing={8}>
        {!data && fetching ? (
          <Spinner animation="border" role="status" />
        ) : (
          <Row xs={1} md={2} className="g-4">
            {data!.posts.posts.map((p) => {
              if (!p) return null;
              return (
                <Col key={p.id}>
                  <Card>
                    <Card.Header>
                      <UpdootSection post={p} />
                    </Card.Header>
                    <Card.Body>
                      <Card.Title>
                        <NextLink href="/post/[id]" as={`/post/${p.id}`}>
                          <Link>{p.title}</Link>
                        </NextLink>
                      </Card.Title>
                      <Card.Text>{p.textSnippet}</Card.Text>
                    </Card.Body>
                    <EditDeletePostButtons id={p.id} creatorId={p.creator.id} />
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Stack>
      {data && data.posts.hasMore ? (
        <Flex align={"center"}>
          <Button
            style={{ margin: "auto", marginTop: "2rem", marginBottom: "2rem" }}
            disabled={fetching}
            onClick={() =>
              setVariables({
                limit: variables.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              })
            }
            variant="secondary"
          >
            Load More
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: false })(Index);
