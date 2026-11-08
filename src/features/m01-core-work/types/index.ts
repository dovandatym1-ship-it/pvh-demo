export interface MasterSubjectDTO {
  id: string;
  tenantId: string;
  code: string;
  fullName: string;
  subjectType: string;
  idCardNumber?: string;
  address?: string;
  hamletId?: string;
}

export interface WorkTaskDTO {
  id: string;
  tenantId: string;
  code: string;
  title: string;
  category: string;
  assignedTo?: string;
  dueDate: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
}
