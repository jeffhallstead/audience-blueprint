import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Deprecated. Nothing is sold on the site anymore — the Blueprint is delivered
 * by Jeff on a booked call — so the pricing page permanently redirects home
 * rather than 404ing existing links and search results.
 */
export const Route = createFileRoute("/pricing")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
  component: () => null,
});
