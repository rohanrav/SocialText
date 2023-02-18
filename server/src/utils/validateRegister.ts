import { UsernamePasswordInput } from "../resolvers/UsernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput) => {
  if (!options.email.includes("@")) {
    return [
      {
        field: "email",
        message: "Invlid email",
      },
    ];
  }

  if (options.username.includes("@")) {
    return [
      {
        field: "username",
        message: "Username can't contain an @",
      },
    ];
  }

  if (options.username.length <= 3) {
    return [
      {
        field: "username",
        message: "Username must be at least 3 characters long",
      },
    ];
  }

  if (options.password.length <= 3) {
    return [
      {
        field: "password",
        message: "Password must be at least 3 characters long",
      },
    ];
  }

  return null;
};
