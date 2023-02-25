import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Flex, IconButton, Text } from "@chakra-ui/react";
import React, { useState } from "react";
import { PostSnippetFragment, useVoteMutation } from "../../generated/graphql";

interface UpdootSectionProps {
  post: PostSnippetFragment;
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
  const [loadingState, setLoadingState] = useState<
    "updoot-loading" | "downdoot-loading" | "not-loading"
  >("not-loading");
  const [, vote] = useVoteMutation();

  return (
    <Flex direction="row" justifyContent={"space-between"} alignItems="center">
      <IconButton
        icon={<ChevronUpIcon />}
        aria-label="Upvote"
        boxSize={6}
        onClick={async () => {
          if (post.voteStatus === 1) return;
          setLoadingState("updoot-loading");
          await vote({
            postId: post.id,
            value: 1,
          });
          setLoadingState("not-loading");
        }}
        cursor={loadingState === "updoot-loading" ? "wait" : "pointer"}
        backgroundColor={post.voteStatus === 1 ? "green" : undefined}
        color={post.voteStatus === 1 ? "white" : undefined}
      />

      <Text>{post.points}</Text>
      <IconButton
        icon={<ChevronDownIcon />}
        aria-label="Downvote"
        boxSize={6}
        onClick={async () => {
          if (post.voteStatus === -1) return;

          setLoadingState("downdoot-loading");
          await vote({
            postId: post.id,
            value: -1,
          });
          setLoadingState("not-loading");
        }}
        cursor={loadingState === "downdoot-loading" ? "wait" : "pointer"}
        backgroundColor={post.voteStatus === -1 ? "red" : undefined}
        color={post.voteStatus === -1 ? "white" : undefined}
      />
    </Flex>
  );
};
