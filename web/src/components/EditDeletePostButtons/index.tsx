import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { Box, Flex, IconButton } from "@chakra-ui/react";
import Link from "next/link";
import React from "react";
import {
  useCurrentUserQuery,
  useDeletePostMutation,
} from "../../generated/graphql";
import NextLink from "next/link";
import Card from "react-bootstrap/Card";

interface EditDeletePostButtonsProps {
  id: number;
  creatorId: number;
}

export const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({
  id,
  creatorId,
}) => {
  const [{ data: meData, fetching }] = useCurrentUserQuery();
  const [, deletePost] = useDeletePostMutation();

  const shouldDisableBtn = meData?.currentUser?.id !== creatorId;
  return (
    <Card.Footer>
      <Box ml={"auto"}>
        <Flex justify={"space-between"}>
          <NextLink href={`/post/edit/[id]`} as={`/post/edit/${id}`}>
            <IconButton
              icon={<EditIcon />}
              aria-label="Edit post"
              cursor="pointer"
              boxSize={6}
              color="grey"
              disabled={shouldDisableBtn}
            />
          </NextLink>
          <IconButton
            icon={<DeleteIcon />}
            aria-label="Delete post"
            color="grey"
            onClick={() => {
              deletePost({ id });
            }}
            cursor="pointer"
            boxSize={6}
            disabled={shouldDisableBtn}
          />
        </Flex>
      </Box>
    </Card.Footer>
  );
};
