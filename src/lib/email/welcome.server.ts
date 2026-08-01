const WELCOME_PATH = "/welcome";

const ALLOWED_ORIGINS = [
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)?jeffhallstead\.com$/i,
];

export function resolveWelcomeUrl(origin: string | undefined): string {
  if (origin && ALLOWED_ORIGINS.some((pattern) => pattern.test(origin))) {
    return `${origin}${WELCOME_PATH}`;
  }
  return `https://jeffhallstead.com${WELCOME_PATH}`;
}
