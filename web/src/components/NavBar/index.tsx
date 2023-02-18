import React, { useEffect, useState } from "react";
import { Flex, Box, Link, Button } from "@chakra-ui/react";
import NextLink from "next/link";
import {
  useCurrentUserQuery,
  useLogoutMutation,
} from "../../generated/graphql";
import { isServer } from "../../utils/isServer";

export const NavBar: React.FC = () => {
  const [isServer, setIsServer] = useState(true);
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  const [{ data, fetching }] = useCurrentUserQuery({
    pause: isServer,
  });
  useEffect(() => setIsServer(false), []);
  let body = null;

  if (fetching) {
  } else if (!data?.currentUser) {
    body = (
      <>
        <NextLink href="/login">
          <Link mr={2}>login</Link>
        </NextLink>
        <NextLink href="/register">
          <Link>register</Link>
        </NextLink>
      </>
    );
  } else {
    body = (
      <Flex>
        <Box mr={2}>{data.currentUser.username}</Box>
        <Button
          variant="link"
          isLoading={logoutFetching}
          onClick={() => {
            logout({});
          }}
        >
          logout
        </Button>
      </Flex>
    );
  }

  return (
    <Flex bg="tan" p={4}>
      <Box ml={"auto"}>{body}</Box>
    </Flex>
  );
};
