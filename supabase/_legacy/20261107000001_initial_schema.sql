-- ====================================================================
-- PVH v1.0 — INITIAL DATABASE SCHEMA
-- Target Database: PostgreSQL 17 (Supabase)
-- Architecture: Multi-tenancy with Tenant Isolation & RLS Policies
-- Date: 07/11/2026
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------
-- 1. TENANTS & UNITS (Đơn vị hành chính cấp xã)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    province VARCHAR(100) NOT NULL DEFAULT 'Thái Nguyên',
    district VARCHAR(100) NOT NULL DEFAULT 'TP. Thái Nguyên',
    officer_mode VARCHAR(50) NOT NULL DEFAULT 'CONCURRENT', -- 'CONCURRENT' or 'SPECIALIZED'
    features JSONB NOT NULL DEFAULT '{"digitalTransformation": true, "fieldInspection": true, "advancedCulturalTitles": true}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hamlets / Thôn / Xóm
CREATE TABLE IF NOT EXISTS hamlets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    leader_name VARCHAR(100),
    households_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_hamlet_tenant_code UNIQUE (tenant_id, code)
);

-- --------------------------------------------------------------------
-- 2. USERS & PROFILES (Cán bộ & Người dùng hệ thống)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    persona_code VARCHAR(20) NOT NULL, -- 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    can_view_pii BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 3. MASTER DATA: SUBJECTS & FACILITIES (Chủ thể & Cơ sở VH-XH)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS master_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hamlet_id UUID REFERENCES hamlets(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    subject_type VARCHAR(100) NOT NULL, -- 'HOUSEHOLD_HEAD', 'SOCIAL_AID_BENEFICIARY', 'WAR_INVALID', etc.
    id_card_number VARCHAR(50),
    address VARCHAR(255),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_subject_tenant_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS master_facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hamlet_id UUID REFERENCES hamlets(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'CULTURAL_HOUSE', 'HISTORICAL_MONUMENT', 'SPORTS_GROUND'
    capacity VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 4. FLOW DEM-KH: INTER-DEPARTMENTAL WORK PLANS & TASKS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS work_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    due_date DATE NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- 'HIGH', 'MEDIUM', 'LOW'
    status VARCHAR(50) NOT NULL DEFAULT 'TODO', -- 'TODO', 'IN_PROGRESS', 'COMPLETED'
    source_ref VARCHAR(100),
    hamlet_id UUID REFERENCES hamlets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 5. FLOW DEM-VH: CULTURAL TITLES (Gia đình văn hóa, Thôn văn hóa)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cultural_titles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    hamlet_id UUID REFERENCES hamlets(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES master_subjects(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    household_head VARCHAR(255) NOT NULL,
    members_count INT DEFAULT 4,
    evaluation_year INT NOT NULL DEFAULT 2026,
    score INT NOT NULL DEFAULT 80,
    years_recognized INT DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PROPOSED', -- 'PROPOSED', 'EVALUATED', 'APPROVED', 'REJECTED'
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 6. FLOW DEM-KT: INSPECTIONS & FIELD REMEDIATION
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspection_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    target_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    hamlet_id UUID REFERENCES hamlets(id) ON DELETE SET NULL,
    inspector_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    findings_count INT NOT NULL DEFAULT 0,
    remediation_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'NO_VIOLATION', 'PENDING', 'IN_PROGRESS', 'RESOLVED'
    remediation_deadline DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 7. FLOW DEM-R / M09: IMMUTABLE REPORT SNAPSHOTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    period VARCHAR(50) NOT NULL,
    indicators_data JSONB NOT NULL,
    signed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    signed_at TIMESTAMPTZ,
    sha256_hash VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'LOCKED_IMMUTABLE'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 8. AUDIT LOGS (Vết kiểm toán hệ thống)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    persona_code VARCHAR(20),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE hamlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write during demo mode or for authenticated tenant members
CREATE POLICY tenant_isolation_subjects ON master_subjects
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);

CREATE POLICY tenant_isolation_tasks ON work_tasks
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);

CREATE POLICY tenant_isolation_titles ON cultural_titles
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);

CREATE POLICY tenant_isolation_inspections ON inspection_records
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);

CREATE POLICY tenant_isolation_reports ON report_snapshots
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid OR current_setting('app.current_tenant_id', true) IS NULL);
