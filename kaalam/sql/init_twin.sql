-- ===========================================================================
-- 1. CONFIGURATION LAYER (The Engine Blueprints)
-- ===========================================================================

-- Use the existing cfg_modules table from config.sql
-- CREATE TABLE cfg_modules (
--     module_code TEXT PRIMARY KEY,
--     description TEXT NOT NULL
-- );

CREATE TABLE cfg_event_types (
    event_type_code TEXT PRIMARY KEY,
    module_code VARCHAR(10) NOT NULL REFERENCES cfg_modules(module_id),
    display_name TEXT NOT NULL
);

CREATE TABLE cfg_dimensions (
    dimension_code TEXT PRIMARY KEY,
    unit_code TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE cfg_attribute_keys (
    event_type_code TEXT NOT NULL REFERENCES cfg_event_types(event_type_code),
    attribute_key TEXT NOT NULL,
    is_required INTEGER DEFAULT 0,
    PRIMARY KEY (event_type_code, attribute_key)
);

-- ===========================================================================
-- 2. OPERATIONAL LAYER (The Slim Ledger)
-- ===========================================================================

CREATE TABLE twin_event (
    event_id TEXT PRIMARY KEY,
    event_type_code TEXT NOT NULL REFERENCES cfg_event_types(event_type_code),
    occurred_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE twin_impact (
    impact_id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES twin_event(event_id) ON DELETE CASCADE,
    dimension_code TEXT NOT NULL REFERENCES cfg_dimensions(dimension_code),
    value NUMERIC NOT NULL,
    target_entity TEXT NOT NULL
);

CREATE TABLE event_details (
    event_id TEXT NOT NULL REFERENCES twin_event(event_id) ON DELETE CASCADE,
    attribute_key TEXT NOT NULL,
    attribute_val TEXT NOT NULL,
    PRIMARY KEY (event_id, attribute_key)
);

-- ===========================================================================
-- 3. THE ANALYTICAL VIEWS
-- ===========================================================================

-- Financial Ledger View
CREATE VIEW vw_finance_balances AS
SELECT
    target_entity AS account_or_party,
    SUM(value) AS balance
FROM twin_impact
WHERE dimension_code = 'CURRENCY_USD'
GROUP BY target_entity;

-- Warranty Status View
CREATE VIEW vw_active_warranties AS
SELECT
    e.event_id,
    e.occurred_at AS purchase_date,
    d1.attribute_val AS item_name,
    d2.attribute_val AS serial_number,
    d3.attribute_val AS expiration_date
FROM twin_event e
JOIN event_details d1 ON e.event_id = d1.event_id AND d1.attribute_key = 'item_name'
JOIN event_details d2 ON e.event_id = d2.event_id AND d2.attribute_key = 'serial_no'
JOIN event_details d3 ON e.event_id = d3.event_id AND d3.attribute_key = 'expires_at'
WHERE CAST(d3.attribute_val AS DATE) >= CURRENT_DATE;

-- Health Log View
CREATE VIEW vw_health_vitals AS
SELECT
    e.occurred_at,
    MAX(CASE WHEN i.target_entity = 'SYS' THEN i.value END) AS systolic,
    MAX(CASE WHEN i.target_entity = 'DIA' THEN i.value END) AS diastolic,
    MAX(CASE WHEN i.target_entity = 'PULSE' THEN i.value END) AS heart_rate
FROM twin_event e
JOIN twin_impact i ON e.event_id = i.event_id
WHERE e.event_type_code = 'HEALTH_VITAL'
GROUP BY e.event_id, e.occurred_at;

-- ===========================================================================
-- 4. DETAILED SEED DATA INDUCTION
-- ===========================================================================

-- Seed Configurations
-- cfg_modules is seeded in config.sql
INSERT INTO cfg_modules (module_id, module_name, notes) VALUES
('WRNTY', 'Warranty', 'Asset tracking & protection lifespans'),
('LRN', 'Learning', 'Skill acquisition and tracking')
ON CONFLICT (module_id) DO NOTHING;
-- Note: FIN, HLTH, RECO (for CRM) are already in config.sql

INSERT INTO cfg_event_types VALUES
('FIN_INVOICE', 'FIN', 'Customer Invoice Issued (AR)'),
('FIN_PAYMENT', 'FIN', 'Payment Settlement received/made'),
('ASSET_BUY', 'WRNTY', 'Hardware asset purchase'),
('HEALTH_VITAL', 'HLTH', 'Blood pressure & pulse logging'),
('CRM_MEET', 'RECO', 'Coffee check-in or sync-up'),
('LEARN_COURSE', 'LRN', 'Completed instructional material');

INSERT INTO cfg_dimensions VALUES
('CURRENCY_USD', 'USD', 'United States Dollar balances'),
('BLOOD_PRESS', 'MMHG', 'Millimeters of mercury pressure metrics'),
('HEART_RATE', 'BPM', 'Beats per minute measurement'),
('EXPERIENCE', 'XP', 'Gamified knowledge accumulation metric');

INSERT INTO cfg_attribute_keys VALUES
('ASSET_BUY', 'item_name', 1),
('ASSET_BUY', 'serial_no', 1),
('ASSET_BUY', 'expires_at', 1),
('CRM_MEET', 'contact_name', 1),
('CRM_MEET', 'sentiment', 0),
('LEARN_COURSE', 'course_title', 1);

-- Seed Life Events & Impacts

-- Event 1: Issued an AR Invoice to client (Finance/AR)
INSERT INTO twin_event (event_id, event_type_code, occurred_at) VALUES ('ev-001', 'FIN_INVOICE', '2026-06-01 09:00:00');
INSERT INTO twin_impact VALUES ('imp-001', 'ev-001', 'CURRENCY_USD', 4500.00, 'ACCOUNTS_RECEIVABLE');
INSERT INTO twin_impact VALUES ('imp-002', 'ev-001', 'CURRENCY_USD', -4500.00, 'REVENUE_CONSULTING');

-- Event 2: Client Paid 50% of the Invoice (Finance/Cash matching)
INSERT INTO twin_event (event_id, event_type_code, occurred_at) VALUES ('ev-002', 'FIN_PAYMENT', '2026-06-04 14:30:00');
INSERT INTO twin_impact VALUES ('imp-003', 'ev-002', 'CURRENCY_USD', 2250.00, 'BANK_CHASE_CHECKING');
INSERT INTO twin_impact VALUES ('imp-004', 'ev-002', 'CURRENCY_USD', -2250.00, 'ACCOUNTS_RECEIVABLE');

-- Event 3: Bought a new Work Laptop (Shopping + Warranty Engine)
INSERT INTO twin_event (event_id, event_type_code, occurred_at) VALUES ('ev-003', 'ASSET_BUY', '2026-06-05 11:15:00');
INSERT INTO twin_impact VALUES ('imp-005', 'ev-003', 'CURRENCY_USD', -1299.00, 'BANK_CHASE_CHECKING');
INSERT INTO event_details VALUES ('ev-003', 'item_name', 'MacBook Pro M4 14 Inch');
INSERT INTO event_details VALUES ('ev-003', 'serial_no', 'C02F83H0Q05D');
INSERT INTO event_details VALUES ('ev-003', 'expires_at', '2028-06-05'); -- 2 Year Warranty expiration

-- Event 4: Morning Health Checkup (Health metrics tracking)
INSERT INTO twin_event (event_id, event_type_code, occurred_at) VALUES ('ev-004', 'HEALTH_VITAL', '2026-06-06 07:00:00');
INSERT INTO twin_impact VALUES ('imp-006', 'ev-004', 'BLOOD_PRESS', 118.0, 'SYS');
INSERT INTO twin_impact VALUES ('imp-007', 'ev-004', 'BLOOD_PRESS', 79.0, 'DIA');
INSERT INTO twin_impact VALUES ('imp-008', 'ev-004', 'HEART_RATE', 64.0, 'PULSE');

-- Event 5: Professional Networking meeting (CRM)
INSERT INTO twin_event (event_id, event_type_code, occurred_at) VALUES ('ev-005', 'CRM_MEET', '2026-06-06 12:00:00');
INSERT INTO event_details VALUES ('ev-005', 'contact_name', 'Sarah Jenkins (VP of Engineering)');
INSERT INTO event_details VALUES ('ev-005', 'sentiment', 'Excellent sync. Expressed interest in scaling contract team next quarter.');

-- Event 6: Finished a programming certification module (Learning/XP aggregation)
INSERT INTO twin_event (event_id, event_type_code, occurred_at) VALUES ('ev-006', 'LEARN_COURSE', '2026-06-06 22:00:00');
INSERT INTO twin_impact VALUES ('imp-009', 'ev-006', 'EXPERIENCE', 250.0, 'GO_LANG_SKILL');
INSERT INTO event_details VALUES ('ev-006', 'course_title', 'Advanced Concurrency Patterns in Go');