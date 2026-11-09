"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { CultureSubmissionDTO } from "../types";

interface ProposeHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSubmission: CultureSubmissionDTO) => void;
}

/**
 * Compatibility shell for the legacy demo manager. The original modal hard-coded
 * hamlets and an unverified 80-point recognition threshold, and called an
 * unaudited legacy action. New submissions live in the PH03 campaign workflow.
 */
export function ProposeHouseholdModal({ isOpen, onClose }: ProposeHouseholdModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chuyển sang hồ sơ bình xét theo đợt"
      description="Biểu mẫu cũ đã dừng để tránh tạo hồ sơ không gắn đợt, nguồn và quy tắc được xác minh."
      footer={<Button variant="outline" size="sm" onClick={onClose}>Đóng</Button>}
    >
      <p className="text-sm text-slate-700">
        Hãy lập hồ sơ từ màn hình bình xét đang sử dụng, chọn đúng đợt và địa bàn được phân công.
      </p>
      <Link href="/van-hoa/gia-dinh-van-hoa" onClick={onClose}
        className="mt-3 inline-flex rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900">
        Đến màn hình bình xét
      </Link>
    </Modal>
  );
}
