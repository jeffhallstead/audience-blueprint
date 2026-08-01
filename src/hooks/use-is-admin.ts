import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getIsAdmin } from "@/lib/admin/admin.functions";

/** Whether the signed-in user holds the internal admin role (server-verified). */
export function useIsAdmin() {
  const fetchIsAdmin = useServerFn(getIsAdmin);
  const { data } = useQuery({
    queryKey: ["admin", "is-admin"],
    queryFn: () => fetchIsAdmin(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return data?.isAdmin === true;
}
