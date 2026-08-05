import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getIsAdmin } from "@/lib/admin/admin.functions";
import { useAuth } from "@/hooks/use-auth";

/** Whether the signed-in user holds the internal admin role (server-verified). */
export function useIsAdmin() {
  const fetchIsAdmin = useServerFn(getIsAdmin);
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["admin", "is-admin", user?.id ?? null],
    queryFn: () => fetchIsAdmin(),
    // Without a session there is no bearer token, so the server fn 401s.
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return data?.isAdmin === true;
}

