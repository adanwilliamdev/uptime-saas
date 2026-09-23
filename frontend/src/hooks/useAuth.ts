"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/types";

interface Credentials {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: Credentials) => {
      const { data } = await api.post<LoginResponse>("/auth/login", credentials);
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem("access_token", data.access_token);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (credentials: Credentials) => {
      const { data } = await api.post<User>("/auth/register", credentials);
      return data;
    },
  });
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
  }
}

export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("access_token"));
}
