"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LoginFormValues } from "./types";

const loginSchema = z.object({
  email: z.string().email("Correo inválido."),
  password: z.string().min(6, "La contraseña es obligatoria.")
});

export function useLoginForm() {
  return useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    },
    mode: "onSubmit"
  });
}

