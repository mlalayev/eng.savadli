export async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Request failed";
    throw new Error(message);
  }
  return data as T;
}

export async function uploadImageFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/uploads/image", { method: "POST", body: fd });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Upload failed";
    throw new Error(message);
  }
  if (typeof data !== "object" || data === null || !("url" in data) || typeof (data as { url: unknown }).url !== "string") {
    throw new Error("Invalid upload response");
  }
  return (data as { url: string }).url;
}

export async function uploadAudioFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/uploads/audio", { method: "POST", body: fd });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Upload failed";
    throw new Error(message);
  }
  if (typeof data !== "object" || data === null || !("url" in data) || typeof (data as { url: unknown }).url !== "string") {
    throw new Error("Invalid upload response");
  }
  return (data as { url: string }).url;
}
