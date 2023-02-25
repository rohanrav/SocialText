import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useCurrentUserQuery } from "../generated/graphql";

export const useIsAuth = () => {
  const [calledPush, setCalledPush] = useState(false);
  const [{ data, fetching }] = useCurrentUserQuery();
  const router = useRouter();
  useEffect(() => {
    if (!fetching && !data?.currentUser && !calledPush) {
      router.push(`/login?next=${router.pathname}`);
      setCalledPush(true);
    }
  }, [data, fetching, router]);
};
