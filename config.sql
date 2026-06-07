-- ============================================================================
-- PROJECT: Personal Life Operating System (PLOS)
-- COMPONENT: Configuration Management & Auditing Engine
-- TECH STACK: PostgreSQL (Relational Core, JSONB Extensibility, Audit Triggers)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS & CLEANUP
-- ----------------------------------------------------------------------------
-- Ensure UUID extension is available for globally unique identifiers if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS cfg_type CASCADE;
DROP TABLE IF EXISTS cfg_modules CASCADE;

-- ----------------------------------------------------------------------------
-- 2. CORE CONFIGURATION TABLES
-- ----------------------------------------------------------------------------

-- Table: cfg_modules (High-level functional domains of PLOS)
CREATE TABLE cfg_modules (
    module_id VARCHAR(10) PRIMARY KEY,
    module_name VARCHAR(100) NOT NULL UNIQUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: cfg_type (Sub-categories/Entity templates linked to functional domains)
CREATE TABLE cfg_type (
    type_id SERIAL PRIMARY KEY,
    module_id VARCHAR(10) NOT NULL REFERENCES cfg_modules(module_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    config_type VARCHAR(100) NOT NULL,
    metadata_schema JSONB DEFAULT '{}'::jsonb, -- Validates structure or stores default fields for this type
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_module_config_type UNIQUE (module_id, config_type)
);

-- ----------------------------------------------------------------------------
-- 3. AUDIT LOGGING SYSTEM (The Traceability Engine)
-- ----------------------------------------------------------------------------

-- Table: audit_log (Central repository for all structural and configuration changes)
CREATE TABLE audit_log (
    audit_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    row_id VARCHAR(100) NOT NULL,    -- Stores primary key value as text for flexibility
    old_data JSONB,                 -- State of the row before the change (NULL on INSERT)
    new_data JSONB,                 -- State of the row after the change (NULL on DELETE)
    changed_by VARCHAR(50) DEFAULT 'PLOS_SYSTEM',
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create performance indexes for the Audit Log Engine
CREATE INDEX idx_audit_log_table_row ON audit_log(table_name, row_id);
CREATE INDEX idx_audit_log_changed_at ON audit_log(changed_at);

-- ----------------------------------------------------------------------------
-- 4. AUTOMATED PLOS AUDIT TRIGGER FUNCTION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_plos_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_row_id VARCHAR(100);
    v_old JSONB := NULL;
    v_new JSONB := NULL;
BEGIN
    -- Extract appropriate primary key value to string for row tracking
    IF TG_TABLE_NAME = 'cfg_modules' THEN
        IF TG_OP = 'DELETE' THEN v_row_id := OLD.module_id; ELSE v_row_id := NEW.module_id; END IF;
    ELSIF TG_TABLE_NAME = 'cfg_type' THEN
        IF TG_OP = 'DELETE' THEN v_row_id := OLD.type_id::text; ELSE v_row_id := NEW.type_id::text; END IF;
    ELSE
        v_row_id := 'UNKNOWN';
    END IF;

    -- Map system states to JSONB maps based on execution operation
    IF TG_OP = 'INSERT' THEN
        v_new := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD);
    END IF;

    -- Write to centralized audit ledger
    INSERT INTO audit_log (table_name, operation, row_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, v_row_id, v_old, v_new);

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        -- Update the updated_at column automatically on change
        NEW.updated_at := CURRENT_TIMESTAMP;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 5. ATTACH AUDIT TRIGGERS TO TABLES
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_audit_cfg_modules
    BEFORE INSERT OR UPDATE OR DELETE ON cfg_modules
    FOR EACH ROW EXECUTE FUNCTION fn_plos_audit_trigger();

CREATE TRIGGER trg_audit_cfg_type
    BEFORE INSERT OR UPDATE OR DELETE ON cfg_type
    FOR EACH ROW EXECUTE FUNCTION fn_plos_audit_trigger();

-- ----------------------------------------------------------------------------
-- 6. ENHANCED SEED DATA POPULATION
-- ----------------------------------------------------------------------------

-- Seed cfg_modules with primary PLOS operational domains
INSERT INTO cfg_modules (module_id, module_name, notes) VALUES
('FIN', 'Finance', 'All monetary interactions including cash, bank accounts, credit cards, investments, liabilities, and fixed deposits.'),
('GOV', 'Government & Governance', 'Official documentation, compliance records, and government identity entities (e.g., [Aadhaar Omitted], PAN, Passports, Driver Licences).'),
('PROD', 'Productivity & Work', 'Kanban parameters, workspace definitions, task execution loops, and status parameters.'),
('RECO', 'Relationships & CRM', 'Personal network tracking mapping interactions across friends, family, tenants, and professional colleagues.'),
('HLTH', 'Health & Fitness', 'Biometrics historical trackers, medical prescriptions, and scheduled health conditions checkups.');

-- Seed cfg_type with explicit sub-structures and extensible JSONB metadata schemas
INSERT INTO cfg_type (module_id, config_type, metadata_schema, notes) VALUES
('FIN', 'BankAccount', '{"allowed_currencies": ["USD", "INR", "EUR"], "require_routing": true}', 'Savings, Current, and Investment liquid cash holdings.'),
('FIN', 'CreditCardAccount', '{"limit_alert_threshold_pct": 80}', 'Credit accounts tracking limits, billing cycles, and utilization rates.'),
('FIN', 'FixedDeposit', '{"compounding_frequencies": ["Monthly", "Quarterly", "Maturity"]}', 'Fixed deposit records tracking principal, interest rate tiers, and maturity execution tasks.'),
('FIN', 'PersonalLoan', '{"amortization": "Simple Interest"}', 'Tracks loans issued out or debt capital obligations taken from counter-parties.'),

('GOV', 'NationalIdentity', '{"requires_expiry": false, "encrypted_vault_reference": true}', 'National structural identifiers including PAN, [Aadhaar Omitted], and Social Security records.'),
('GOV', 'TravelDocument', '{"requires_visa_tracking": true, "expiry_warning_days": 180}', 'Passports, Visas, and global border clearance records.'),
('GOV', 'LicenceAndPermit', '{"renewal_recurring_months": 12}', 'Driver licences, vehicle registrations, and professional regulatory certifications.'),

('PROD', 'KanbanWorkspace', '{"max_swimlanes": 10, "enable_dependencies": true}', 'Custom parameters initializing project workspaces and flow frameworks.'),
('RECO', 'PersonalContact', '{"interaction_cadence_days": 90}', 'Categorization fields for core CRM entities spanning tenants, borrowers, and immediate family.');

COMMIT;
