package models

import "time"

// CfgModule maps to cfg_modules table
type CfgModule struct {
	ModuleID   string    `gorm:"column:module_id;primaryKey" json:"module_id"`
	ModuleName string    `gorm:"column:module_name;not null;unique" json:"module_name"`
	Notes      string    `gorm:"column:notes" json:"notes"`
	CreatedAt  time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt  time.Time `gorm:"column:updated_at;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (CfgModule) TableName() string {
	return "cfg_modules"
}

// CfgType maps to cfg_type table
type CfgType struct {
	TypeID         uint        `gorm:"column:type_id;primaryKey;autoIncrement" json:"type_id"`
	ModuleID       string      `gorm:"column:module_id;not null" json:"module_id"`
	ConfigType     string      `gorm:"column:config_type;not null" json:"config_type"`
	MetadataSchema interface{} `gorm:"column:metadata_schema;type:jsonb;serializer:json" json:"metadata_schema"`
	Notes          string      `gorm:"column:notes" json:"notes"`
	CreatedAt      time.Time   `gorm:"column:created_at;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt      time.Time   `gorm:"column:updated_at;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (CfgType) TableName() string {
	return "cfg_type"
}

// CfgEventType maps to cfg_event_types table
type CfgEventType struct {
	EventTypeCode string `gorm:"column:event_type_code;primaryKey" json:"event_type_code"`
	ModuleCode    string `gorm:"column:module_code;not null" json:"module_code"`
	DisplayName   string `gorm:"column:display_name;not null" json:"display_name"`
}

func (CfgEventType) TableName() string {
	return "cfg_event_types"
}

// CfgDimension maps to cfg_dimensions table
type CfgDimension struct {
	DimensionCode string `gorm:"column:dimension_code;primaryKey" json:"dimension_code"`
	UnitCode      string `gorm:"column:unit_code;not null" json:"unit_code"`
	Description   string `gorm:"column:description;not null" json:"description"`
}

func (CfgDimension) TableName() string {
	return "cfg_dimensions"
}

// CfgAttributeKey maps to cfg_attribute_keys table
type CfgAttributeKey struct {
	EventTypeCode string `gorm:"column:event_type_code;primaryKey" json:"event_type_code"`
	AttributeKey  string `gorm:"column:attribute_key;primaryKey" json:"attribute_key"`
	IsRequired    int    `gorm:"column:is_required;default:0" json:"is_required"`
}

func (CfgAttributeKey) TableName() string {
	return "cfg_attribute_keys"
}
