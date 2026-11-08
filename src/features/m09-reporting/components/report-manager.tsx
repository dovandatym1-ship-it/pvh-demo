"use client";

import React, { useState, useEffect } from "react";
import { ReportSnapshotSelector } from "./report-snapshot-selector";
import { SnapshotDetailsCard } from "./snapshot-details-card";
import { SnapshotLineageTable } from "./snapshot-lineage-table";
import { FinalizeSnapshotModal } from "./finalize-snapshot-modal";
import { getSnapshotLineageAction } from "../server/actions";
import type { ReportSnapshotDTO, SnapshotLineageDTO } from "../types";

export interface ReportManagerProps {
  readonly initialSnapshots: ReportSnapshotDTO[];
  readonly initialLineage?: readonly SnapshotLineageDTO[];
  readonly userPermissions: readonly string[];
  readonly userRoles: readonly string[];
}

export function ReportManager({
  initialSnapshots,
  initialLineage,
  userPermissions,
  userRoles,
}: ReportManagerProps) {
  const [snapshots, setSnapshots] = useState<ReportSnapshotDTO[]>(initialSnapshots);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSnapshots.length > 0 ? initialSnapshots[0].id : null
  );
  const [lineage, setLineage] = useState<SnapshotLineageDTO[]>([
    ...(initialLineage || []),
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canFinalize =
    userPermissions.includes("m09:snapshot:sign") ||
    userPermissions.includes("m09:sign_snapshot") ||
    userRoles.includes("LANH_DAO_XA") ||
    userPermissions.includes("m00:admin");

  const selectedSnapshot = snapshots.find((s) => s.id === selectedId) || null;
  const isLiveView = selectedId === null;

  useEffect(() => {
    if (!selectedId) {
      setLineage([]);
      return;
    }

    // Fast path: if selected snapshot matches initial snapshot and initialLineage exists
    if (
      initialSnapshots.length > 0 &&
      selectedId === initialSnapshots[0]?.id &&
      initialLineage &&
      initialLineage.length > 0
    ) {
      setLineage([...initialLineage]);
      return;
    }

    let isCancelled = false;
    getSnapshotLineageAction(selectedId)
      .then((res) => {
        if (!isCancelled) {
          setLineage(res.ok ? res.data : []);
        }
      })
      .catch(() => {
        if (!isCancelled) setLineage([]);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedId, initialSnapshots, initialLineage]);

  const handleSnapshotCreated = (newSnapshot: ReportSnapshotDTO) => {
    setSnapshots((prev) => [newSnapshot, ...prev]);
    setSelectedId(newSnapshot.id);
  };

  return (
    <div className="space-y-6">
      <ReportSnapshotSelector
        snapshots={snapshots}
        selectedId={selectedId}
        onSelectSnapshot={setSelectedId}
        onOpenFinalizeModal={() => setIsModalOpen(true)}
        canFinalize={canFinalize}
      />

      <SnapshotDetailsCard snapshot={selectedSnapshot} isLiveView={isLiveView} />

      {!isLiveView && <SnapshotLineageTable lineage={lineage} />}

      <FinalizeSnapshotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSnapshotCreated={handleSnapshotCreated}
      />
    </div>
  );
}
