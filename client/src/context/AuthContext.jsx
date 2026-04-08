import { createContext, useEffect, useMemo, useState } from "react";
import { getMeRequest, loginRequest, updateMyPasswordRequest, updateMyProfileRequest, uploadMyAvatarRequest } from "../services/authService";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem("my_presence_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getMeRequest();
        setUser(currentUser);
      } catch {
        localStorage.removeItem("my_presence_token");
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (credentials) => {
    const data = await loginRequest(credentials);
    localStorage.setItem("my_presence_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const refreshUser = async () => {
    const currentUser = await getMeRequest();
    setUser(currentUser);
    return currentUser;
  };

  const updateProfile = async (payload) => {
    const updatedUser = await updateMyProfileRequest(payload);
    setUser(updatedUser);
    return updatedUser;
  };

  const updatePassword = async (payload) => updateMyPasswordRequest(payload);

  const uploadAvatar = async (file) => {
    const updatedUser = await uploadMyAvatarRequest(file);
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = () => {
    localStorage.removeItem("my_presence_token");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      refreshUser,
      updateProfile,
      updatePassword,
      uploadAvatar,
      logout,
      isAuthenticated: Boolean(user)
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
