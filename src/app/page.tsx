"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onboardingStorage } from "@/lib/auth/onboarding";
import { useAuthStore } from "@/stores/auth-store";

function resolveAuthenticatedPath(): string {
  return onboardingStorage.isProfilePending() ? "/onboarding" : "/dashboard";
}

export default function HomePage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated || !accessToken) return;
    router.replace(resolveAuthenticatedPath());
  }, [isHydrated, accessToken, router]);

  if (!isHydrated) {
    return (
      <div className="page-center">
        <div className="loader" />
      </div>
    );
  }

  if (accessToken) {
    return (
      <div className="page-center">
        <div className="loader" />
      </div>
    );
  }

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-topbar">
          <div className="landing-brand">
            <span className="landing-brand-mark" aria-hidden="true" />
            <div className="landing-brand-copy">
              <strong>GlycoWatch</strong>
              <span>Monitoreo inteligente para salud glucémica</span>
            </div>
          </div>

          <div className="landing-topbar-actions">
            <Link href="/login" className="ghost-button">
              Iniciar sesión
            </Link>
            <Link href="/register" className="primary-button">
              Crear cuenta
            </Link>
          </div>
        </div>

        <div className="landing-hero-layout">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">Asistencia clínica con IA</p>
            <h1 className="landing-title">Tu monitoreo de glucosa, explicado con más claridad y menos fricción.</h1>
            <p className="landing-subtitle">
              GlycoWatch combina lecturas recientes, alertas y acompañamiento inteligente para convertir tus datos en una experiencia de seguimiento más tranquila, moderna y comprensible.
            </p>

            <div className="landing-hero-actions">
              <Link href="/register" className="primary-button">
                Comenzar ahora
              </Link>
              <Link href="/login" className="ghost-button">
                Ya tengo cuenta
              </Link>
            </div>

            <div className="landing-proof-row">
              <div className="landing-proof-pill">
                <strong>Seguimiento continuo</strong>
                <span>Manual y conectado con dispositivos.</span>
              </div>
              <div className="landing-proof-pill">
                <strong>Interpretación inteligente</strong>
                <span>Lecturas recientes explicadas en lenguaje más claro.</span>
              </div>
            </div>
          </div>

          <div className="landing-hero-panel">
            <div className="landing-hero-card landing-hero-card-primary">
              <p className="landing-card-label">Estado actual</p>
              <div className="landing-card-reading">
                <strong>108 mg/dL</strong>
                <span>Lectura reciente estable</span>
              </div>
              <p className="landing-card-copy">
                GlycoWatch prioriza señales relevantes para ayudarte a entender cambios recientes sin saturarte de métricas.
              </p>
            </div>

            <div className="landing-hero-card-grid">
              <div className="landing-hero-card">
                <p className="landing-card-label">Asistente GlycoWatch</p>
                <strong className="landing-card-title">Resumen clínico más humano</strong>
                <p className="landing-card-copy">Interpretaciones rápidas para revisar evolución, riesgo y contexto reciente.</p>
              </div>
              <div className="landing-hero-card">
                <p className="landing-card-label">Alertas útiles</p>
                <strong className="landing-card-title">Prioridad en lo importante</strong>
                <p className="landing-card-copy">Menos ruido visual, más foco en los cambios que realmente necesitan atención.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-header">
          <p className="landing-eyebrow">Una experiencia más calmada</p>
          <h2 className="landing-section-title">Diseñado para que entiendas tu evolución sin sentir que usas un panel administrativo.</h2>
        </div>

        <div className="landing-feature-grid">
          <article className="landing-feature-card">
            <span className="landing-feature-step">01</span>
            <h3>Lectura actual con contexto</h3>
            <p>Tu estado más reciente aparece primero, acompañado de tendencia, rango visible y contexto de cambios.</p>
          </article>
          <article className="landing-feature-card">
            <span className="landing-feature-step">02</span>
            <h3>Asistencia con IA orientada a salud</h3>
            <p>El sistema resume hallazgos importantes con un tono más clínico, menos técnico y más fácil de entender.</p>
          </article>
          <article className="landing-feature-card">
            <span className="landing-feature-step">03</span>
            <h3>Registro y seguimiento continuo</h3>
            <p>Integra mediciones manuales y lecturas conectadas para mantener una visión reciente y coherente.</p>
          </article>
        </div>
      </section>

      <section className="landing-section landing-section-split">
        <div className="landing-story-panel">
          <p className="landing-eyebrow">IA aplicada al cuidado diario</p>
          <h2 className="landing-section-title">Más que datos: una guía breve para reconocer cambios relevantes.</h2>
          <p className="landing-section-copy">
            GlycoWatch no busca reemplazar el criterio clínico. Busca ayudarte a observar mejor tus mediciones recientes, reducir la carga visual y facilitar una conversación más clara sobre tu seguimiento.
          </p>
        </div>

        <div className="landing-story-stack">
          <div className="landing-story-card">
            <strong>Monitoreo reciente</strong>
            <p>Visualiza de forma inmediata cómo cambia tu glucosa y cuáles lecturas merecen más atención.</p>
          </div>
          <div className="landing-story-card">
            <strong>Alertas e interpretación</strong>
            <p>El sistema combina reglas clínicas y apoyo inteligente para resumir señales prioritarias.</p>
          </div>
          <div className="landing-story-card">
            <strong>Onboarding de salud digital</strong>
            <p>El ingreso inicial te guía para completar el perfil clínico y personalizar mejor la experiencia.</p>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-cta-copy">
          <p className="landing-eyebrow">Empieza hoy</p>
          <h2 className="landing-section-title">Convierte tus mediciones en una experiencia de seguimiento más clara.</h2>
          <p className="landing-section-copy">
            Crea tu cuenta y continúa con un entorno de monitoreo más moderno, más legible y mejor preparado para asistencia inteligente.
          </p>
        </div>

        <div className="landing-cta-actions">
          <Link href="/register" className="primary-button">
            Crear cuenta
          </Link>
          <Link href="/login" className="ghost-button">
            Iniciar sesión
          </Link>
        </div>
      </section>
    </main>
  );
}
