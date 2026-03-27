"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerRequest } from "@/features/auth/api";
import { useRegisterForm } from "@/features/auth/use-register-form";
import { onboardingStorage } from "@/lib/auth/onboarding";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useRegisterForm();

  const onSubmit = handleSubmit(async (values) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await registerRequest(values);
      onboardingStorage.markProfilePending();
      setSuccess("Cuenta creada correctamente. Inicia sesión para completar tu perfil.");
      setTimeout(() => router.replace("/login"), 900);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear la cuenta.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-eyebrow">Registro</p>
        <h1 className="auth-title">Crea tu cuenta en GlycoWatch</h1>
        <p className="auth-subtitle">Configura tu acceso para comenzar a monitorear tus métricas.</p>

        <form onSubmit={onSubmit} className="auth-form">
          <label className="field">
            <span>Nombre completo</span>
            <input type="text" placeholder="Nombre Apellido" {...register("fullName")} />
            {errors.fullName ? <small>{errors.fullName.message}</small> : null}
          </label>

          <label className="field">
            <span>Correo electrónico</span>
            <input type="email" placeholder="usuario@correo.com" {...register("email")} />
            {errors.email ? <small>{errors.email.message}</small> : null}
          </label>

          <label className="field">
            <span>Contraseña</span>
            <input type="password" placeholder="••••••••" {...register("password")} />
            {errors.password ? <small>{errors.password.message}</small> : null}
          </label>

          {error ? <p className="error-text">{error}</p> : null}
          {success ? <p className="success-text">{success}</p> : null}

          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="auth-switch">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="auth-link">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

