export const variantConfig: {
  maxW: {
    [key in VariantSizes]: string;
  };
} = {
  maxW: {
    small: "400px",
    medium: "800px",
  },
};

export type VariantSizes = "small" | "medium";
