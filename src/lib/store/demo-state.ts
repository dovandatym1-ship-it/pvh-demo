/**
 * Comprehensive TypeScript Store & Golden Seed Definitions for PVH Demo v1.0
 * Compliance: D03 Module Isolation & Multi-Tenancy RLS
 * Covers 14 Routes, 17 Database Tables, and MET-01..05 Metrics Engine
 */

// ----------------------------------------------------------------------
// 1. Core Model Interfaces
// ----------------------------------------------------------------------

export type TenantCode = "XA_A" | "XA_B";

export interface TaskItem {
  id: string;
  code: string;
  title: string;
  domain: string;
  entityTag: string;
  assignee: string;
  dueDate?: string;
  dueText: string;
  isOverdue: boolean;
  status: "Đang xử lý" | "Chưa có hạn" | "Hoàn thành" | "Quá hạn" | "Chờ phản hồi" | "Đã hủy";
  statusBg: string;
  statusColor: string;
  statusBorder: string;
  icon: string;
  metric: "MET-01" | "MET-02" | "MET-03" | "MET-04" | "MET-05";
  tenantCode: TenantCode;
  targetUrl: string;
}

export interface CulturalTitleItem {
  id: string;
  code: string;
  householdHead: string;
  hamlet: string;
  membersCount: number;
  yearsRecognized: number;
  status: "PROPOSED" | "EVALUATED" | "APPROVED" | "REJECTED" | "DRAFT" | "CANCELLED";
  step: "VH1" | "VH2" | "VH3" | "VH4" | "VH5" | "VH6" | "VH7" | "VH8" | "VH9";
  score: number;
  submissionCount: number;
  tenantCode: TenantCode;
}

export interface CdsCellItem {
  code: "CDS-01" | "CDS-02" | "CDS-03" | "CDS-04" | "CDS-05" | "CDS-06";
  name: string;
  value: string;
  numericValue?: number;
  status: "CONFIRMED_ZERO" | "CONFIRMED" | "UNCONFIRMED" | "MISSING" | "NOT_APPLICABLE";
  isConfirmedZero?: boolean;
  naReason?: string;
  meaning: string;
  tenantCode: TenantCode;
}

export interface InspectionRecommendationItem {
  id: string;
  code: string;
  title: string;
  facilityName: string;
  hamlet: string;
  assignee: string;
  dueText: string;
  isOverdue: boolean;
  status: "WAITING_OVERDUE" | "FEEDBACK_UNVERIFIED" | "RESOLVED_CLOSED";
  metric: "MET-05";
  tenantCode: TenantCode;
}

export interface DomesticViolenceItem {
  id: string;
  code: string;
  victimName: string; // PII sensitive
  victimCccd: string; // PII sensitive
  perpetratorName: string;
  relation: string;
  severity: "URGENT_DANGER" | "MEDIUM_RISK" | "LOW_RISK";
  hasRestrainingOrder: boolean;
  status: "INTERVENING" | "REPORTED" | "SAFE_CLOSED";
  hamlet: string;
  tenantCode: TenantCode;
}

// ----------------------------------------------------------------------
// 2. Domain Records (M01, M02, M03, M06, M07, M08, M09, M10)
// ----------------------------------------------------------------------

export interface CitizenSubjectItem {
  id: string;
  code: string;
  fullName: string;
  cccd: string;
  phone: string;
  address: string;
  hamlet: string;
  subjectType: "HOUSEHOLD_HEAD" | "WAR_INVALID" | "SOCIAL_AID_BENEFICIARY" | "ETHNIC_MINORITY" | "CITIZEN";
  status: "ACTIVE" | "MERGED" | "RELOCATED";
  mergedIntoId?: string;
  membersCount: number;
  tenantCode: TenantCode;
}

export interface CitizenResidenceHistoryItem {
  id: string;
  subjectId: string;
  citizenName: string;
  cccd: string;
  actionType: "SPLIT_HOUSEHOLD" | "MERGE_HOUSEHOLD" | "RELOCATE_HAMLET" | "IN_MIGRATION" | "OUT_MIGRATION";
  actionTypeName: string; // Tách hộ | Nhập hộ | Chuyển xóm | Chuyển đến | Chuyển đi
  oldHamlet: string;
  newHamlet: string;
  oldAddress?: string;
  newAddress?: string;
  oldHouseholdCode?: string;
  newHouseholdCode?: string;
  eventDate: string;
  referenceDocument?: string;
  notes?: string;
  tenantCode: TenantCode;
}

export interface LaborContractItem {
  id: string;
  businessName: string;
  taxCode: string;
  totalWorkers: number;
  minWagePaid: number;
  regionalMinWage: number;
  isUnderMinWage: boolean;
  seasonalWorkersCount: number;
  bhxhRegisteredCount: number;
  evaluationPeriod: string;
  tenantCode: TenantCode;
}

export interface LaborDisputeItem {
  id: string;
  code: string;
  requesterName: string;
  requesterRole: "EMPLOYEE" | "EMPLOYER" | "COLLECTIVE";
  respondentName: string;
  disputeContent: string;
  disputeType: "INDIVIDUAL" | "COLLECTIVE"; // D03: COLLECTIVE MUST ESCALATE TO DISTRICT
  receivedDate: string;
  status: "RECEIVED" | "SCHEDULED" | "RESOLVED_SUCCESS" | "RESOLVED_FAILED" | "ESCALATED_DISTRICT";
  outcomeSummary?: string;
  tenantCode: TenantCode;
}

export interface LaborUnderageItem {
  id: string;
  minorName: string;
  cccd: string;
  employer: string;
  allowedJobCategory: "ARTS" | "SPORTS" | "TRADITIONAL_CRAFT";
  dailyHours: number; // <= 4.0h
  healthCertValid: boolean;
  guardianConsent: boolean;
  status: "COMPLIANT" | "WARNING";
  tenantCode: TenantCode;
}

export interface NCCItem {
  id: string;
  code: string;
  fullName: string;
  cccd?: string;
  hamlet?: string;
  category: "THUONG_BINH" | "LIET_SI" | "BENH_BINH" | "CHAT_DOC_HOA_HOC" | "BA_ME_VNAH";
  medalTitle: string;
  monthlyAllowance: number; // PII sensitive money
  hasDeduplicationFlag: boolean; // AC-06 anti-duplication
  deduplicationWarning?: string;
  recentAwards?: string[];
  proposedAward?: string;
  status: "ACTIVE" | "REVIEW_PENDING";
  tenantCode: TenantCode;
}

export interface TuitionExemptionItem {
  id: string;
  studentName: string;
  schoolName: string;
  grade: string;
  category: "POOR_HOUSEHOLD" | "NEAR_POOR" | "DISABILITY" | "ORPHAN";
  exemptionPercent: number;
  supportAmount: number;
  status: "APPROVED" | "PENDING" | "REJECTED";
  semester: string;
  tenantCode: TenantCode;
}

export interface EthnicNotableItem {
  id: string;
  fullName: string;
  ethnicGroup: string;
  hamlet: string;
  yearRecognized: number;
  roleDescription: string;
  stipendAmount: number;
  status: "ACTIVE" | "INACTIVE";
  tenantCode: TenantCode;
}

export interface SchoolItem {
  id: string;
  name: string;
  level: "PRIMARY" | "SECONDARY" | "PRESCHOOL";
  principal: string;
  totalStudents: number;
  civilYear: number;
  schoolYear: string;
  universalizationStandard: "LEVEL_1" | "LEVEL_2" | "LEVEL_3";
  tenantCode: TenantCode;
}

export interface PrivateFacilityItem {
  id: string;
  name: string;
  facilityType: "INDEPENDENT_NURSERY_GROUP" | "INDEPENDENT_KINDERGARTEN_CLASS";
  ownerName: string;
  ownerCccd: string;
  capacity: number;
  currentEnrolled: number;
  totalAreaSqm: number;
  sqmPerChild: number; // >= 1.5m2/child
  fireSafetyCertified: boolean;
  foodSafetyCertified: boolean;
  licensingStatus: "LICENSED" | "PROBATION" | "SUSPENDED" | "DISSOLVED";
  tenantCode: TenantCode;
}

export interface CCLItem {
  id: string;
  name: string;
  directorName: string;
  annualPlanApproved: boolean;
  coursesConducted: number;
  totalLearners: number;
  annualRating: "EXCELLENT" | "GOOD" | "AVERAGE";
  tenantCode: TenantCode;
}

export interface SocialProtectionItem {
  id: string;
  code: string;
  fullName: string;
  cccd: string; // PII
  phone: string; // PII
  hamlet: string;
  aidCategory: string;
  monthlyAmount: number; // PII sensitive money
  diagnosis: string; // PII sensitive health
  paymentStatus: "PAID" | "PENDING";
  tenantCode: TenantCode;
}

export interface FoodSafetyItem {
  id: string;
  facilityName: string;
  inspectionType: "STREET_FOOD" | "SCHOOL_CANTEEN" | "ARTISAN_PRODUCER";
  inspectionDate: string;
  totalScore: number;
  sampleRetention24hPassed: boolean;
  conclusion: "PASSED" | "WARNING_REMEDIAL" | "FAILED_SUSPEND";
  tenantCode: TenantCode;
}

export interface MedicalFacilityItem {
  id: string;
  facilityName: string;
  facilitySubType: "TRADITIONAL_CLINIC" | "SPECIALIZED_CLINIC" | "DRUG_STORE";
  practitionerName: string;
  licenseNumber: string;
  licenseIssueDate: string;
  gppCertified: boolean;
  controlledDrugsLedger: boolean;
  inspectionStatus: "NORMAL" | "WARNING";
  tenantCode: TenantCode;
}

export interface EpidemicLogItem {
  id: string;
  hamlet: string;
  diseaseGroup: "GROUP_A" | "GROUP_B" | "GROUP_C";
  diseaseName: string;
  casesCount: number;
  hospitalizedCount: number;
  deathsCount: number;
  outbreakAlertFlag: boolean;
  logWeek: number;
  logYear: number;
  reportedDate: string;
  tenantCode: TenantCode;
}

export interface ReligiousFacilityItem {
  id: string;
  name: string;
  religionType: "BUDDHISM" | "CATHOLICISM" | "PROTESTANTISM" | "OTHER";
  leaderName: string;
  hamlet: string;
  status: "OFFICIALLY_REGISTERED" | "TEMPORARY_PERMIT";
  tenantCode: TenantCode;
}

export interface IrregularActivityItem {
  id: string;
  code: string;
  location: string;
  natureType: "UNREGISTERED_GATHERING" | "NEW_RELIGIOUS_PHENOMENON" | "SUSPECTED_CULT";
  organizer: string;
  attendeesEstimated: number;
  actionTaken: "GUIDED_OFFICIAL_REGISTRATION" | "DISPERSED_CEASED" | "TRANSFERRED_POLICE";
  status: "OPEN" | "MONITORING" | "RESOLVED";
  tenantCode: TenantCode;
}

export interface EthnicAllocationItem {
  id: string;
  beneficiaryName: string;
  cccd: string;
  hamlet: string;
  programCode: string;
  subProjectType: "HOUSING_AID" | "LAND_AID" | "WATER_SUPPLY" | "JOB_TRANSITION";
  budgetAllocated: number;
  publicPostingStart: string;
  publicPostingEnd: string;
  objectionFiled: boolean;
  disbursementStatus: "POSTED" | "APPROVED" | "DISBURSED" | "REJECTED";
  tenantCode: TenantCode;
}

export interface FestivalRecordItem {
  id: string;
  code: string;
  regType: "OFFICIAL_REGISTRATION" | "NOTIFICATION";
  festivalName: string;
  organizerName: string;
  scale: string;
  startDate: string;
  endDate: string;
  location: string;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "RECORDED";
  tenantCode: TenantCode;
}

export interface CulturalServiceItem {
  id: string;
  serviceType: "PHOTOCOPY_SHOP" | "MOBILE_CINEMA" | "PUBLIC_GAME";
  facilityName: string;
  ownerName: string;
  deviceCount: number;
  contentCommitmentSigned: boolean;
  status: "ACTIVE" | "SUSPENDED";
  tenantCode: TenantCode;
}

export interface SnapshotRevision {
  id: string;
  code: string;
  title: string;
  period: string;
  status: "LOCKED_IMMUTABLE" | "DRAFT";
  hash: string;
  signedBy: string;
  signedAt: string;
  revision: "LIVE" | "REV_1" | "REV_2";
  dataPayload: Record<string, unknown>;
  tenantCode: TenantCode;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  tenantId: string;
  userId: string;
  personaCode: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export interface DomainRecords {
  noiVu: {
    ncc: NCCItem[];
    contracts: LaborContractItem[];
    disputes: LaborDisputeItem[];
    underage: LaborUnderageItem[];
  };
  giaoDuc: {
    schools: SchoolItem[];
    privateFacilities: PrivateFacilityItem[];
    ccl: CCLItem[];
    tuitionExemptions?: TuitionExemptionItem[];
  };
  yTeAnSinh: {
    socialProtection: SocialProtectionItem[];
    foodSafety: FoodSafetyItem[];
    medical: MedicalFacilityItem[];
    epidemics: EpidemicLogItem[];
  };
  danTocTonGiao: {
    religiousFacilities: ReligiousFacilityItem[];
    irregularActivities: IrregularActivityItem[];
    ethnicAllocations: EthnicAllocationItem[];
    ethnicNotables?: EthnicNotableItem[];
  };
  culturalServices: CulturalServiceItem[];
  festivals: FestivalRecordItem[];
}

export interface TenantMetrics {
  met01: number;
  met02: number;
  met03: string;
  met04: string | number;
  met05: number;
}

export interface TenantDemoData {
  metrics: TenantMetrics;
  tasks: TaskItem[];
  culturalTitles: CulturalTitleItem[];
  cdsMatrix: CdsCellItem[];
  inspections: InspectionRecommendationItem[];
  recommendations: InspectionRecommendationItem[];
  domesticViolence: DomesticViolenceItem[];
  masterSubjects: CitizenSubjectItem[];
  residenceHistory: CitizenResidenceHistoryItem[];
  domainRecords: DomainRecords;
  snapshots: SnapshotRevision[];
  reports: SnapshotRevision[];
}

export interface DemoState {
  xa_a: TenantDemoData;
  xa_b: TenantDemoData;
  tenants: Record<string, TenantDemoData>;
  auditLogs: AuditLogEntry[];
  revisions: Record<string, SnapshotRevision>;
  delegationExpired: boolean;
}

// ----------------------------------------------------------------------
// 3. Golden Seeds Definitions
// ----------------------------------------------------------------------

export const GOLDEN_SEED_XA_A: TenantDemoData = {
  metrics: {
    met01: 3,
    met02: 1,
    met03: "50.0%",
    met04: "60%",
    met05: 2,
  },
  tasks: [
    {
      id: "T1",
      code: "TASK-A-001",
      title: "Kiểm tra an toàn PCCC tại Nhà văn hóa thôn Đồng Tiến",
      domain: "Kiểm tra hiện trường",
      entityTag: "PCCC",
      assignee: "Trần Thị Mai (P2)",
      dueDate: "2026-11-06T17:00:00Z",
      dueText: "Hôm qua 17:00",
      isOverdue: false,
      status: "Hoàn thành",
      statusBg: "bg-emerald-50",
      statusColor: "text-emerald-700",
      statusBorder: "border-emerald-200",
      icon: "ShieldCheck",
      metric: "MET-03",
      tenantCode: "XA_A",
      targetUrl: "/kiem-tra",
    },
    {
      id: "T2",
      code: "TASK-A-002",
      title: "Lập danh sách đối tượng bảo trợ xã hội nhận trợ cấp tháng 11/2026",
      domain: "Y tế & An sinh",
      entityTag: "BTXH",
      assignee: "Trần Thị Mai (P2)",
      dueDate: "2026-11-07T11:30:00Z",
      dueText: "Sáng nay 11:30",
      isOverdue: false,
      status: "Hoàn thành",
      statusBg: "bg-emerald-50",
      statusColor: "text-emerald-700",
      statusBorder: "border-emerald-200",
      icon: "CheckCircle2",
      metric: "MET-03",
      tenantCode: "XA_A",
      targetUrl: "/y-te-an-sinh",
    },
    {
      id: "T3",
      code: "TASK-A-003",
      title: "Hoàn thiện hồ sơ hỗ trợ gia đình chính sách người có công xóm Tân Thịnh",
      domain: "Nội vụ & CCHC",
      entityTag: "NCC",
      assignee: "Trần Thị Mai (P2)",
      dueDate: "2026-11-07T12:00:00Z",
      dueText: "12:00 trưa nay (Quá hạn 5h)",
      isOverdue: true,
      status: "Quá hạn",
      statusBg: "bg-rose-50",
      statusColor: "text-rose-700",
      statusBorder: "border-rose-200",
      icon: "AlertCircle",
      metric: "MET-02",
      tenantCode: "XA_A",
      targetUrl: "/noi-vu",
    },
    {
      id: "T4",
      code: "TASK-A-004",
      title: "Rà soát danh sách bình xét Gia đình văn hóa đợt 1 năm 2026",
      domain: "Văn hóa & Gia đình",
      entityTag: "GĐVH",
      assignee: "Trần Thị Mai (P2)",
      dueDate: "2026-11-07T17:00:00Z",
      dueText: "17:00 hôm nay",
      isOverdue: false,
      status: "Đang xử lý",
      statusBg: "bg-amber-50",
      statusColor: "text-amber-700",
      statusBorder: "border-amber-200",
      icon: "Clock",
      metric: "MET-01",
      tenantCode: "XA_A",
      targetUrl: "/van-hoa-gia-dinh",
    },
    {
      id: "T5",
      code: "TASK-A-005",
      title: "Hướng dẫn Tổ CNSCĐ xóm Tân Thịnh kích hoạt chữ ký số & cài đặt C-ThaiNguyen",
      domain: "KHCN & Chuyển đổi số",
      entityTag: "CĐS",
      assignee: "Trần Thị Mai (P2)",
      dueDate: undefined,
      dueText: "Trong tuần này",
      isOverdue: false,
      status: "Chưa có hạn",
      statusBg: "bg-blue-50",
      statusColor: "text-blue-700",
      statusBorder: "border-blue-200",
      icon: "Users",
      metric: "MET-01",
      tenantCode: "XA_A",
      targetUrl: "/khcn-chuyen-doi-so",
    },
    {
      id: "T6",
      code: "TASK-A-006",
      title: "Mở lớp tập huấn kỹ năng số đợt 2 cho người cao tuổi",
      domain: "KHCN & Chuyển đổi số",
      entityTag: "Tập huấn",
      assignee: "Trần Thị Mai (P2)",
      dueDate: undefined,
      dueText: "Đã hủy theo kế hoạch điều chỉnh",
      isOverdue: false,
      status: "Đã hủy",
      statusBg: "bg-slate-50",
      statusColor: "text-slate-500",
      statusBorder: "border-slate-200",
      icon: "AlertCircle",
      metric: "MET-01",
      tenantCode: "XA_A",
      targetUrl: "/khcn-chuyen-doi-so",
    },
  ],
  culturalTitles: [
    {
      id: "H1",
      code: "GĐVH-2026-001",
      householdHead: "Hoàng Văn Nam",
      hamlet: "Xóm Tân Thịnh",
      membersCount: 4,
      yearsRecognized: 3,
      status: "APPROVED",
      step: "VH8",
      score: 95,
      submissionCount: 1,
      tenantCode: "XA_A",
    },
    {
      id: "H2",
      code: "GĐVH-2026-002",
      householdHead: "Nguyễn Thị Lan",
      hamlet: "Xóm Tân Thịnh",
      membersCount: 3,
      yearsRecognized: 2,
      status: "APPROVED",
      step: "VH8",
      score: 88,
      submissionCount: 1,
      tenantCode: "XA_A",
    },
    {
      id: "H3",
      code: "GĐVH-2026-003",
      householdHead: "Trần Văn Bình",
      hamlet: "Xóm Đồng Thịnh",
      membersCount: 5,
      yearsRecognized: 0,
      status: "EVALUATED",
      step: "VH5",
      score: 82,
      submissionCount: 1,
      tenantCode: "XA_A",
    },
    {
      id: "H4",
      code: "GĐVH-2026-004",
      householdHead: "Vũ Đình Trọng",
      hamlet: "Xóm Đức Hòa",
      membersCount: 4,
      yearsRecognized: 1,
      status: "PROPOSED",
      step: "VH4",
      score: 75,
      submissionCount: 2,
      tenantCode: "XA_A",
    },
    {
      id: "H5",
      code: "GĐVH-2026-005",
      householdHead: "Lê Văn Đạt",
      hamlet: "Xóm Tân Thịnh",
      membersCount: 2,
      yearsRecognized: 0,
      status: "DRAFT",
      step: "VH1",
      score: 0,
      submissionCount: 0,
      tenantCode: "XA_A",
    },
    {
      id: "H6",
      code: "GĐVH-2026-006",
      householdHead: "Phạm Văn Cường",
      hamlet: "Xóm Đồng Thịnh",
      membersCount: 4,
      yearsRecognized: 0,
      status: "CANCELLED",
      step: "VH1",
      score: 0,
      submissionCount: 0,
      tenantCode: "XA_A",
    },
  ],
  cdsMatrix: [
    {
      code: "CDS-01",
      name: "Điểm Wifi công cộng bị gián đoạn",
      value: "0",
      numericValue: 0,
      status: "CONFIRMED_ZERO",
      isConfirmedZero: true,
      meaning: "Giá trị 0 được xác nhận hợp lệ",
      tenantCode: "XA_A",
    },
    {
      code: "CDS-02",
      name: "Tỷ lệ công dân độ tuổi LĐ có tài khoản DVC",
      value: "78.4%",
      numericValue: 78.4,
      status: "CONFIRMED",
      meaning: "Đạt chỉ tiêu kế hoạch tỉnh (>= 75%)",
      tenantCode: "XA_A",
    },
    {
      code: "CDS-03",
      name: "Số buổi tập huấn kỹ năng số cộng đồng",
      value: "04 buổi",
      numericValue: 4,
      status: "CONFIRMED",
      meaning: "Hoàn thành kế hoạch quý IV",
      tenantCode: "XA_A",
    },
    {
      code: "CDS-04",
      name: "Tỷ lệ hộ gia đình cài đặt C-ThaiNguyen",
      value: "62.1%",
      numericValue: 62.1,
      status: "UNCONFIRMED",
      meaning: "Đang tổng hợp từ các xóm",
      tenantCode: "XA_A",
    },
    {
      code: "CDS-05",
      name: "Doanh số sản phẩm OCOP qua sàn TMĐT",
      value: "-- Triệu",
      numericValue: undefined,
      status: "MISSING",
      meaning: "Chưa nộp số liệu thống kê",
      tenantCode: "XA_A",
    },
    {
      code: "CDS-06",
      name: "Cổng thanh toán tự động bến xe khách",
      value: "N/A",
      numericValue: undefined,
      status: "NOT_APPLICABLE",
      naReason: "Địa bàn xã không có bến xe khách liên tỉnh",
      meaning: "Không áp dụng đối với cấp xã",
      tenantCode: "XA_A",
    },
  ],
  inspections: [
    {
      id: "KN-01",
      code: "INSP-2026-001",
      title: "Thay thế bình chữa cháy hết hạn tại NVH thôn Đồng Tiến",
      facilityName: "Nhà văn hóa thôn Đồng Tiến",
      hamlet: "Xóm Đồng Thịnh",
      assignee: "Đỗ Minh Đức (P6)",
      dueText: "12:00 trưa nay (Quá hạn 5h)",
      isOverdue: true,
      status: "WAITING_OVERDUE",
      metric: "MET-05",
      tenantCode: "XA_A",
    },
    {
      id: "KN-02",
      code: "INSP-2026-002",
      title: "Rào chắn an toàn sân thể thao đa năng NVH Đức Hòa",
      facilityName: "Sân thể thao NVH Đức Hòa",
      hamlet: "Xóm Đức Hòa",
      assignee: "Phạm Thị Lan (P5)",
      dueText: "Hạn 15/11/2026",
      isOverdue: false,
      status: "FEEDBACK_UNVERIFIED",
      metric: "MET-05",
      tenantCode: "XA_A",
    },
    {
      id: "KN-03",
      code: "INSP-2026-003",
      title: "Lập sổ theo dõi bảo dưỡng trang thiết bị âm thanh NVH Tân Thịnh",
      facilityName: "Nhà văn hóa xóm Tân Thịnh",
      hamlet: "Xóm Tân Thịnh",
      assignee: "Hoàng Văn Tuấn (P4)",
      dueText: "Đã hoàn thành 25/10",
      isOverdue: false,
      status: "RESOLVED_CLOSED",
      metric: "MET-05",
      tenantCode: "XA_A",
    },
  ],
  recommendations: [
    {
      id: "KN-01",
      code: "INSP-2026-001",
      title: "Thay thế bình chữa cháy hết hạn tại NVH thôn Đồng Tiến",
      facilityName: "Nhà văn hóa thôn Đồng Tiến",
      hamlet: "Xóm Đồng Thịnh",
      assignee: "Đỗ Minh Đức (P6)",
      dueText: "12:00 trưa nay (Quá hạn 5h)",
      isOverdue: true,
      status: "WAITING_OVERDUE",
      metric: "MET-05",
      tenantCode: "XA_A",
    },
    {
      id: "KN-02",
      code: "INSP-2026-002",
      title: "Rào chắn an toàn sân thể thao đa năng NVH Đức Hòa",
      facilityName: "Sân thể thao NVH Đức Hòa",
      hamlet: "Xóm Đức Hòa",
      assignee: "Phạm Thị Lan (P5)",
      dueText: "Hạn 15/11/2026",
      isOverdue: false,
      status: "FEEDBACK_UNVERIFIED",
      metric: "MET-05",
      tenantCode: "XA_A",
    },
    {
      id: "KN-03",
      code: "INSP-2026-003",
      title: "Lập sổ theo dõi bảo dưỡng trang thiết bị âm thanh NVH Tân Thịnh",
      facilityName: "Nhà văn hóa xóm Tân Thịnh",
      hamlet: "Xóm Tân Thịnh",
      assignee: "Hoàng Văn Tuấn (P4)",
      dueText: "Đã hoàn thành 25/10",
      isOverdue: false,
      status: "RESOLVED_CLOSED",
      metric: "MET-05",
      tenantCode: "XA_A",
    },
  ],
  domesticViolence: [
    {
      id: "BLGD-001",
      code: "DV-2026-01",
      victimName: "Nguyễn Thị Thảo",
      victimCccd: "019185002134",
      perpetratorName: "Trần Văn T.",
      relation: "Chồng",
      severity: "URGENT_DANGER",
      hasRestrainingOrder: true,
      status: "INTERVENING",
      hamlet: "Xóm Tân Thịnh",
      tenantCode: "XA_A",
    },
    {
      id: "BLGD-002",
      code: "DV-2026-02",
      victimName: "Lê Thị Hồng",
      victimCccd: "019178003412",
      perpetratorName: "Lê Văn H.",
      relation: "Con đẻ",
      severity: "MEDIUM_RISK",
      hasRestrainingOrder: false,
      status: "REPORTED",
      hamlet: "Xóm Đồng Thịnh",
      tenantCode: "XA_A",
    },
  ],
  masterSubjects: [
    {
      id: "SUB-01",
      code: "CD-001",
      fullName: "Hoàng Văn Nam",
      cccd: "019082001122",
      phone: "0912345678",
      address: "Số 12 xóm Tân Thịnh",
      hamlet: "Xóm Tân Thịnh",
      subjectType: "HOUSEHOLD_HEAD",
      status: "ACTIVE",
      membersCount: 4,
      tenantCode: "XA_A",
    },
    {
      id: "SUB-02",
      code: "CD-002",
      fullName: "Nguyễn Thị Lan",
      cccd: "019184003344",
      phone: "0983112233",
      address: "Số 45 xóm Tân Thịnh",
      hamlet: "Xóm Tân Thịnh",
      subjectType: "HOUSEHOLD_HEAD",
      status: "ACTIVE",
      membersCount: 3,
      tenantCode: "XA_A",
    },
    {
      id: "SUB-03",
      code: "CD-003",
      fullName: "Trần Văn Bình",
      cccd: "019077005566",
      phone: "0977223344",
      address: "Số 88 xóm Đồng Thịnh",
      hamlet: "Xóm Đồng Thịnh",
      subjectType: "WAR_INVALID",
      status: "ACTIVE",
      membersCount: 5,
      tenantCode: "XA_A",
    },
    {
      id: "SUB-04",
      code: "CD-004",
      fullName: "Vũ Đình Trọng",
      cccd: "019089007788",
      phone: "0966334455",
      address: "Số 05 xóm Đức Hòa",
      hamlet: "Xóm Đức Hòa",
      subjectType: "HOUSEHOLD_HEAD",
      status: "ACTIVE",
      membersCount: 4,
      tenantCode: "XA_A",
    },
    {
      id: "SUB-05",
      code: "CD-005",
      fullName: "Hoàng Văn Nam",
      cccd: "019082001122",
      phone: "0912345678",
      address: "Số 12 xóm Tân Thịnh (Khai tại Một cửa)",
      hamlet: "Xóm Tân Thịnh",
      subjectType: "CITIZEN",
      status: "ACTIVE",
      membersCount: 1,
      tenantCode: "XA_A",
    },
    {
      id: "SUB-06",
      code: "CD-006",
      fullName: "Nguyễn Thị Lan",
      cccd: "019184003344",
      phone: "0983112233",
      address: "Số 45 xóm Tân Thịnh (Khai hồ sơ BTXH)",
      hamlet: "Xóm Tân Thịnh",
      subjectType: "CITIZEN",
      status: "ACTIVE",
      membersCount: 1,
      tenantCode: "XA_A",
    },
  ],
  residenceHistory: [
    {
      id: "RH-A-01",
      subjectId: "SUB-01",
      citizenName: "Hoàng Văn Nam",
      cccd: "019082001122",
      actionType: "SPLIT_HOUSEHOLD",
      actionTypeName: "Tách hộ gia đình",
      oldHamlet: "Xóm Tân Thịnh",
      newHamlet: "Xóm Tân Thịnh",
      oldAddress: "Số 08 xóm Tân Thịnh",
      newAddress: "Số 12 xóm Tân Thịnh",
      oldHouseholdCode: "HK-TT-008",
      newHouseholdCode: "HK-TT-012",
      eventDate: "2024-03-15",
      referenceDocument: "QĐ số 45/QĐ-UBND",
      notes: "Tách hộ sau khi kết hôn lập gia đình riêng",
      tenantCode: "XA_A",
    },
    {
      id: "RH-A-02",
      subjectId: "SUB-01",
      citizenName: "Hoàng Văn Nam",
      cccd: "019082001122",
      actionType: "RELOCATE_HAMLET",
      actionTypeName: "Chuyển địa bàn thôn/xóm",
      oldHamlet: "Xóm Đức Hòa",
      newHamlet: "Xóm Tân Thịnh",
      oldAddress: "Số 02 xóm Đức Hòa",
      newAddress: "Số 12 xóm Tân Thịnh",
      eventDate: "2025-06-20",
      referenceDocument: "QĐ số 89/QĐ-UBND",
      notes: "Chuyển nơi cư trú do thu hồi mặt bằng cụm dân cư",
      tenantCode: "XA_A",
    },
    {
      id: "RH-A-03",
      subjectId: "SUB-03",
      citizenName: "Trần Văn Bình",
      cccd: "019077005566",
      actionType: "IN_MIGRATION",
      actionTypeName: "Chuyển đến từ ngoài xã",
      oldHamlet: "Xã Phúc Trìu",
      newHamlet: "Xóm Đồng Thịnh",
      oldAddress: "Xã Phúc Trìu, TP. Thái Nguyên",
      newAddress: "Số 88 xóm Đồng Thịnh",
      newHouseholdCode: "HK-DT-054",
      eventDate: "2023-10-12",
      referenceDocument: "Quyết định số 112/QĐ-UBND",
      notes: "Tiếp nhận thương binh di chuyển hộ khẩu hưởng chế độ",
      tenantCode: "XA_A",
    },
    {
      id: "RH-A-04",
      subjectId: "SUB-02",
      citizenName: "Nguyễn Thị Lan",
      cccd: "019184003344",
      actionType: "MERGE_HOUSEHOLD",
      actionTypeName: "Nhập hộ khẩu",
      oldHamlet: "Xóm Tân Thịnh",
      newHamlet: "Xóm Tân Thịnh",
      oldAddress: "Số 40 xóm Tân Thịnh",
      newAddress: "Số 45 xóm Tân Thịnh",
      oldHouseholdCode: "HK-TT-019",
      newHouseholdCode: "HK-TT-020",
      eventDate: "2025-01-08",
      referenceDocument: "Quyết định số 05/QĐ-UBND",
      notes: "Nhập hộ theo quy định Luật Cư trú",
      tenantCode: "XA_A",
    },
  ],
  domainRecords: {
    noiVu: {
      ncc: [
        {
          id: "NCC-01",
          code: "NCC-2026-01",
          fullName: "Trần Văn Bình",
          cccd: "019077005566",
          hamlet: "Xóm Đồng Thịnh",
          category: "THUONG_BINH",
          medalTitle: "Huân chương Chiến sĩ vẻ vang hạng Ba",
          monthlyAllowance: 2850000,
          hasDeduplicationFlag: false,
          status: "ACTIVE",
          tenantCode: "XA_A",
        },
        {
          id: "NCC-02",
          code: "NCC-2026-02",
          fullName: "Đỗ Thị Lụa",
          cccd: "019152002345",
          hamlet: "Xóm Tân Thịnh",
          category: "BA_ME_VNAH",
          medalTitle: "Bà Mẹ Việt Nam Anh Hùng",
          monthlyAllowance: 4120000,
          hasDeduplicationFlag: false,
          status: "ACTIVE",
          tenantCode: "XA_A",
        },
        {
          id: "NCC-03",
          code: "NCC-2026-03",
          fullName: "Nguyễn Văn Tuất",
          cccd: "019080009876",
          hamlet: "Xóm Tân Thịnh",
          category: "CHAT_DOC_HOA_HOC",
          medalTitle: "Huân chương Kháng chiến hạng Nhì",
          monthlyAllowance: 2340000,
          hasDeduplicationFlag: true,
          deduplicationWarning: "Trùng đề xuất: Đã được tặng Bằng khen cấp Tỉnh năm 2024 theo QĐ số 412/QĐ-UBND tỉnh Thái Nguyên. Khuyến nghị đổi sang hình thức Kỷ niệm chương.",
          proposedAward: "Bằng khen Chủ tịch UBND tỉnh",
          status: "REVIEW_PENDING",
          tenantCode: "XA_A",
        },
        {
          id: "NCC-04",
          code: "NCC-2026-04",
          fullName: "Lê Thị Thảo",
          cccd: "019183003456",
          hamlet: "Xóm Đức Hòa",
          category: "LIET_SI",
          medalTitle: "Thân nhân Liệt sĩ (Tuất hàng tháng)",
          monthlyAllowance: 1950000,
          hasDeduplicationFlag: false,
          status: "ACTIVE",
          tenantCode: "XA_A",
        },
      ],
      contracts: [
        {
          id: "LC-01",
          businessName: "HTX Chè Hữu cơ Thịnh Đức",
          taxCode: "4601234567",
          totalWorkers: 18,
          minWagePaid: 3650000,
          regionalMinWage: 3450000,
          isUnderMinWage: false,
          seasonalWorkersCount: 6,
          bhxhRegisteredCount: 18,
          evaluationPeriod: "Q4-2026",
          tenantCode: "XA_A",
        },
        {
          id: "LC-02",
          businessName: "Xưởng Mộc Thủ công An Phát",
          taxCode: "4601899231",
          totalWorkers: 8,
          minWagePaid: 3200000,
          regionalMinWage: 3450000,
          isUnderMinWage: true,
          seasonalWorkersCount: 4,
          bhxhRegisteredCount: 4,
          evaluationPeriod: "Q4-2026",
          tenantCode: "XA_A",
        },
        {
          id: "LC-03",
          businessName: "Công ty Cổ phần May Xuất khẩu Thịnh Đức",
          taxCode: "4601776543",
          totalWorkers: 45,
          minWagePaid: 4500000,
          regionalMinWage: 3450000,
          isUnderMinWage: false,
          seasonalWorkersCount: 10,
          bhxhRegisteredCount: 45,
          evaluationPeriod: "Q4-2026",
          tenantCode: "XA_A",
        },
      ],
      disputes: [
        {
          id: "DISP-01",
          code: "HG-2026-01",
          requesterName: "Nguyễn Văn Hưng",
          requesterRole: "EMPLOYEE",
          respondentName: "Xưởng Mộc An Phát",
          disputeContent: "Tranh chấp tiền lương làm thêm giờ tháng 10/2026",
          disputeType: "INDIVIDUAL",
          receivedDate: "2026-11-02",
          status: "SCHEDULED",
          outcomeSummary: "Đã bố trí hòa giải viên phiên ngày 10/11",
          tenantCode: "XA_A",
        },
        {
          id: "DISP-02",
          code: "HG-2026-02",
          requesterName: "Tập thể 14 công nhân Xưởng May Bình An",
          requesterRole: "COLLECTIVE",
          respondentName: "Công ty TNHH May Mặc Bình An",
          disputeContent: "Đình công tập thể yêu cầu cải thiện bữa ăn ca & phụ cấp độc hại",
          disputeType: "COLLECTIVE",
          receivedDate: "2026-11-05",
          status: "ESCALATED_DISTRICT",
          outcomeSummary: "Vượt quá thẩm quyền cấp xã (D03): Đã chuyển hồ sơ lên Phòng LĐTBXH thành phố thụ lý",
          tenantCode: "XA_A",
        },
        {
          id: "DISP-03",
          code: "HG-2026-03",
          requesterName: "Tập thể 22 lao động Hợp tác xã Mây tre đan",
          requesterRole: "COLLECTIVE",
          respondentName: "Hợp tác xã Mây tre đan Thịnh Đức",
          disputeContent: "Tập thể lao động nộp đơn ngừng việc tập thể yêu cầu đóng bảo hiểm xã hội bắt buộc",
          disputeType: "COLLECTIVE",
          receivedDate: "2026-11-07",
          status: "RECEIVED",
          outcomeSummary: "Tranh chấp lao động tập thể tiềm ẩn nguy cơ đình công - Cần chuyển lên Huyện theo D03",
          tenantCode: "XA_A",
        },
      ],
      underage: [
        {
          id: "UA-01",
          minorName: "Lê Minh Quân",
          cccd: "019208001234",
          employer: "Cơ sở Gốm Mỹ nghệ Thịnh Đức",
          allowedJobCategory: "TRADITIONAL_CRAFT",
          dailyHours: 3.5,
          healthCertValid: true,
          guardianConsent: true,
          status: "COMPLIANT",
          tenantCode: "XA_A",
        },
        {
          id: "UA-02",
          minorName: "Trần Anh Tú",
          cccd: "019209005678",
          employer: "Đoàn Ca múa Nhạc Dân tộc Xã",
          allowedJobCategory: "ARTS",
          dailyHours: 4.0,
          healthCertValid: true,
          guardianConsent: true,
          status: "COMPLIANT",
          tenantCode: "XA_A",
        },
      ],
    },
    giaoDuc: {
      schools: [
        {
          id: "SCH-01",
          name: "Trường Mầm non Thịnh Đức",
          level: "PRESCHOOL",
          principal: "Vũ Thị Hồng",
          totalStudents: 280,
          civilYear: 2026,
          schoolYear: "2026-2027",
          universalizationStandard: "LEVEL_1",
          tenantCode: "XA_A",
        },
        {
          id: "SCH-02",
          name: "Trường Tiểu học Thịnh Đức",
          level: "PRIMARY",
          principal: "Nguyễn Thị Minh",
          totalStudents: 420,
          civilYear: 2026,
          schoolYear: "2026-2027",
          universalizationStandard: "LEVEL_3",
          tenantCode: "XA_A",
        },
        {
          id: "SCH-03",
          name: "Trường THCS Thịnh Đức",
          level: "SECONDARY",
          principal: "Hoàng Đức Toàn",
          totalStudents: 310,
          civilYear: 2026,
          schoolYear: "2026-2027",
          universalizationStandard: "LEVEL_2",
          tenantCode: "XA_A",
        },
      ],
      privateFacilities: [
        {
          id: "PF-01",
          name: "Nhóm trẻ độc lập Hoa Sen",
          facilityType: "INDEPENDENT_NURSERY_GROUP",
          ownerName: "Trương Thị Hồng",
          ownerCccd: "019183004567",
          capacity: 25,
          currentEnrolled: 22,
          totalAreaSqm: 42.0,
          sqmPerChild: 1.91,
          fireSafetyCertified: true,
          foodSafetyCertified: true,
          licensingStatus: "LICENSED",
          tenantCode: "XA_A",
        },
        {
          id: "PF-02",
          name: "Lớp Mầm non Độc lập Ánh Sao",
          facilityType: "INDEPENDENT_KINDERGARTEN_CLASS",
          ownerName: "Đỗ Bích Thảo",
          ownerCccd: "019185006789",
          capacity: 25,
          currentEnrolled: 20,
          totalAreaSqm: 25.0,
          sqmPerChild: 1.25,
          fireSafetyCertified: false,
          foodSafetyCertified: true,
          licensingStatus: "PROBATION",
          tenantCode: "XA_A",
        },
        {
          id: "PF-03",
          name: "Nhóm trẻ Gia đình Tuổi Thơ",
          facilityType: "INDEPENDENT_NURSERY_GROUP",
          ownerName: "Phạm Thu Hương",
          ownerCccd: "019188009876",
          capacity: 15,
          currentEnrolled: 12,
          totalAreaSqm: 30.0,
          sqmPerChild: 2.5,
          fireSafetyCertified: true,
          foodSafetyCertified: true,
          licensingStatus: "LICENSED",
          tenantCode: "XA_A",
        },
      ],
      ccl: [
        {
          id: "CCL-01",
          name: "Trung tâm Học tập Cộng đồng Xã Thịnh Đức",
          directorName: "Phó Chủ tịch UBND Xã (Kiêm Giám đốc)",
          annualPlanApproved: true,
          coursesConducted: 8,
          totalLearners: 260,
          annualRating: "GOOD",
          tenantCode: "XA_A",
        },
      ],
      tuitionExemptions: [
        {
          id: "TE-01",
          studentName: "Nguyễn Văn Hải",
          schoolName: "Trường Tiểu học Thịnh Đức",
          grade: "Lớp 3A",
          category: "POOR_HOUSEHOLD",
          exemptionPercent: 100,
          supportAmount: 150000,
          status: "APPROVED",
          semester: "Học kỳ I (2026-2027)",
          tenantCode: "XA_A",
        },
        {
          id: "TE-02",
          studentName: "Đỗ Minh Khang",
          schoolName: "Trường THCS Thịnh Đức",
          grade: "Lớp 7B",
          category: "DISABILITY",
          exemptionPercent: 100,
          supportAmount: 150000,
          status: "APPROVED",
          semester: "Học kỳ I (2026-2027)",
          tenantCode: "XA_A",
        },
        {
          id: "TE-03",
          studentName: "Hoàng Thị Mai",
          schoolName: "Trường Mầm non Thịnh Đức",
          grade: "Lớp 4 tuổi",
          category: "NEAR_POOR",
          exemptionPercent: 70,
          supportAmount: 105000,
          status: "PENDING",
          semester: "Học kỳ I (2026-2027)",
          tenantCode: "XA_A",
        },
      ],
    },
    yTeAnSinh: {
      socialProtection: [
        {
          id: "SP-01",
          code: "BTXH-2026-01",
          fullName: "Nguyễn Thị Hoa",
          cccd: "019154006789",
          phone: "0945112233",
          hamlet: "Xóm Tân Thịnh",
          aidCategory: "Người cao tuổi đơn thân nghèo (hưởng trợ cấp hàng tháng)",
          monthlyAmount: 720000,
          diagnosis: "Thoái hóa cột sống nặng, mất khả năng tự phục vụ",
          paymentStatus: "PAID",
          tenantCode: "XA_A",
        },
        {
          id: "SP-02",
          code: "BTXH-2026-02",
          fullName: "Đỗ Văn Long",
          cccd: "019092004561",
          phone: "0918776655",
          hamlet: "Xóm Đồng Thịnh",
          aidCategory: "Người khuyết tật đặc biệt nặng",
          monthlyAmount: 1440000,
          diagnosis: "Liệt nửa người sau di chứng tai biến mạch máu não",
          paymentStatus: "PAID",
          tenantCode: "XA_A",
        },
        {
          id: "SP-03",
          code: "BTXH-2026-03",
          fullName: "Hoàng Văn Tuấn",
          cccd: "019095007890",
          phone: "0977889900",
          hamlet: "Xóm Đức Hòa",
          aidCategory: "Trẻ em mồ côi cả cha lẫn mẹ",
          monthlyAmount: 1080000,
          diagnosis: "Không bệnh lý",
          paymentStatus: "PENDING",
          tenantCode: "XA_A",
        },
        {
          id: "SP-04",
          code: "BTXH-2026-04",
          fullName: "Lê Đình Thọ",
          cccd: "019080001234",
          phone: "0934567890",
          hamlet: "Xóm Tân Thịnh",
          aidCategory: "Người khuyết tật nặng (thần kinh, tâm thần)",
          monthlyAmount: 1080000,
          diagnosis: "Rối loạn tâm thần mãn tính dạng phân liệt",
          paymentStatus: "PENDING",
          tenantCode: "XA_A",
        },
      ],
      foodSafety: [
        {
          id: "FS-01",
          facilityName: "Bếp ăn Bán trú Tiểu học Thịnh Đức",
          inspectionType: "SCHOOL_CANTEEN",
          inspectionDate: "2026-11-04",
          totalScore: 96,
          sampleRetention24hPassed: true,
          conclusion: "PASSED",
          tenantCode: "XA_A",
        },
        {
          id: "FS-02",
          facilityName: "Quán Ăn Sáng & Đồ Vặt Cổng Trường THCS",
          inspectionType: "STREET_FOOD",
          inspectionDate: "2026-11-01",
          totalScore: 74,
          sampleRetention24hPassed: false,
          conclusion: "WARNING_REMEDIAL",
          tenantCode: "XA_A",
        },
        {
          id: "FS-03",
          facilityName: "Cơ sở Chế biến Nông sản Chè Thịnh Đức",
          inspectionType: "ARTISAN_PRODUCER",
          inspectionDate: "2026-10-28",
          totalScore: 92,
          sampleRetention24hPassed: true,
          conclusion: "PASSED",
          tenantCode: "XA_A",
        },
      ],
      medical: [
        {
          id: "MED-01",
          facilityName: "Phòng Chẩn trị Y học Cổ truyền Đức An",
          facilitySubType: "TRADITIONAL_CLINIC",
          practitionerName: "Lương y Vũ Văn Đức",
          licenseNumber: "00142/SYT-GPHĐ",
          licenseIssueDate: "2021-04-12",
          gppCertified: true,
          controlledDrugsLedger: true,
          inspectionStatus: "NORMAL",
          tenantCode: "XA_A",
        },
        {
          id: "MED-02",
          facilityName: "Quầy thuốc Tân dược số 12 Thịnh Đức",
          facilitySubType: "DRUG_STORE",
          practitionerName: "Dược sĩ Trần Bích Ngọc",
          licenseNumber: "00589/SYT-GPP",
          licenseIssueDate: "2022-08-19",
          gppCertified: true,
          controlledDrugsLedger: true,
          inspectionStatus: "NORMAL",
          tenantCode: "XA_A",
        },
        {
          id: "MED-03",
          facilityName: "Phòng khám Răng Hàm Mặt Thẩm mỹ Minh Châu",
          facilitySubType: "SPECIALIZED_CLINIC",
          practitionerName: "Bác sĩ Lê Minh Châu",
          licenseNumber: "00318/SYT-CK",
          licenseIssueDate: "2023-01-15",
          gppCertified: true,
          controlledDrugsLedger: false,
          inspectionStatus: "WARNING",
          tenantCode: "XA_A",
        },
      ],
      epidemics: [
        {
          id: "EPI-01",
          hamlet: "Xóm Tân Thịnh",
          diseaseGroup: "GROUP_B",
          diseaseName: "Sốt xuất huyết Dengue",
          casesCount: 4,
          hospitalizedCount: 2,
          deathsCount: 0,
          outbreakAlertFlag: true,
          logWeek: 45,
          logYear: 2026,
          reportedDate: "2026-11-06",
          tenantCode: "XA_A",
        },
        {
          id: "EPI-02",
          hamlet: "Xóm Đồng Thịnh",
          diseaseGroup: "GROUP_B",
          diseaseName: "Tay chân miệng",
          casesCount: 1,
          hospitalizedCount: 0,
          deathsCount: 0,
          outbreakAlertFlag: false,
          logWeek: 45,
          logYear: 2026,
          reportedDate: "2026-11-05",
          tenantCode: "XA_A",
        },
        {
          id: "EPI-03",
          hamlet: "Xóm Đức Hòa",
          diseaseGroup: "GROUP_B",
          diseaseName: "Sởi",
          casesCount: 0,
          hospitalizedCount: 0,
          deathsCount: 0,
          outbreakAlertFlag: false,
          logWeek: 45,
          logYear: 2026,
          reportedDate: "2026-11-04",
          tenantCode: "XA_A",
        },
      ],
    },
    danTocTonGiao: {
      religiousFacilities: [
        {
          id: "REL-01",
          name: "Chùa Phúc Lâm (Thịnh Đức)",
          religionType: "BUDDHISM",
          leaderName: "Trụ trì Thích Tâm Thanh",
          hamlet: "Xóm Tân Thịnh",
          status: "OFFICIALLY_REGISTERED",
          tenantCode: "XA_A",
        },
        {
          id: "REL-02",
          name: "Nhà nguyện Giáo họ Thịnh Đức",
          religionType: "CATHOLICISM",
          leaderName: "Ông Trùm Giuse Nguyễn Văn Nam",
          hamlet: "Xóm Đức Hòa",
          status: "OFFICIALLY_REGISTERED",
          tenantCode: "XA_A",
        },
        {
          id: "REL-03",
          name: "Điểm nhóm Tin lành Phúc âm Thịnh Đức",
          religionType: "PROTESTANTISM",
          leaderName: "Mục sư Hoàng Văn Sơn",
          hamlet: "Xóm Đồng Thịnh",
          status: "TEMPORARY_PERMIT",
          tenantCode: "XA_A",
        },
      ],
      irregularActivities: [
        {
          id: "IRR-01",
          code: "TG-2026-001",
          location: "Nhà ông T.V.H, xóm Đức Hòa",
          natureType: "UNREGISTERED_GATHERING",
          organizer: "Nhóm sinh hoạt đạo lạ từ ngoài địa bàn",
          attendeesEstimated: 8,
          actionTaken: "GUIDED_OFFICIAL_REGISTRATION",
          status: "MONITORING",
          tenantCode: "XA_A",
        },
        {
          id: "IRR-02",
          code: "TG-2026-002",
          location: "Khu đất vườn xóm Tân Thịnh",
          natureType: "SUSPECTED_CULT",
          organizer: "Đối tượng xưng danh chữa bệnh tâm linh",
          attendeesEstimated: 15,
          actionTaken: "DISPERSED_CEASED",
          status: "RESOLVED",
          tenantCode: "XA_A",
        },
      ],
      ethnicNotables: [
        {
          id: "EN-01",
          fullName: "Ma Văn Sùng",
          ethnicGroup: "Dân tộc Tày",
          hamlet: "Xóm Đức Hòa",
          yearRecognized: 2018,
          roleDescription: "Người có uy tín trong đồng bào DTTS, tích cực tuyên truyền xóa bỏ hủ tục",
          stipendAmount: 800000,
          status: "ACTIVE",
          tenantCode: "XA_A",
        },
        {
          id: "EN-02",
          fullName: "Lương Thị Mai",
          ethnicGroup: "Dân tộc Nùng",
          hamlet: "Xóm Tân Thịnh",
          yearRecognized: 2020,
          roleDescription: "Nghệ nhân truyền dạy hát Then đàn Tính, vận động nhân dân hiến đất",
          stipendAmount: 800000,
          status: "ACTIVE",
          tenantCode: "XA_A",
        },
        {
          id: "EN-03",
          fullName: "Triệu Văn Lộc",
          ethnicGroup: "Dân tộc Sán Dìu",
          hamlet: "Xóm Đồng Thịnh",
          yearRecognized: 2022,
          roleDescription: "Hòa giải viên cơ sở, giữ gìn bản sắc văn hóa Soóng Cô",
          stipendAmount: 800000,
          status: "ACTIVE",
          tenantCode: "XA_A",
        },
      ],
      ethnicAllocations: [
        {
          id: "EA-01",
          beneficiaryName: "Hoàng Văn Sùng",
          cccd: "019086001928",
          hamlet: "Xóm Đức Hòa",
          programCode: "MTQG_1719",
          subProjectType: "HOUSING_AID",
          budgetAllocated: 44000000,
          publicPostingStart: "2026-10-15",
          publicPostingEnd: "2026-10-31",
          objectionFiled: false,
          disbursementStatus: "APPROVED",
          tenantCode: "XA_A",
        },
        {
          id: "EA-02",
          beneficiaryName: "Lương Văn Thắng",
          cccd: "019089004521",
          hamlet: "Xóm Tân Thịnh",
          programCode: "MTQG_1719",
          subProjectType: "WATER_SUPPLY",
          budgetAllocated: 14500000,
          publicPostingStart: "2026-11-01",
          publicPostingEnd: "2026-11-08",
          objectionFiled: false,
          disbursementStatus: "POSTED",
          tenantCode: "XA_A",
        },
        {
          id: "EA-03",
          beneficiaryName: "Triệu Thị Mùi",
          cccd: "019182006734",
          hamlet: "Xóm Đức Hòa",
          programCode: "MTQG_1719",
          subProjectType: "LAND_AID",
          budgetAllocated: 32000000,
          publicPostingStart: "2026-10-10",
          publicPostingEnd: "2026-10-28",
          objectionFiled: true,
          disbursementStatus: "POSTED",
          tenantCode: "XA_A",
        },
      ],
    },
    culturalServices: [
      {
        id: "CS-01",
        serviceType: "PHOTOCOPY_SHOP",
        facilityName: "Cửa hàng Photocopy & In ấn Tân Thịnh",
        ownerName: "Lê Văn Tiến",
        deviceCount: 3,
        contentCommitmentSigned: true,
        status: "ACTIVE",
        tenantCode: "XA_A",
      },
    ],
    festivals: [
      {
        id: "FEST-01",
        code: "LH-2026-01",
        regType: "NOTIFICATION",
        festivalName: "Hội Chợ Quê Nông sản An toàn Xã Thịnh Đức",
        organizerName: "Hội Nông dân Xã Thịnh Đức",
        scale: "Cấp xã",
        startDate: "2026-11-20",
        endDate: "2026-11-22",
        location: "Khuôn viên Sân vận động xã",
        status: "RECORDED",
        tenantCode: "XA_A",
      },
    ],
  },
  snapshots: [
    {
      id: "REV-1-XA-A",
      code: "DEM-R-OCT-2026",
      title: "Báo cáo Chỉ tiêu Văn hóa - Xã hội Tháng 10/2026",
      period: "Tháng 10/2026",
      status: "LOCKED_IMMUTABLE",
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      signedBy: "Nguyễn Văn An (P1 Chủ tịch UBND xã)",
      signedAt: "2026-10-31T08:00:00Z",
      revision: "REV_1",
      dataPayload: {
        met01: 3,
        met02: 1,
        met03: "50.0%",
        met04: "60%",
        met05: 2,
        culturalApproved: 2,
        culturalTotal: 4,
        cdsConfirmed: 3,
        cdsTotal: 5,
      },
      tenantCode: "XA_A",
    },
    {
      id: "REV-2-XA-A",
      code: "DEM-R-NOV-2026-DRAFT",
      title: "Báo cáo Dự thảo Chỉ tiêu Tháng 11/2026 (Chưa ký)",
      period: "Tháng 11/2026",
      status: "DRAFT",
      hash: "draft-pending-signature-hash",
      signedBy: "Chưa ký",
      signedAt: "",
      revision: "REV_2",
      dataPayload: {
        met01: 3,
        met02: 1,
      },
      tenantCode: "XA_A",
    },
  ],
  reports: [
    {
      id: "REV-1-XA-A",
      code: "DEM-R-OCT-2026",
      title: "Báo cáo Chỉ tiêu Văn hóa - Xã hội Tháng 10/2026",
      period: "Tháng 10/2026",
      status: "LOCKED_IMMUTABLE",
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      signedBy: "Nguyễn Văn An (P1 Chủ tịch UBND xã)",
      signedAt: "2026-10-31T08:00:00Z",
      revision: "REV_1",
      dataPayload: {
        met01: 3,
        met02: 1,
        met03: "50.0%",
        met04: "60%",
        met05: 2,
      },
      tenantCode: "XA_A",
    },
  ],
};

export const GOLDEN_SEED_XA_B: TenantDemoData = {
  metrics: {
    met01: 2,
    met02: 0,
    met03: "100%",
    met04: "N/A",
    met05: 0,
  },
  tasks: [
    {
      id: "TB-1",
      code: "TASK-B-001",
      title: "Thẩm tra hồ sơ cam kết văn hóa cơ sở kinh doanh dịch vụ photocopy",
      domain: "Văn hóa & Gia đình",
      entityTag: "Dịch vụ VH",
      assignee: "Lê Văn Hùng (P3)",
      dueDate: "2026-11-09T17:00:00Z",
      dueText: "Thứ Hai 17:00",
      isOverdue: false,
      status: "Đang xử lý",
      statusBg: "bg-amber-50",
      statusColor: "text-amber-700",
      statusBorder: "border-amber-200",
      icon: "Clock",
      metric: "MET-01",
      tenantCode: "XA_B",
      targetUrl: "/van-hoa-gia-dinh",
    },
    {
      id: "TB-2",
      code: "TASK-B-002",
      title: "Lập danh sách người cao tuổi mừng thọ xuân Đinh Mùi 2027",
      domain: "Y tế & An sinh",
      entityTag: "Mừng thọ",
      assignee: "Lê Văn Hùng (P3)",
      dueDate: "2026-11-12T17:00:00Z",
      dueText: "Thứ Năm 17:00",
      isOverdue: false,
      status: "Đang xử lý",
      statusBg: "bg-amber-50",
      statusColor: "text-amber-700",
      statusBorder: "border-amber-200",
      icon: "Clock",
      metric: "MET-01",
      tenantCode: "XA_B",
      targetUrl: "/y-te-an-sinh",
    },
  ],
  culturalTitles: [
    {
      id: "HB-1",
      code: "GĐVH-B-001",
      householdHead: "Dương Đình Hùng",
      hamlet: "Xóm Chè Đặc Sản",
      membersCount: 4,
      yearsRecognized: 5,
      status: "APPROVED",
      step: "VH8",
      score: 96,
      submissionCount: 1,
      tenantCode: "XA_B",
    },
  ],
  cdsMatrix: [
    {
      code: "CDS-01",
      name: "Tắt chuyển đổi số theo cấu hình Xã B",
      value: "N/A",
      status: "NOT_APPLICABLE",
      meaning: "Xã B tắt tính năng CĐS",
      tenantCode: "XA_B",
    },
  ],
  inspections: [],
  recommendations: [],
  domesticViolence: [],
  masterSubjects: [
    {
      id: "SUB-B-01",
      code: "CDB-001",
      fullName: "Dương Đình Hùng",
      cccd: "019076008912",
      phone: "0913554433",
      address: "Xóm Chè Đặc Sản",
      hamlet: "Xóm Chè Đặc Sản",
      subjectType: "HOUSEHOLD_HEAD",
      status: "ACTIVE",
      membersCount: 4,
      tenantCode: "XA_B",
    },
    {
      id: "SUB-B-02",
      code: "CDB-002",
      fullName: "Dương Đình Hùng",
      cccd: "019076008912",
      phone: "0913554433",
      address: "Tổ tự quản Xóm Chè",
      hamlet: "Xóm Chè Đặc Sản",
      subjectType: "CITIZEN",
      status: "ACTIVE",
      membersCount: 1,
      tenantCode: "XA_B",
    },
    {
      id: "SUB-B-03",
      code: "CDB-003",
      fullName: "Tạ Thị Búp",
      cccd: "019183004455",
      phone: "0982776655",
      address: "Xóm Chè Đặc Sản",
      hamlet: "Xóm Chè Đặc Sản",
      subjectType: "CITIZEN",
      status: "ACTIVE",
      membersCount: 3,
      tenantCode: "XA_B",
    },
  ],
  residenceHistory: [
    {
      id: "RH-B-01",
      subjectId: "SUB-B-01",
      citizenName: "Dương Đình Hùng",
      cccd: "019076008912",
      actionType: "MERGE_HOUSEHOLD",
      actionTypeName: "Nhập hộ khẩu sản xuất chè",
      oldHamlet: "Xóm Núi",
      newHamlet: "Xóm Chè Đặc Sản",
      oldAddress: "Xã Tân Cương cũ",
      newAddress: "Xóm Chè Đặc Sản",
      oldHouseholdCode: "HK-TC-004",
      newHouseholdCode: "HK-TC-001",
      eventDate: "2024-08-01",
      referenceDocument: "QĐ số 33/QĐ-UBND",
      notes: "Quy tụ gia đình làm vùng trồng chè OCOP",
      tenantCode: "XA_B",
    },
    {
      id: "RH-B-02",
      subjectId: "SUB-B-03",
      citizenName: "Tạ Thị Búp",
      cccd: "019183004455",
      actionType: "IN_MIGRATION",
      actionTypeName: "Chuyển đến thường trú",
      oldHamlet: "Phường Quang Trung",
      newHamlet: "Xóm Chè Đặc Sản",
      oldAddress: "Phường Quang Trung, TP. Thái Nguyên",
      newAddress: "Xóm Chè Đặc Sản",
      eventDate: "2025-02-14",
      referenceDocument: "QĐ số 18/QĐ-UBND",
      notes: "Chuyển đến kinh doanh du lịch trải nghiệm chè",
      tenantCode: "XA_B",
    },
  ],
  domainRecords: {
    noiVu: {
      ncc: [
        {
          id: "NCC-B-01",
          code: "NCC-B-01",
          fullName: "Dương Đình Hùng",
          cccd: "019076008912",
          hamlet: "Xóm Chè Đặc Sản",
          category: "THUONG_BINH",
          medalTitle: "Huân chương Chiến công hạng Ba",
          monthlyAllowance: 2850000,
          hasDeduplicationFlag: false,
          status: "ACTIVE",
          tenantCode: "XA_B",
        },
      ],
      contracts: [
        {
          id: "LC-B-01",
          businessName: "HTX Chè Đặc sản Tân Cương",
          taxCode: "4601998877",
          totalWorkers: 24,
          minWagePaid: 4200000,
          regionalMinWage: 3450000,
          isUnderMinWage: false,
          seasonalWorkersCount: 8,
          bhxhRegisteredCount: 24,
          evaluationPeriod: "Q4-2026",
          tenantCode: "XA_B",
        },
      ],
      disputes: [],
      underage: [],
    },
    giaoDuc: {
      schools: [
        {
          id: "SCH-B-01",
          name: "Trường Tiểu học Tân Cương",
          level: "PRIMARY",
          principal: "Lê Văn Hùng",
          totalStudents: 320,
          civilYear: 2026,
          schoolYear: "2026-2027",
          universalizationStandard: "LEVEL_3",
          tenantCode: "XA_B",
        },
      ],
      privateFacilities: [],
      ccl: [
        {
          id: "CCL-B-01",
          name: "Trung tâm Học tập Cộng đồng Xã Tân Cương",
          directorName: "Phó Chủ tịch UBND Xã Tân Cương",
          annualPlanApproved: true,
          coursesConducted: 5,
          totalLearners: 180,
          annualRating: "EXCELLENT",
          tenantCode: "XA_B",
        },
      ],
      tuitionExemptions: [],
    },
    yTeAnSinh: {
      socialProtection: [
        {
          id: "SP-B-01",
          code: "BTXH-B-01",
          fullName: "Nguyễn Thị Mơ",
          cccd: "019150009988",
          phone: "0912001122",
          hamlet: "Xóm Chè Đặc Sản",
          aidCategory: "Người cao tuổi đơn thân",
          monthlyAmount: 720000,
          diagnosis: "Tuổi cao suy giảm vận động",
          paymentStatus: "PAID",
          tenantCode: "XA_B",
        },
      ],
      foodSafety: [
        {
          id: "FS-B-01",
          facilityName: "Bếp ăn Trường Mầm non Tân Cương",
          inspectionType: "SCHOOL_CANTEEN",
          inspectionDate: "2026-11-02",
          totalScore: 98,
          sampleRetention24hPassed: true,
          conclusion: "PASSED",
          tenantCode: "XA_B",
        },
      ],
      medical: [
        {
          id: "MED-B-01",
          facilityName: "Trạm Y tế Xã Tân Cương",
          facilitySubType: "SPECIALIZED_CLINIC",
          practitionerName: "Bác sĩ Nguyễn Văn Quang",
          licenseNumber: "00119/SYT-TYT",
          licenseIssueDate: "2019-06-10",
          gppCertified: true,
          controlledDrugsLedger: true,
          inspectionStatus: "NORMAL",
          tenantCode: "XA_B",
        },
      ],
      epidemics: [
        {
          id: "EPI-B-01",
          hamlet: "Xóm Chè Đặc Sản",
          diseaseGroup: "GROUP_B",
          diseaseName: "Sốt xuất huyết Dengue",
          casesCount: 0,
          hospitalizedCount: 0,
          deathsCount: 0,
          outbreakAlertFlag: false,
          logWeek: 45,
          logYear: 2026,
          reportedDate: "2026-11-06",
          tenantCode: "XA_B",
        },
      ],
    },
    danTocTonGiao: {
      religiousFacilities: [
        {
          id: "REL-B-01",
          name: "Chùa Tân Cương",
          religionType: "BUDDHISM",
          leaderName: "Trụ trì Thích Đạo An",
          hamlet: "Xóm Chè Đặc Sản",
          status: "OFFICIALLY_REGISTERED",
          tenantCode: "XA_B",
        },
      ],
      irregularActivities: [],
      ethnicNotables: [
        {
          id: "EN-B-01",
          fullName: "Hoàng Văn Tuấn",
          ethnicGroup: "Dân tộc Tày",
          hamlet: "Xóm Chè Đặc Sản",
          yearRecognized: 2021,
          roleDescription: "Người có uy tín, nghệ nhân sao chè truyền thống",
          stipendAmount: 800000,
          status: "ACTIVE",
          tenantCode: "XA_B",
        },
      ],
      ethnicAllocations: [
        {
          id: "EA-B-01",
          beneficiaryName: "Hoàng Văn Nam",
          cccd: "019088001133",
          hamlet: "Xóm Chè Đặc Sản",
          programCode: "MTQG_1719",
          subProjectType: "WATER_SUPPLY",
          budgetAllocated: 15000000,
          publicPostingStart: "2026-10-01",
          publicPostingEnd: "2026-10-20",
          objectionFiled: false,
          disbursementStatus: "DISBURSED",
          tenantCode: "XA_B",
        },
      ],
    },
    culturalServices: [],
    festivals: [],
  },
  snapshots: [
    {
      id: "REV-1-XA-B",
      code: "DEM-R-OCT-2026-B",
      title: "Báo cáo Chỉ tiêu Văn hóa Xã Tân Cương Tháng 10/2026",
      period: "Tháng 10/2026",
      status: "LOCKED_IMMUTABLE",
      hash: "b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855aaa",
      signedBy: "Chủ tịch UBND Xã Tân Cương",
      signedAt: "2026-10-31T09:00:00Z",
      revision: "REV_1",
      dataPayload: {
        met01: 2,
        met02: 0,
        met03: "100%",
        met04: "N/A",
        met05: 0,
      },
      tenantCode: "XA_B",
    },
  ],
  reports: [
    {
      id: "REV-1-XA-B",
      code: "DEM-R-OCT-2026-B",
      title: "Báo cáo Chỉ tiêu Văn hóa Xã Tân Cương Tháng 10/2026",
      period: "Tháng 10/2026",
      status: "LOCKED_IMMUTABLE",
      hash: "b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855aaa",
      signedBy: "Chủ tịch UBND Xã Tân Cương",
      signedAt: "2026-10-31T09:00:00Z",
      revision: "REV_1",
      dataPayload: {
        met01: 2,
        met02: 0,
      },
      tenantCode: "XA_B",
    },
  ],
};

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "audit-001",
    timestamp: "2026-11-07T07:30:00Z",
    tenantId: "tenant-xa-a-uuid",
    userId: "user-p2",
    personaCode: "P2",
    action: "SYSTEM_INITIALIZE_GOLDEN_SEED",
    entityType: "SYSTEM",
    entityId: "SYS-INIT",
    details: {
      message: "Khởi tạo môi trường dữ liệu thực nghiệm Golden Seed v1.0 cho Xã A (Thịnh Đức) và Xã B (Tân Cương)",
    },
    ipAddress: "127.0.0.1",
  },
  {
    id: "audit-002",
    timestamp: "2026-11-07T08:15:00Z",
    tenantId: "tenant-xa-a-uuid",
    userId: "user-p2",
    personaCode: "P2",
    action: "UPDATE_TASK_STATUS",
    entityType: "TASK",
    entityId: "TASK-A-002",
    details: {
      message: "Hoàn thành nhiệm vụ lập danh sách BTXH tháng 11/2026",
    },
    ipAddress: "127.0.0.1",
  },
  {
    id: "audit-003",
    timestamp: "2026-11-07T09:30:00Z",
    tenantId: "tenant-xa-a-uuid",
    userId: "user-p1",
    personaCode: "P1",
    action: "SIGN_SNAPSHOT_ORACLE",
    entityType: "REPORT",
    entityId: "DEM-R-OCT-2026-A",
    details: {
      message: "Ký số ban hành báo cáo chỉ tiêu Oracle Rev 1 tháng 10/2026 (Khóa bất biến SHA-256)",
    },
    ipAddress: "192.168.1.10",
  },
  {
    id: "audit-004",
    timestamp: "2026-11-07T10:45:00Z",
    tenantId: "tenant-xa-a-uuid",
    userId: "user-p6",
    personaCode: "P6",
    action: "CREATE_FIELD_INSPECTION",
    entityType: "INSPECTION",
    entityId: "INS-001",
    details: {
      message: "Lập biên bản kiểm tra thực địa PCCC tại Nhà văn hóa Xóm Tân Thịnh",
    },
    ipAddress: "192.168.1.22",
  },
  {
    id: "audit-005",
    timestamp: "2026-11-07T11:20:00Z",
    tenantId: "tenant-xa-a-uuid",
    userId: "user-p2",
    personaCode: "P2",
    action: "APPROVE_CULTURAL_TITLE",
    entityType: "CULTURAL_TITLE",
    entityId: "GĐVH-2026-001",
    details: {
      message: "Phê duyệt hồ sơ bình xét GĐVH hộ Hoàng Văn Nam (95 điểm, Bước VH8)",
    },
    ipAddress: "192.168.1.15",
  },
  {
    id: "audit-006",
    timestamp: "2026-11-07T13:10:00Z",
    tenantId: "tenant-xa-b-uuid",
    userId: "user-p3",
    personaCode: "P3",
    action: "SYNC_COMMUNITY_DATA",
    entityType: "SHARED_DATA",
    entityId: "SYNC-B-01",
    details: {
      message: "Đồng bộ danh mục nghệ nhân và cơ sở văn hóa trà Xóm Chè Đặc Sản",
    },
    ipAddress: "192.168.2.14",
  },
];

export function getInitialGoldenSeed(tenantCode: TenantCode): TenantDemoData {
  const seed = tenantCode === "XA_A" ? GOLDEN_SEED_XA_A : GOLDEN_SEED_XA_B;
  return JSON.parse(JSON.stringify(seed));
}

export function createInitialDemoState(): DemoState {
  const xa_a = getInitialGoldenSeed("XA_A");
  const xa_b = getInitialGoldenSeed("XA_B");
  return {
    xa_a,
    xa_b,
    tenants: {
      XA_A: xa_a,
      XA_B: xa_b,
      xa_a: xa_a,
      xa_b: xa_b,
    },
    auditLogs: [...INITIAL_AUDIT_LOGS],
    revisions: {
      LIVE: {
        id: "REV-LIVE",
        code: "DEM-R-LIVE",
        title: "Dữ liệu Tác quyền Thời gian thực (Live View)",
        period: "Thời gian thực",
        status: "DRAFT",
        hash: "live-dynamic-state",
        signedBy: "",
        signedAt: "",
        revision: "LIVE",
        dataPayload: {},
        tenantCode: "XA_A",
      },
      REV_1: GOLDEN_SEED_XA_A.snapshots[0],
      REV_2: GOLDEN_SEED_XA_A.snapshots[1],
    },
    delegationExpired: false,
  };
}
