import api from "./api";

export const loginRequest = async (credentials) => {
  const { data } = await api.post("/auth/login", credentials);
  return data;
};

export const getMeRequest = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};

export const updateMyProfileRequest = async (payload) => {
  const { data } = await api.put("/auth/me", payload);
  return data;
};

export const updateMyPasswordRequest = async (payload) => {
  const { data } = await api.put("/auth/me/password", payload);
  return data;
};

export const uploadMyAvatarRequest = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file);

  const { data } = await api.post("/auth/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return data;
};
