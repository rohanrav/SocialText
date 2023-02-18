import React from "react";
import { Box } from "@chakra-ui/react";
import { VariantSizes, variantConfig } from "./variantConfig";

interface Props {
  children: React.ReactNode;
  variant?: VariantSizes;
}

export const Wrapper: React.FC<Props> = ({ children, variant = "small" }) => {
  return (
    <Box mt={8} mx="auto" maxW={variantConfig.maxW[variant]} w="100%">
      {children}
    </Box>
  );
};
