package models

import (
	"database/sql/driver"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// FinancialEntityType represents the custom postgres enum type financial_entity_type
type FinancialEntityType string

const (
	BankAccount  FinancialEntityType = "BANK_ACCOUNT"
	CreditCard   FinancialEntityType = "CREDIT_CARD"
	DebitCard    FinancialEntityType = "DEBIT_CARD"
	FixedDeposit FinancialEntityType = "FIXED_DEPOSIT"
	Loan         FinancialEntityType = "LOAN"
	Overdraft    FinancialEntityType = "OVERDRAFT"
)

// Scan implements the sql.Scanner interface for FinancialEntityType
func (f *FinancialEntityType) Scan(value interface{}) error {
	if value == nil {
		*f = ""
		return nil
	}
	switch v := value.(type) {
	case string:
		*f = FinancialEntityType(v)
	case []byte:
		*f = FinancialEntityType(string(v))
	default:
		return fmt.Errorf("invalid type for FinancialEntityType: %T", value)
	}
	return nil
}

// Value implements the driver.Valuer interface for FinancialEntityType
func (f FinancialEntityType) Value() (driver.Value, error) {
	return string(f), nil
}

// Person maps to person table
type Person struct {
	PersonID      uuid.UUID  `gorm:"column:person_id;type:uuid;primaryKey;default:uuid_generate_v4()" json:"person_id"`
	FirstName     string     `gorm:"column:first_name;type:varchar(100);not null" json:"first_name"`
	LastName      *string    `gorm:"column:last_name;type:varchar(100)" json:"last_name,omitempty"`
	MiddleName    *string    `gorm:"column:middle_name;type:varchar(100)" json:"middle_name,omitempty"`
	DateOfBirth   *time.Time `gorm:"column:date_of_birth;type:date" json:"date_of_birth,omitempty"`
	Gender        *string    `gorm:"column:gender;type:varchar(10)" json:"gender,omitempty"`
	Nationality   *string    `gorm:"column:nationality;type:varchar(100)" json:"nationality,omitempty"`
	Email         *string    `gorm:"column:email;type:varchar(255);unique" json:"email,omitempty"`
	PhoneNumber   *string    `gorm:"column:phone_number;type:varchar(50)" json:"phone_number,omitempty"`
	AddressLine1  *string    `gorm:"column:address_line1;type:varchar(255)" json:"address_line1,omitempty"`
	AddressLine2  *string    `gorm:"column:address_line2;type:varchar(255)" json:"address_line2,omitempty"`
	City          *string    `gorm:"column:city;type:varchar(100)" json:"city,omitempty"`
	StateProvince *string    `gorm:"column:state_province;type:varchar(100)" json:"state_province,omitempty"`
	PostalCode    *string    `gorm:"column:postal_code;type:varchar(20)" json:"postal_code,omitempty"`
	Country       *string    `gorm:"column:country;type:varchar(100)" json:"country,omitempty"`
	FatherName    *string    `gorm:"column:father_name;type:varchar(200)" json:"father_name,omitempty"`
	MotherName    *string    `gorm:"column:mother_name;type:varchar(200)" json:"mother_name,omitempty"`
	CreatedAt     time.Time  `gorm:"column:created_at;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt     time.Time  `gorm:"column:updated_at;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// TableName overrides GORM's default table naming convention
func (Person) TableName() string {
	return "person"
}

// FinEntity maps to fin_entity table (monolithic financial entities)
type FinEntity struct {
	// CORE SHARED FIELDS
	FinEntityID   uuid.UUID           `gorm:"column:fin_entity_id;type:uuid;primaryKey;default:uuid_generate_v4()" json:"fin_entity_id"`
	EntityType    FinancialEntityType `gorm:"column:entity_type;type:financial_entity_type;not null" json:"entity_type"`
	EntityName    string              `gorm:"column:entity_name;type:varchar(255);not null" json:"entity_name"`
	OwnerPersonID *uuid.UUID          `gorm:"column:owner_person_id;type:uuid" json:"owner_person_id,omitempty"`
	Balance       float64             `gorm:"column:balance;type:numeric(19,4);default:0.0000" json:"balance"`
	Currency      string              `gorm:"column:currency;type:varchar(3);not null" json:"currency"`
	IsActive      bool                `gorm:"column:is_active;default:true;not null" json:"is_active"`
	Notes         *string             `gorm:"column:notes;type:text" json:"notes,omitempty"`
	CreatedAt     time.Time           `gorm:"column:created_at;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt     time.Time           `gorm:"column:updated_at;default:CURRENT_TIMESTAMP" json:"updated_at"`

	// GLOBAL & REGIONAL BANKING IDENTIFIERS
	BankName      *string `gorm:"column:bank_name;type:varchar(255)" json:"bank_name,omitempty"`
	BranchName    *string `gorm:"column:branch_name;type:varchar(255)" json:"branch_name,omitempty"`
	AccountNumber *string `gorm:"column:account_number;type:varchar(100)" json:"account_number,omitempty"`
	IBAN          *string `gorm:"column:iban;type:varchar(34);unique" json:"iban,omitempty"`
	BICSwift      *string `gorm:"column:bic_swift;type:varchar(11)" json:"bic_swift,omitempty"`

	// Indian Routing
	IFSC    *string `gorm:"column:ifsc;type:varchar(11)" json:"ifsc,omitempty"`
	MICR    *string `gorm:"column:micr;type:varchar(9)" json:"micr,omitempty"`
	BSRCode *string `gorm:"column:bsr_code;type:varchar(7)" json:"bsr_code,omitempty"`

	// UK Routing
	SortCode   *string `gorm:"column:sort_code;type:varchar(6)" json:"sort_code,omitempty"`
	RollNumber *string `gorm:"column:roll_number;type:varchar(50)" json:"roll_number,omitempty"`

	// CARD IDENTIFIERS
	CardNumberMasked *string    `gorm:"column:card_number_masked;type:varchar(19)" json:"card_number_masked,omitempty"`
	CardNetwork      *string    `gorm:"column:card_network;type:varchar(50)" json:"card_network,omitempty"`
	CardHolderName   *string    `gorm:"column:card_holder_name;type:varchar(255)" json:"card_holder_name,omitempty"`
	IssueDate        *time.Time `gorm:"column:issue_date;type:date" json:"issue_date,omitempty"`
	ExpiryDate       *time.Time `gorm:"column:expiry_date;type:date" json:"expiry_date,omitempty"`

	// CREDIT CARD SPECIFIC FIELDS
	CreditLimit       *float64 `gorm:"column:credit_limit;type:numeric(19,4)" json:"credit_limit,omitempty"`
	AvailableLimit    *float64 `gorm:"column:available_limit;type:numeric(19,4)" json:"available_limit,omitempty"`
	MinimumDue        *float64 `gorm:"column:minimum_due;type:numeric(19,4)" json:"minimum_due,omitempty"`
	StatementDateDay  *int     `gorm:"column:statement_date_day;type:int" json:"statement_date_day,omitempty"`
	PaymentDueDateDay *int     `gorm:"column:payment_due_date_day;type:int" json:"payment_due_date_day,omitempty"`

	// FIXED DEPOSIT (FD) SPECIFIC FIELDS
	FDReceiptNumber      *string    `gorm:"column:fd_receipt_number;type:varchar(100)" json:"fd_receipt_number,omitempty"`
	PrincipalAmount      *float64   `gorm:"column:principal_amount;type:numeric(19,4)" json:"principal_amount,omitempty"`
	CompoundingFrequency *string    `gorm:"column:compounding_frequency;type:varchar(50)" json:"compounding_frequency,omitempty"`
	BookingDate          *time.Time `gorm:"column:booking_date;type:date" json:"booking_date,omitempty"`
	MaturityDate         *time.Time `gorm:"column:maturity_date;type:date" json:"maturity_date,omitempty"`
	MaturityAmount       *float64   `gorm:"column:maturity_amount;type:numeric(19,4)" json:"maturity_amount,omitempty"`
	IsCumulative         *bool      `gorm:"column:is_cumulative;type:boolean" json:"is_cumulative,omitempty"`

	// LOAN SPECIFIC FIELDS
	LoanType         *string    `gorm:"column:loan_type;type:varchar(50)" json:"loan_type,omitempty"`
	SanctionedAmount *float64   `gorm:"column:sanctioned_amount;type:numeric(19,4)" json:"sanctioned_amount,omitempty"`
	InterestType     *string    `gorm:"column:interest_type;type:varchar(20)" json:"interest_type,omitempty"`
	TenureMonths     *int       `gorm:"column:tenure_months;type:int" json:"tenure_months,omitempty"`
	EMIAmount        *float64   `gorm:"column:emi_amount;type:numeric(19,4)" json:"emi_amount,omitempty"`
	NextEMIDate      *time.Time `gorm:"column:next_emi_date;type:date" json:"next_emi_date,omitempty"`

	// OVERDRAFT & GENERIC INTEREST FIELDS
	OverdraftLimit       *float64   `gorm:"column:overdraft_limit;type:numeric(19,4)" json:"overdraft_limit,omitempty"`
	InterestRate         *float64   `gorm:"column:interest_rate;type:numeric(5,3)" json:"interest_rate,omitempty"`
	LinkedParentEntityID *uuid.UUID `gorm:"column:linked_parent_entity_id;type:uuid" json:"linked_parent_entity_id,omitempty"`
}

// TableName overrides GORM's default table naming convention
func (FinEntity) TableName() string {
	return "fin_entity"
}
