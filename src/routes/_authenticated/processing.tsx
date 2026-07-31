import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProgressBar } from "@/components/blueprint/progress-bar";

export const Route = createFileRoute("/_authenticated/processing")({
  head: () => ({
    meta: [
      { title: "Generating your blueprint — Publisher Blueprint" },
      { name: "description", content: "Compiling your executive owned-audience readiness blueprint." },
      { property: "og:title", content: "Generating your blueprint" },
      { property: "og:description", content: "Compiling your executive readiness blueprint." },
    ],
  }),
  component: Processing,
});

const STAGES = [
  "Reading your organizational profile",
  "Scoring audience and content maturity",
  "Modeling distribution dependencies",
  "Sequencing your 90-day roadmap",
];

function Processing() {
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setStage((value) => value + 1), 900);
    const timeout = window.setTimeout(() => navigate({ to: "/dashboard", replace: true }), 3800);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [navigate]);

  const progress = Math.min(100, ((stage + 1) / STAGES.length) * 100);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center space-y-8">
      <div className="space-y-3">
        <p className="text-eyebrow">Compiling</p>
        <h1 className="text-display text-4xl">Building your blueprint</h1>
        <p className="text-sm text-muted-foreground">This takes a few moments. Please keep this window open.</p>
      </div>
      <ProgressBar value={progress} tone="brass" />
      <ul className="space-y-3">
        {STAGES.map((item, index) => (
          <li
            key={item}
            className={`text-sm transition-colors ${index <= stage ? "text-foreground" : "text-muted-foreground/50"}`}
          >
            {index < stage ? "✓ " : "· "}
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
