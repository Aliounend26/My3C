const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const assetBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

export const getMediaUrl = (path) => {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }

  return `${assetBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

export const getYoutubeEmbedUrl = (value) => {
  if (!value) return "";
  const trimmed = value.trim();
  const iframeMatch = trimmed.match(/src=(['"])(.*?)\1/i);
  if (iframeMatch?.[2]) {
    return iframeMatch[2];
  }

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const videoId = url.pathname.slice(1);
      if (videoId) return `https://www.youtube.com/embed/${videoId}${url.search}`;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com" || hostname.endsWith("youtube.com")) {
      if (url.pathname === "/watch") {
        const videoId = url.searchParams.get("v");
        if (videoId) {
          const params = url.searchParams.toString();
          return `https://www.youtube.com/embed/${videoId}${params ? `?${params}` : ""}`;
        }
      }

      const embedMatch = url.pathname.match(/^\/embed\/(.+)$/);
      if (embedMatch?.[1]) {
        return url.href;
      }

      const shortsMatch = url.pathname.match(/^\/shorts\/(.+)$/);
      if (shortsMatch?.[1]) {
        return `https://www.youtube.com/embed/${shortsMatch[1]}`;
      }
    }
  } catch (error) {
    // ignore invalid URL and return raw trimmed value
  }

  return trimmed;
};
