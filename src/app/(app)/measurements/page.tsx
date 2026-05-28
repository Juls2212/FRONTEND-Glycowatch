"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { ContextualAssistantPrompt } from "@/components/intelligence/contextual-assistant-prompt";
import { LatestMeasurementCard } from "@/features/measurements/components/latest-measurement-card";
import { ManualMeasurementForm } from "@/features/measurements/components/manual-measurement-form";
import { MeasurementsTable } from "@/features/measurements/components/measurements-table";
import { deleteMeasurement, fetchLatestMeasurement, fetchMeasurements } from "@/features/measurements/api";
import { LatestMeasurement, MeasurementItem, MeasurementsFilters } from "@/features/measurements/types";
import { useContextualAssistantPrompt } from "@/hooks/use-contextual-assistant-prompt";
import { HttpError } from "@/types/api";

const PAGE_SIZE = 10;

function formatFilterRange(filters: MeasurementsFilters): string {
  if (!filters.from && !filters.to) {
    return "Mostrando las lecturas más recientes.";
  }

  if (filters.from && filters.to) {
    return `Periodo filtrado: ${filters.from} a ${filters.to}.`;
  }

  if (filters.from) {
    return `Periodo filtrado desde ${filters.from}.`;
  }

  return `Periodo filtrado hasta ${filters.to}.`;
}

function buildPageSummary(
  latestMeasurement: LatestMeasurement | null,
  measurements: MeasurementItem[],
  totalElements: number
): string {
  if (!latestMeasurement) {
    return "Todavía no hay mediciones registradas. Puedes empezar agregando una lectura manual.";
  }

  const previous = measurements[1];
  if (!previous) {
    return `Última lectura registrada: ${latestMeasurement.glucoseValue} ${latestMeasurement.unit}.`;
  }

  const delta = latestMeasurement.glucoseValue - previous.glucoseValue;
  const direction =
    Math.abs(delta) < 5 ? "se mantiene estable" : delta > 0 ? `subió ${Math.abs(delta).toFixed(1)} mg/dL` : `bajó ${Math.abs(delta).toFixed(1)} mg/dL`;

  return `Tu lectura más reciente ${direction} frente al registro anterior. Historial visible: ${totalElements} mediciones.`;
}

export default function MeasurementsPage() {
  const [latestMeasurement, setLatestMeasurement] = useState<LatestMeasurement | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filters, setFilters] = useState<MeasurementsFilters>({});
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    prompt: assistantPrompt,
    dismissPrompt: dismissAssistantPrompt,
    showPromptOnce
  } = useContextualAssistantPrompt();

  const loadData = async (
    page: number,
    activeFilters: MeasurementsFilters,
    options?: { preserveFeedback?: boolean }
  ) => {
    setError(null);
    if (!options?.preserveFeedback) {
      setSuccess(null);
    }

    try {
      const [latest, pageData] = await Promise.all([
        fetchLatestMeasurement(),
        fetchMeasurements(page, PAGE_SIZE, activeFilters)
      ]);
      setLatestMeasurement(latest);
      setMeasurements(pageData.content);
      setTotalPages(pageData.totalPages);
      setTotalElements(pageData.totalElements);
      setCurrentPage(pageData.currentPage);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudieron cargar las mediciones.";
      setError(message);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      setIsLoading(true);
      await loadData(0, {});
      if (mounted) setIsLoading(false);
    }

    void initialize();
    return () => {
      mounted = false;
    };
  }, []);

  const onApplyFilters = async () => {
    const nextFilters: MeasurementsFilters = {
      from: draftFrom || undefined,
      to: draftTo || undefined
    };
    setFilters(nextFilters);
    setIsLoading(true);
    await loadData(0, nextFilters);
    setIsLoading(false);
  };

  const onClearFilters = async () => {
    setDraftFrom("");
    setDraftTo("");
    const clean: MeasurementsFilters = {};
    setFilters(clean);
    setIsLoading(true);
    await loadData(0, clean);
    setIsLoading(false);
  };

  const onPageChange = async (targetPage: number) => {
    if (targetPage < 0 || targetPage >= totalPages || targetPage === currentPage) return;
    setIsLoading(true);
    await loadData(targetPage, filters);
    setIsLoading(false);
  };

  const onManualCreated = async () => {
    setSuccess("Medición manual agregada correctamente.");
    await loadData(currentPage, filters, { preserveFeedback: true });
    showPromptOnce({
      id: "assistant-first-manual-measurement",
      tone: "success",
      title: "Registro incorporado",
      message: "Tu medición manual ya quedó integrada al historial. Cuando quieras, puedes generar un análisis nuevo con este dato."
    });
  };

  const onDeleteMeasurement = async (measurementId: number) => {
    setPendingDeleteId(measurementId);
  };

  const confirmDeleteMeasurement = async () => {
    if (pendingDeleteId == null) return;

    setError(null);
    setSuccess(null);
    setDeletingId(pendingDeleteId);
    try {
      await deleteMeasurement(pendingDeleteId);
      await loadData(currentPage, filters);
      setSuccess("Medición eliminada correctamente.");
    } catch (err) {
      if (err instanceof HttpError && (err.status === 404 || err.status === 405)) {
        setError("La eliminación todavía no está disponible en el servidor.");
      } else {
        const message = err instanceof Error ? err.message : "No se pudo eliminar la medición.";
        setError(message);
      }
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  };

  const historySummary = useMemo(() => formatFilterRange(filters), [filters]);
  const pageSummary = useMemo(
    () => buildPageSummary(latestMeasurement, measurements, totalElements),
    [latestMeasurement, measurements, totalElements]
  );

  return (
    <div className="app-page measurements-page measurements-phase-three">
      <ContextualAssistantPrompt prompt={assistantPrompt} onDismiss={dismissAssistantPrompt} />
      <header className="measurements-shell-header">
        <div className="measurements-shell-copy">
          <p className="measurements-shell-eyebrow">Registro glucémico</p>
          <h1 className="measurements-shell-title">Mediciones</h1>
          <p className="measurements-shell-subtitle">{pageSummary}</p>
        </div>
        <div className="measurements-shell-meta">
          <span className="status-pill status-registered">Historial clínico</span>
          <span className="status-pill status-active">
            {totalElements > 0 ? `${totalElements} registros` : "Sin registros"}
          </span>
        </div>
      </header>

      {success ? <FeedbackBanner type="success" message={success} /> : null}
      {error ? <FeedbackBanner type="error" message={error} /> : null}

      <div className="measurements-hero-layout">
        <LatestMeasurementCard latestMeasurement={latestMeasurement} recentMeasurements={measurements} />

        <div className="measurements-side-stack">
          <ManualMeasurementForm onCreated={onManualCreated} />
        </div>
      </div>

      <Card className="measurements-history-section">
        <div className="measurements-history-header">
          <div>
            <p className="measurements-card-eyebrow">Seguimiento reciente</p>
            <h2 className="measurements-card-title">Historial de mediciones</h2>
            <p className="measurements-card-copy">
              Revisa tus lecturas ordenadas por fecha y elimina solo las que ya no necesites conservar.
            </p>
          </div>
          <div className="measurements-history-controls" aria-label="Filtros del historial">
            <div className="measurements-history-filter-copy">
              <p className="measurements-card-eyebrow">Filtrar periodo</p>
              <p className="measurements-card-copy">{historySummary}</p>
            </div>
            <div className="filters-grid measurements-history-filters">
              <label className="field">
                <span>Desde</span>
                <input type="date" value={draftFrom} onChange={(event) => setDraftFrom(event.target.value)} />
              </label>
              <label className="field">
                <span>Hasta</span>
                <input type="date" value={draftTo} onChange={(event) => setDraftTo(event.target.value)} />
              </label>
            </div>
            <div className="filters-actions measurements-history-filter-actions">
              <button type="button" className="ghost-button" onClick={onClearFilters}>
                Limpiar
              </button>
              <button type="button" className="primary-button" onClick={onApplyFilters}>
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>

        <MeasurementsTable
          measurements={measurements}
          isLoading={isLoading}
          error={null}
          deletingId={deletingId}
          totalElements={totalElements}
          onDelete={onDeleteMeasurement}
        />

        <div className="measurements-history-footer">
          <span className="soft-text">
            Página {totalPages === 0 ? 0 : currentPage + 1} de {totalPages}
          </span>
          <div className="pagination-wrap">
            <button
              type="button"
              className="ghost-button"
              disabled={currentPage <= 0 || isLoading}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Anterior
            </button>
            <button
              type="button"
              className="ghost-button"
              disabled={totalPages === 0 || currentPage >= totalPages - 1 || isLoading}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={pendingDeleteId != null}
        title="Eliminar medición"
        description="Esta acción no se puede deshacer. ¿Deseas continuar? Asegúrate de que esta medición no sea necesaria para tu seguimiento o análisis futuro."
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        isProcessing={deletingId != null}
        onConfirm={confirmDeleteMeasurement}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
