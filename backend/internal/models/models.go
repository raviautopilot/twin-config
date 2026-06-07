package models

import (
	"time"
)

// ContactDetails represents metadata and alternative addresses/comms for a contact.
type ContactDetails struct {
	Email   string `json:"email,omitempty"`
	Phone   string `json:"phone,omitempty"`
	Address string `json:"address,omitempty"`
	Notes   string `json:"notes,omitempty"`
}

// Contact maps to the contacts table storing personal/professional networks.
type Contact struct {
	ID             uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Name           string         `gorm:"not null" json:"name"`
	Relationship   string         `gorm:"not null" json:"relationship"`
	ContactDetails ContactDetails `gorm:"type:jsonb;serializer:json" json:"contact_details"`
	Tags           []string       `gorm:"type:jsonb;serializer:json" json:"tags"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
}

// AssociatedWorkflows outlines any regular bills or automated execution steps for a financial account.
type AssociatedWorkflows struct {
	Bills     []string          `json:"bills,omitempty"`
	Schedules []string          `json:"schedules,omitempty"`
	Metadata  map[string]string `json:"metadata,omitempty"`
}

// FinancialEntity maps bank credentials, accounts, and liquid values.
type FinancialEntity struct {
	ID                  uint                `gorm:"primaryKey;autoIncrement" json:"id"`
	BankName            string              `gorm:"not null" json:"bank_name"`
	AccountType         string              `gorm:"not null" json:"account_type"` // e.g. checking, savings, investment, credit
	Balance             float64             `gorm:"type:numeric(15,2);default:0" json:"balance"`
	AssociatedWorkflows AssociatedWorkflows `gorm:"type:jsonb;serializer:json" json:"associated_workflows"`
	CreatedAt           time.Time           `json:"created_at"`
	UpdatedAt           time.Time           `json:"updated_at"`
}

// MetaConfig represents key-value pairings of metadata configured in the PLOS dashboard.
type MetaConfig struct {
	ID        uint        `gorm:"primaryKey;autoIncrement" json:"id"`
	Key       string      `gorm:"uniqueIndex;not null" json:"key"`
	Value     interface{} `gorm:"type:jsonb;serializer:json" json:"value"` // generic JSON storage
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
}

// TableName matches the specific name in the digital_twin database schema requested.
func (MetaConfig) TableName() string {
	return "meta_config"
}
