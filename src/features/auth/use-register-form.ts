"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RegisterFormValues } from "./types";

const registerSchema = z.object({
  fullName: z.string().min(2, "El nombre es obligatorio."),
  email: z.string().email("Correo inválido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.")
});

export function useRegisterForm() {
  return useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: ""
    },
    mode: "onSubmit"
  });
}

