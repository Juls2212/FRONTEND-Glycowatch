"use client";

import { useEffect, useState } from "react";
import { Section } from "@/components/ui/section";
import { deleteMeasurement, fetchLatestMeasurement, fetchMeasurements } from "@/features/measurements/api";
import { LatestMeasurement, MeasurementItem, MeasurementsFilters } from "@/features/measurements/types";
import { LatestMeasurementCard } from "@/features/measurements/components/latest-measurement-card";
import { MeasurementsTable } from "@/features/measurements/components/measurements-table";
import { ManualMeasurementForm } from "@/features/measurements/components/manual-measurement-form";
import { HttpError } from "@/types/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FeedbackBanner } from "@/components/ui/feedback-banner";

const PAGE_SIZE = 10;

export default function MeasurementsPage() {
  const [latestMeasurement, setLatestMeasurement] = useState<LatestMeasurement | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<MeasurementsFilters>({});
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async (page: number, activeFilters: MeasurementsFilters) => {
    setError(null);
    setSuccess(null);
    try {
      const [latest, pageData] = await Promise.all([
        fetchLatestMeasurement(),
        fetchMeasurements(page, PAGE_SIZE, activeFilters)
      ]);
      setLatestMeasurement(latest);
      setMeasurements(pageData.content);
      setTotalPages(pageData.totalPages);
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
    setSuccess(null);
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
    setSuccess(null);
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
    setSuccess(null);
    setIsLoading(true);
    await loadData(targetPage, filters);
    setIsLoading(false);
  };

  const onManualCreated = async () => {
    setSuccess("Medición manual agregada correctamente.");
    await loadData(currentPage, filters);
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

  return (
    <div className="dashboard-grid">
      <Section title="Mediciones" subtitle="Seguimiento detallado de tus registros glucémicos">
        <LatestMeasurementCard latestMeasurement={latestMeasurement} />
      </Section>

      <Section title="Filtros y registro manual" subtitle="Filtra por fechas y añade nuevas mediciones">
        <div className="measurements-top-grid">
          <div className="card filters-card">
            <div className="filters-grid">
              <label className="field">
                <span>Desde</span>
                <input type="date" value={draftFrom} onChange={(event) => setDraftFrom(event.target.value)} />
              </label>
              <label className="field">
                <span>Hasta</span>
                <input type="date" value={draftTo} onChange={(event) => setDraftTo(event.target.value)} />
              </label>
            </div>
            <div className="filters-actions">
              <button type="button" className="ghost-button" onClick={onClearFilters}>
                Limpiar
              </button>
              <button type="button" className="primary-button" onClick={onApplyFilters}>
                Aplicar filtros
              </button>
            </div>
          </div>

          <ManualMeasurementForm onCreated={onManualCreated} />
        </div>
      </Section>

      <Section title="Historial de mediciones" subtitle="Resultados paginados y ordenados por fecha">
        {success ? <FeedbackBanner type="success" message={success} /> : null}
        {error ? <FeedbackBanner type="error" message={error} /> : null}
        <MeasurementsTable
          measurements={measurements}
          isLoading={isLoading}
          error={null}
          deletingId={deletingId}
          onDelete={onDeleteMeasurement}
        />

        <div className="pagination-wrap">
          <button
            type="button"
            className="ghost-button"
            disabled={currentPage <= 0 || isLoading}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Anterior
          </button>
          <span className="soft-text">
            Página {totalPages === 0 ? 0 : currentPage + 1} de {totalPages}
          </span>
          <button
            type="button"
            className="ghost-button"
            disabled={totalPages === 0 || currentPage >= totalPages - 1 || isLoading}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Siguiente
          </button>
        </div>
      </Section>

      <ConfirmDialog
        open={pendingDeleteId != null}
        title="Eliminar medición"
        description="Esta acción no se puede deshacer. ¿Deseas continuar?"
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        isProcessing={deletingId != null}
        onConfirm={confirmDeleteMeasurement}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}

