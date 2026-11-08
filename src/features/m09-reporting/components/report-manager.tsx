"use client";

import React, { useState } from "react";
import { ReportSnapshotSelector } from "./report-snapshot-selector";
import { SnapshotDetailsCard } from "./snapshot-details-card";
import { SnapshotLineageTable } from "./snapshot-lineage-table";
import { FinalizeSnapshotModal } from "./finalize-snapshot-modal";
import type { ReportSnapshotDTO, SnapshotLineageDTO } from "../types";

export interface ReportManagerProps {
  readonly initialSnapshots: ReportSnapshotDTO[];
  readonly userPermissions: readonly string[];
  readonly userRoles: readonly string[];
}

export function ReportManager({
  initialSnapshots,
  userPermissions,
  userRoles,
}: ReportManagerProps) {
  const [snapshots, setSnapshots] = useState<ReportSnapshotDTO[]>(initialSnapshots);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSnapshots.length > 0 ? initialSnapshots[0].id : null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canFinalize =
    userPermissions.includes("m09:snapshot:sign") ||
    userPermissions.includes("m09:sign_snapshot") ||
    userRoles.includes("LANH_DAO_XA") ||
    userPermissions.includes("m00:admin");

  const selectedSnapshot = snapshots.find((s) => s.id === selectedId) || null;
  const isLiveView = selectedId === null;

  // Mock lineage for display when snapshot selected
  const lineage: SnapshotLineageDTO[] = selectedSnapshot
    ? [
        {
          id: "lin-01",
          snapshotId: selectedSnapshot.id,
          sourceTable: "work_items",
          sourceId: "10000000-0000-0000-0000-000000000001",
          sourceVersion: 1,
          createdAt: selectedSnapshot.createdAt,
        },
        {
          id: "lin-02",
          snapshotId: selectedSnapshot.id,
          sourceTable: "submissions",
          sourceId: "sub00000-0000-0000-0000-000000000001",
          sourceVersion: 1,
          createdAt: selectedSnapshot.createdAt,
        },
      ]
    : [];

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
