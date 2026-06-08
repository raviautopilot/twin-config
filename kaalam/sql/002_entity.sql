-- ===========================================================================
-- 2. OPERATIONAL LAYER (The Slim Ledger) - ENTITY TABLES
-- ===========================================================================

-- Table: person
-- Holds detailed information about individuals.
CREATE TABLE person (
    person_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    middle_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(10),
    nationality VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(50),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    father_name VARCHAR(200),
    mother_name VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE TYPE financial_entity_type AS ENUM (
    'BANK_ACCOUNT',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'FIXED_DEPOSIT',
    'LOAN',
    'OVERDRAFT'
);

-- Table: fin_entity (All-in-One Monolithic Structure)
CREATE TABLE fin_entity (
    -- ==========================================
    -- 1. CORE SHARED FIELDS (Applies to all)
    -- ==========================================
                            fin_entity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                            entity_type financial_entity_type NOT NULL,
                            entity_name VARCHAR(255) NOT NULL,              -- e.g., "Barclays Premier", "SBI Home Loan"
                            owner_person_id UUID REFERENCES person(person_id) ON DELETE SET NULL,
                            balance NUMERIC(19, 4) DEFAULT 0.0000,          -- Current balance, remaining loan principal, or card balance
                            currency VARCHAR(3) NOT NULL,                   -- e.g., 'INR', 'GBP', 'USD'
                            is_active BOOLEAN DEFAULT TRUE NOT NULL,
                            notes TEXT,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- ==========================================
    -- 2. GLOBAL & REGIONAL BANKING IDENTIFIERS
    --    (Bank Accounts, FDs, Loans, Overdrafts)
    -- ==========================================
                            bank_name VARCHAR(255),
                            branch_name VARCHAR(255),
                            account_number VARCHAR(100),                     -- Primary account/loan number
                            iban VARCHAR(34) UNIQUE,                         -- International Bank Account Number
                            bic_swift VARCHAR(11),                           -- SWIFT code for global wire transfers

    -- Indian Routing
                            ifsc VARCHAR(11),                                -- Indian Financial System Code
                            micr VARCHAR(9),                                 -- Cheque clearing code
                            bsr_code VARCHAR(7),                             -- Basic Statistical Returns code

    -- UK Routing
                            sort_code VARCHAR(6),                            -- UK 6-digit sort code
                            roll_number VARCHAR(50),                         -- Building Society Roll Number

    -- ==========================================
    -- 3. CARD IDENTIFIERS (Credit & Debit Cards)
    -- ==========================================
                            card_number_masked VARCHAR(19),                 -- e.g., "XXXX-XXXX-XXXX-4321"
                            card_network VARCHAR(50),                        -- 'VISA', 'MASTERCARD', 'AMEX', 'RUPAY'
                            card_holder_name VARCHAR(255),
                            issue_date DATE,
                            expiry_date DATE,

    -- ==========================================
    -- 4. CREDIT CARD SPECIFIC FIELDS
    -- ==========================================
                            credit_limit NUMERIC(19, 4),
                            available_limit NUMERIC(19, 4),
                            minimum_due NUMERIC(19, 4),
                            statement_date_day INT CHECK (statement_date_day BETWEEN 1 AND 31),
                            payment_due_date_day INT CHECK (payment_due_date_day BETWEEN 1 AND 31),

    -- ==========================================
    -- 5. FIXED DEPOSIT (FD) SPECIFIC FIELDS
    -- ==========================================
                            fd_receipt_number VARCHAR(100),
                            principal_amount NUMERIC(19, 4),
                            compounding_frequency VARCHAR(50),               -- 'MONTHLY', 'QUARTERLY', 'MATURITY'
                            booking_date DATE,
                            maturity_date DATE,
                            maturity_amount NUMERIC(19, 4),
                            is_cumulative BOOLEAN,                          -- TRUE if interest is reinvested

    -- ==========================================
    -- 6. LOAN SPECIFIC FIELDS
    -- ==========================================
                            loan_type VARCHAR(50),                          -- 'HOME', 'PERSONAL', 'AUTO'
                            sanctioned_amount NUMERIC(19, 4),
                            interest_type VARCHAR(20),                      -- 'FIXED', 'FLOATING'
                            tenure_months INT,
                            emi_amount NUMERIC(19, 4),                      -- Equated Monthly Installment
                            next_emi_date DATE,

    -- ==========================================
    -- 7. OVERDRAFT & GENERIC INTEREST FIELDS
    -- ==========================================
                            overdraft_limit NUMERIC(19, 4),
                            interest_rate NUMERIC(5, 3),                     -- Shared by Loans, FDs, Credit Cards (APR), and Overdrafts
                            linked_parent_entity_id UUID REFERENCES fin_entity(fin_entity_id) ON DELETE SET NULL,
    -- ^ Crucial: Allows a Debit Card, FD, or Overdraft to point back to its primary Bank Account row.

    -- ==========================================
    -- 8. INTEGRITY CONSTRAINTS & VALIDATIONS
    -- ==========================================
                            CONSTRAINT chk_india_ifsc CHECK (ifsc IS NULL OR ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
                            CONSTRAINT chk_united_kingdom_sort_code CHECK (sort_code IS NULL OR sort_code ~ '^[0-9]{6}$')
);

-- Indexing for rapid lookups on regional routing codes
CREATE INDEX idx_fin_entity_ifsc ON fin_entity(ifsc) WHERE ifsc IS NOT NULL;
CREATE INDEX idx_fin_entity_sort_code ON fin_entity(sort_code) WHERE sort_code IS NOT NULL;