package models

import "time"

// AuditLog maps to audit_log table
type AuditLog struct {
	AuditID   int64       `gorm:"column:audit_id;primaryKey;autoIncrement" json:"audit_id"`
	Table     string      `gorm:"column:table_name;not null" json:"table_name"`
	Operation string      `gorm:"column:operation;not null" json:"operation"`
	RowID     string      `gorm:"column:row_id;not null" json:"row_id"`
	OldData   interface{} `gorm:"column:old_data;type:jsonb;serializer:json" json:"old_data"`
	NewData   interface{} `gorm:"column:new_data;type:jsonb;serializer:json" json:"new_data"`
	ChangedBy string      `gorm:"column:changed_by;default:'PLOS_SYSTEM'" json:"changed_by"`
	ChangedAt time.Time   `gorm:"column:changed_at;default:CURRENT_TIMESTAMP" json:"changed_at"`
}

func (AuditLog) TableName() string {
	return "audit_log"
}
