import { NavBar } from "../NavBar";
import React, { PropsWithChildren } from "react";
import { Wrapper } from "../Wrapper";
import { VariantSizes } from "../Wrapper/variantConfig";

interface LayoutProps {
  variant?: VariantSizes;
}

export const Layout: React.FC<PropsWithChildren<LayoutProps>> = ({
  children,
  variant = "medium",
}) => {
  return (
    <>
      <NavBar />
      <Wrapper variant={variant}>{children}</Wrapper>
    </>
  );
};
