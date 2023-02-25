import { Flex, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import {
  useCurrentUserQuery,
  useLogoutMutation,
} from "../../generated/graphql";

export const NavBar: React.FC = () => {
  const [isServer, setIsServer] = useState(true);
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  const [{ data, fetching }] = useCurrentUserQuery();
  const router = useRouter();
  useEffect(() => setIsServer(false), []);
  let body = null;

  if (fetching) {
    return <></>;
  }

  return (
    <Flex backgroundColor={"rgb(33 37 41)"} justifyContent="center">
      <Navbar bg="dark" variant="dark" style={{ width: "800px" }} sticky="top">
        <Navbar.Brand>
          <NextLink href="/">
            <Link _hover={LinkHoverStyle}>SocialText</Link>
          </NextLink>
        </Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          <Nav className="me-auto">
            <Nav.Link>
              <NextLink href="/create-post">
                <Link _hover={LinkHoverStyle}>Create Post</Link>
              </NextLink>
            </Nav.Link>
            {data?.currentUser && (
              <Nav.Link
                disabled={logoutFetching}
                onClick={async () => {
                  await logout({});
                  router.reload();
                }}
              >
                Logout
              </Nav.Link>
            )}
          </Nav>
          {!data?.currentUser ? (
            <Nav>
              <Nav.Link>
                <NextLink href="/login">
                  <Link _hover={LinkHoverStyle}>Login</Link>
                </NextLink>
              </Nav.Link>
              <Nav.Link>
                <NextLink href="/register">
                  <Link _hover={LinkHoverStyle}>Register</Link>
                </NextLink>
              </Nav.Link>
            </Nav>
          ) : (
            <Navbar.Text>
              Signed in as:{" "}
              <a href="#" style={{ cursor: "auto" }}>
                {data.currentUser.username}
              </a>
            </Navbar.Text>
          )}
        </Navbar.Collapse>
      </Navbar>
    </Flex>
  );
};

export const LinkHoverStyle = {
  textDecoration: "none",
  color: "rgba(255, 255, 255, 0.75)",
};
