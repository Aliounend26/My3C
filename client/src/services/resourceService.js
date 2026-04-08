import api from "./api";

export const resourceService = {
  get: async (endpoint) => (await api.get(endpoint)).data,
  post: async (endpoint, payload) => (await api.post(endpoint, payload)).data,
  postForm: async (endpoint, formData) =>
    (
      await api.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
    ).data,
  put: async (endpoint, payload) => (await api.put(endpoint, payload)).data,
  delete: async (endpoint) => (await api.delete(endpoint)).data,
  download: async (endpoint, fallbackFilename = "export.xlsx") => {
    const response = await api.get(endpoint, {
      responseType: "blob"
    });

    const contentDisposition = response.headers["content-disposition"] || "";
    const matchedFilename = contentDisposition.match(/filename="?([^"]+)"?/i);
    const filename = matchedFilename?.[1] || fallbackFilename;
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");

    link.href = blobUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  }
};
