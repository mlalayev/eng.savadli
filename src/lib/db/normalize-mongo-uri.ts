export function normalizeMongoUri(raw: string): string {
  // Accept mongodb:// and mongodb+srv:// URIs and ensure username/password are URL-encoded.
  // This helps when the password contains characters like @ : / ? # & % etc.
  const trimmed = raw.trim().replace(/^"+|"+$/g, "");
  if (!trimmed.startsWith("mongodb://") && !trimmed.startsWith("mongodb+srv://")) return trimmed;

  try {
    const url = new URL(trimmed);
    const username = url.username ? decodeURIComponent(url.username) : "";
    const password = url.password ? decodeURIComponent(url.password) : "";
    if (username) url.username = encodeURIComponent(username);
    if (password) url.password = encodeURIComponent(password);
    return url.toString();
  } catch {
    // If URL parsing fails, return as-is.
    return trimmed;
  }
}

