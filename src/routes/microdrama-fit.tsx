import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/microdrama-fit")({
  beforeLoad: () => {
    throw redirect({ to: "/microdrama-greenlight", statusCode: 301 });
  },
});
