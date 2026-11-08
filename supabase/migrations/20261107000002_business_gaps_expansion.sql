-- ====================================================================
-- PVH v1.0 — EXTENSION SCHEMA FOR 7 BUSINESS GAPS
-- Target: PostgreSQL 17 (Supabase Cloud & Local)
-- Compliance: D03 Module Isolation & Multi-tenancy RLS
-- Date: 07/11/2026
-- Migration: 20261107000002_business_gaps_expansion.sql
-- ====================================================================

-- --------------------------------------------------------------------
-- 0. ALTER EXISTING BASE TABLES (Cập nhật bảng gốc bị thiếu)
-- --------------------------------------------------------------------
ALTER TABLE master_subjects 
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS merged_into_id UUID REFERENCES master_subjects(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES master_subjects(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS household_relation VARCHAR(50),
    ADD COLUMN IF NOT EXISTS members_count INT DEFAULT 1;

-- --------------------------------------------------------------------
-- 1. EXTENSION FOR M02: LABOR, WAGES & DISPUTES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS labor_contracts_wages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES master_facilities(id) ON DELETE SET NULL,
    business_name VARCHAR(255) NOT NULL,
    tax_code VARCHAR(50),
    total_workers INT NOT NULL DEFAULT 1,
    min_wage_paid NUMERIC(12,2) NOT NULL,
    regional_min_wage NUMERIC(12,2) NOT NULL,
    is_under_min_wage BOOLEAN GENERATED ALWAYS AS (min_wage_paid < regional_min_wage) STORED,
    seasonal_workers_count INT DEFAULT 0,
    bhxh_registered_count INT DEFAULT 0,
    evaluation_period VARCHAR(50) NOT NULL, -- 'Q1-2026', 'YEAR-2026'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS labor_disputes_mediation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    case_code VARCHAR(50) NOT NULL,
    requester_name VARCHAR(255) NOT NULL,
    requester_role VARCHAR(50) NOT NULL, -- 'EMPLOYEE', 'EMPLOYER', 'COLLECTIVE'
    respondent_name VARCHAR(255) NOT NULL,
    dispute_content TEXT NOT NULL,
    mediator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    session_date DATE,
    attendance_count INT DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'RECEIVED', -- 'RECEIVED', 'SCHEDULED', 'RESOLVED_SUCCESS', 'RESOLVED_FAILED', 'CLOSED_ABSENT'
    outcome_summary TEXT,
    result_document_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_dispute_tenant_code UNIQUE (tenant_id, case_code)
);

CREATE TABLE IF NOT EXISTS labor_underage_monitoring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    minor_subject_id UUID NOT NULL REFERENCES master_subjects(id) ON DELETE CASCADE,
    employer_name VARCHAR(255) NOT NULL,
    guardian_consent_doc VARCHAR(500) NOT NULL,
    allowed_job_category VARCHAR(100) NOT NULL, -- 'ARTS', 'SPORTS', 'TRADITIONAL_CRAFT'
    daily_hours NUMERIC(3,1) NOT NULL,
    CONSTRAINT chk_underage_hours CHECK (daily_hours <= 4.0),
    health_certificate_valid_until DATE NOT NULL,
    inspection_status VARCHAR(50) NOT NULL DEFAULT 'COMPLIANT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 2. EXTENSION FOR M03: PRIVATE PRESCHOOLS & COMMUNITY LEARNING
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS education_private_facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES master_facilities(id) ON DELETE CASCADE,
    facility_type VARCHAR(100) NOT NULL, -- 'INDEPENDENT_NURSERY_GROUP', 'INDEPENDENT_KINDERGARTEN_CLASS'
    owner_name VARCHAR(255) NOT NULL,
    owner_id_card VARCHAR(50),
    management_credential VARCHAR(255),
    children_capacity INT NOT NULL,
    current_enrolled INT NOT NULL,
    total_area_sqm NUMERIC(6,2) NOT NULL,
    sqm_per_child NUMERIC(4,2) GENERATED ALWAYS AS (ROUND(total_area_sqm / GREATEST(current_enrolled, 1), 2)) STORED,
    fire_safety_certified BOOLEAN NOT NULL DEFAULT false,
    food_safety_certified BOOLEAN NOT NULL DEFAULT false,
    licensing_status VARCHAR(50) NOT NULL DEFAULT 'LICENSED', -- 'LICENSED', 'PROBATION', 'SUSPENDED', 'DISSOLVED'
    last_inspected_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_learning_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    center_name VARCHAR(255) NOT NULL,
    director_name VARCHAR(150) NOT NULL, -- Vice chairman concurrent
    annual_plan_approved BOOLEAN NOT NULL DEFAULT false,
    courses_conducted INT DEFAULT 0,
    total_learners INT DEFAULT 0,
    annual_rating VARCHAR(50) DEFAULT 'GOOD', -- 'EXCELLENT', 'GOOD', 'AVERAGE', 'WEAK'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 3. EXTENSION FOR M04: FESTIVAL REGISTRATION & DOMESTIC VIOLENCE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS festival_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    reg_type VARCHAR(50) NOT NULL, -- 'OFFICIAL_REGISTRATION' (BL-046) vs 'NOTIFICATION' (BL-047)
    code VARCHAR(50) NOT NULL,
    festival_name VARCHAR(255) NOT NULL,
    organizer_name VARCHAR(255) NOT NULL,
    scale VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location_desc TEXT NOT NULL,
    attached_plan_url VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED', 
    -- For REGISTRATION: 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'
    -- For NOTIFICATION: 'SUBMITTED', 'CHECKING', 'RECORDED', 'OBJECTION_RAISED'
    decision_ref VARCHAR(100),
    decision_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_festival_tenant_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS cultural_services_monitoring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES master_facilities(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL, -- 'PHOTOCOPY_SHOP', 'MOBILE_CINEMA', 'PUBLIC_GAME'
    owner_name VARCHAR(255) NOT NULL,
    device_count INT DEFAULT 1,
    content_commitment_signed BOOLEAN NOT NULL DEFAULT true,
    last_compliance_check DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Highly sensitive table: Domestic Violence Cases (PCBLGĐ)
CREATE TABLE IF NOT EXISTS domestic_violence_dossiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hamlet_id UUID REFERENCES hamlets(id) ON DELETE SET NULL,
    case_code VARCHAR(50) NOT NULL,
    victim_subject_id UUID REFERENCES master_subjects(id) ON DELETE CASCADE,
    perpetrator_name VARCHAR(255),
    perpetrator_relation VARCHAR(100),
    severity_level VARCHAR(50) NOT NULL, -- 'URGENT_DANGER', 'MEDIUM_RISK', 'LOW_RISK'
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    emergency_restraining_order BOOLEAN NOT NULL DEFAULT false,
    restraining_order_until TIMESTAMPTZ,
    temporary_shelter_arranged VARCHAR(255),
    intervention_status VARCHAR(50) NOT NULL DEFAULT 'INTERVENING', -- 'REPORTED', 'INTERVENING', 'REHABILITATING', 'SAFE_CLOSED'
    assigned_officer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    closure_assessment TEXT,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_dv_tenant_code UNIQUE (tenant_id, case_code)
);

-- --------------------------------------------------------------------
-- 4. EXTENSION FOR M06: FOOD SAFETY, PRIVATE CLINICS & EPIDEMICS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS food_safety_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES master_facilities(id) ON DELETE CASCADE,
    inspection_type VARCHAR(50) NOT NULL, -- 'STREET_FOOD', 'SCHOOL_CANTEEN', 'ARTISAN_PRODUCER'
    inspector_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    water_source_passed BOOLEAN NOT NULL,
    waste_handling_passed BOOLEAN NOT NULL,
    utensils_sanitized BOOLEAN NOT NULL,
    food_origin_verified BOOLEAN NOT NULL,
    sample_retention_24h_passed BOOLEAN, -- mandatory for school canteen
    health_cert_valid BOOLEAN NOT NULL,
    total_score INT NOT NULL,
    conclusion VARCHAR(50) NOT NULL, -- 'PASSED', 'WARNING_REMEDIAL', 'FAILED_SUSPEND'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS private_medical_pharmacy_facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES master_facilities(id) ON DELETE CASCADE,
    facility_sub_type VARCHAR(50) NOT NULL, -- 'TRADITIONAL_CLINIC', 'SPECIALIZED_CLINIC', 'DRUG_STORE'
    practitioner_name VARCHAR(150) NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    license_issue_date DATE NOT NULL,
    gpp_certified BOOLEAN NOT NULL DEFAULT true,
    controlled_drugs_ledger_maintained BOOLEAN NOT NULL DEFAULT true,
    inspection_status VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS epidemic_surveillance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hamlet_id UUID NOT NULL REFERENCES hamlets(id) ON DELETE CASCADE,
    disease_group VARCHAR(10) NOT NULL, -- 'GROUP_A', 'GROUP_B', 'GROUP_C'
    disease_name VARCHAR(100) NOT NULL, -- 'DENGUE', 'MEASLES', 'HAND_FOOT_MOUTH'
    cases_count INT NOT NULL DEFAULT 1,
    hospitalized_count INT DEFAULT 0,
    deaths_count INT DEFAULT 0,
    outbreak_alert_flag BOOLEAN NOT NULL DEFAULT false,
    log_week INT NOT NULL,
    log_year INT NOT NULL,
    reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 5. EXTENSION FOR M07: RELIGION IRREGULARITIES & ETHNIC ALLOCATIONS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS religious_irregularities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hamlet_id UUID NOT NULL REFERENCES hamlets(id) ON DELETE CASCADE,
    incident_code VARCHAR(50) NOT NULL,
    location_desc TEXT NOT NULL,
    organizer_identified VARCHAR(255),
    attendees_estimated INT DEFAULT 0,
    nature_type VARCHAR(100) NOT NULL, -- 'UNREGISTERED_GATHERING', 'NEW_RELIGIOUS_PHENOMENON', 'SUSPECTED_CULT'
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action_taken VARCHAR(100) NOT NULL, -- 'GUIDED_OFFICIAL_REGISTRATION', 'DISPERSED_CEASED', 'TRANSFERRED_POLICE'
    transferred_to VARCHAR(150),
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'MONITORING', 'RESOLVED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_religion_tenant_code UNIQUE (tenant_id, incident_code)
);

CREATE TABLE IF NOT EXISTS ethnic_policy_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES master_subjects(id) ON DELETE CASCADE,
    hamlet_id UUID NOT NULL REFERENCES hamlets(id) ON DELETE CASCADE,
    program_code VARCHAR(50) NOT NULL DEFAULT 'MTQG_1719',
    sub_project_type VARCHAR(100) NOT NULL, -- 'HOUSING_AID', 'LAND_AID', 'WATER_SUPPLY', 'JOB_TRANSITION'
    budget_allocated NUMERIC(14,2) NOT NULL,
    public_posting_start DATE NOT NULL,
    public_posting_end DATE NOT NULL,
    objection_filed BOOLEAN NOT NULL DEFAULT false,
    approval_decision_ref VARCHAR(100),
    disbursement_status VARCHAR(50) NOT NULL DEFAULT 'POSTED', -- 'POSTED', 'APPROVED', 'DISBURSED', 'REJECTED'
    disbursed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 6. EXTENSION FOR M01: CITIZEN RESIDENCE & IDENTITY MERGES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS citizen_residence_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES master_subjects(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'SPLIT_HOUSEHOLD', 'MERGE_HOUSEHOLD', 'RELOCATE_HAMLET', 'IN_MIGRATION', 'OUT_MIGRATION'
    old_hamlet_id UUID REFERENCES hamlets(id) ON DELETE SET NULL,
    new_hamlet_id UUID REFERENCES hamlets(id) ON DELETE SET NULL,
    old_household_code VARCHAR(50),
    new_household_code VARCHAR(50),
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_document VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS citizen_identity_merges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    golden_subject_id UUID NOT NULL REFERENCES master_subjects(id) ON DELETE CASCADE,
    merged_subject_id UUID NOT NULL REFERENCES master_subjects(id) ON DELETE CASCADE,
    merged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    merged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 7. EXTENSION FOR M10: BULK EXCEL INTAKE & EXCEPTION QUEUE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS import_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    batch_code VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_sha256 VARCHAR(64) NOT NULL,
    target_entity VARCHAR(100) NOT NULL, -- 'MASTER_SUBJECTS', 'CULTURAL_TITLES', 'EPIDEMIC_LOGS'
    total_rows INT NOT NULL DEFAULT 0,
    valid_rows INT NOT NULL DEFAULT 0,
    error_rows INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'UPLOADED', -- 'UPLOADED', 'PARSED', 'PREVIEW_READY', 'COMMITTED', 'ROLLED_BACK'
    imported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    committed_at TIMESTAMPTZ,
    receipt_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS import_row_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    raw_data JSONB NOT NULL,
    error_code VARCHAR(50) NOT NULL, -- 'EX_INVALID_HAMLET', 'EX_IDENTITY_MISMATCH', 'EX_VALUE_OUT_OF_RANGE'
    error_message TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    corrected_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 8. SECURITY & RLS POLICIES FOR EXTENDED TABLES
-- --------------------------------------------------------------------
ALTER TABLE labor_contracts_wages ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_disputes_mediation ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_underage_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_private_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_learning_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_services_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE domestic_violence_dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_safety_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_medical_pharmacy_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE epidemic_surveillance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE religious_irregularities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ethnic_policy_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_residence_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_identity_merges ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_row_exceptions ENABLE ROW LEVEL SECURITY;

-- Standard tenant isolation policies
CREATE POLICY tenant_isolation_labor_contracts ON labor_contracts_wages FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);
CREATE POLICY tenant_isolation_disputes ON labor_disputes_mediation FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);
CREATE POLICY tenant_isolation_underage ON labor_underage_monitoring FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);
CREATE POLICY tenant_isolation_edu_private ON education_private_facilities FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);
CREATE POLICY tenant_isolation_clc ON community_learning_centers FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);
CREATE POLICY tenant_isolation_festivals ON festival_records FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);
CREATE POLICY tenant_isolation_cultural_svc ON cultural_services_monitoring FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);
CREATE POLICY tenant_isolation_food_safety ON food_safety_checklists FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);
CREATE POLICY tenant_isolation_med_pharm ON private_medical_pharmacy_facilities FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);
CREATE POLICY tenant_isolation_epidemic ON epidemic_surveillance_logs FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);
CREATE POLICY tenant_isolation_religion ON religious_irregularities FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);
CREATE POLICY tenant_isolation_ethnic_aid ON ethnic_policy_allocations FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);
CREATE POLICY tenant_isolation_residence ON citizen_residence_history FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);
CREATE POLICY tenant_isolation_identity_merge ON citizen_identity_merges FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);
CREATE POLICY tenant_isolation_import_batch ON import_batches FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);
CREATE POLICY tenant_isolation_exceptions ON import_row_exceptions FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);

-- SECURED STRICT RLS POLICY: Domestic Violence Dossiers (Chỉ P2, P3 được đọc ghi)
CREATE POLICY dv_strict_access ON domestic_violence_dossiers
    FOR ALL
    USING (
        (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL)
        AND current_setting('app.current_persona', true) IN ('P2', 'P3')
    );

-- --------------------------------------------------------------------
-- 9. RPC FUNCTIONS: AGGREGATE STATS & ATOMIC IDENTITY MERGE
-- --------------------------------------------------------------------
-- Hàm thống kê an toàn cho P1/P4/P5 không để lộ danh tính nạn nhân bạo lực
CREATE OR REPLACE FUNCTION get_domestic_violence_aggregate_stats(target_tenant_id UUID)
RETURNS TABLE (
    total_cases BIGINT,
    urgent_danger_cases BIGINT,
    restraining_orders_count BIGINT,
    active_interventions_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        COUNT(*)::BIGINT AS total_cases,
        COUNT(*) FILTER (WHERE severity_level = 'URGENT_DANGER')::BIGINT AS urgent_danger_cases,
        COUNT(*) FILTER (WHERE emergency_restraining_order = true)::BIGINT AS restraining_orders_count,
        COUNT(*) FILTER (WHERE intervention_status = 'INTERVENING')::BIGINT AS active_interventions_count
    FROM domestic_violence_dossiers
    WHERE tenant_id = target_tenant_id;
$$;

-- Giao dịch ghép định danh nguyên tử (Atomic Merge)
CREATE OR REPLACE FUNCTION merge_citizen_identities(
    p_tenant_id UUID,
    p_golden_id UUID,
    p_merged_id UUID,
    p_officer_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Chuyển khóa ngoại từ các bảng vệ tinh thực tế
    UPDATE cultural_titles SET subject_id = p_golden_id WHERE subject_id = p_merged_id AND tenant_id = p_tenant_id;
    UPDATE ethnic_policy_allocations SET subject_id = p_golden_id WHERE subject_id = p_merged_id AND tenant_id = p_tenant_id;
    UPDATE domestic_violence_dossiers SET victim_subject_id = p_golden_id WHERE victim_subject_id = p_merged_id AND tenant_id = p_tenant_id;
    
    -- 2. Đánh dấu bản ghi cũ
    UPDATE master_subjects 
    SET status = 'MERGED_INACTIVE', merged_into_id = p_golden_id, updated_at = NOW() 
    WHERE id = p_merged_id AND tenant_id = p_tenant_id;
    
    -- 3. Ghi vết kiểm toán biến động
    INSERT INTO citizen_identity_merges (tenant_id, golden_subject_id, merged_subject_id, merged_by, reason)
    VALUES (p_tenant_id, p_golden_id, p_merged_id, p_officer_id, p_reason);
    
    RETURN jsonb_build_object('success', true, 'golden_id', p_golden_id, 'merged_id', p_merged_id);
END;
$$;
