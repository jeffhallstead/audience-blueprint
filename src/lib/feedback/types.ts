/** Client-safe feedback vocabulary shared by the widget, server fn and admin panel. */

export const FEEDBACK_SENTIMENTS = [
  { value: "works_well", label: "Works well", hint: "Something you liked" },
  { value: "confusing", label: "Confusing", hint: "Hard to understand" },
  { value: "bug", label: "Bug", hint: "Something is broken" },
  { value: "idea", label: "Idea", hint: "A suggestion" },
] as const;

export type FeedbackSentiment = (typeof FEEDBACK_SENTIMENTS)[number]["value"];

export const FEEDBACK_SENTIMENT_VALUES: FeedbackSentiment[] = FEEDBACK_SENTIMENTS.map((s) => s.value);

export const FEEDBACK_SENTIMENT_LABEL: Record<string, string> = Object.fromEntries(
  FEEDBACK_SENTIMENTS.map((s) => [s.value, s.label]),
);

export const FEEDBACK_COMMENT_MAX = 1000;

export type AdminFeedbackRow = {
  id: string;
  userId: string;
  email: string | null;
  fullName: string | null;
  sentiment: string;
  comment: string;
  page: string | null;
  createdAt: string;
};
