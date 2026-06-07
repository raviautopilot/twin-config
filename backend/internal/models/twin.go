package models

import "time"

// TwinEvent maps to twin_event table
type TwinEvent struct {
	EventID       string    `gorm:"column:event_id;primaryKey" json:"event_id"`
	EventTypeCode string    `gorm:"column:event_type_code;not null" json:"event_type_code"`
	OccurredAt    time.Time `gorm:"column:occurred_at;not null" json:"occurred_at"`
	CreatedAt     time.Time `gorm:"column:created_at;default:CURRENT_TIMESTAMP" json:"created_at"`
}

func (TwinEvent) TableName() string {
	return "twin_event"
}

// TwinImpact maps to twin_impact table
type TwinImpact struct {
	ImpactID      string  `gorm:"column:impact_id;primaryKey" json:"impact_id"`
	EventID       string  `gorm:"column:event_id;not null" json:"event_id"`
	DimensionCode string  `gorm:"column:dimension_code;not null" json:"dimension_code"`
	Value         float64 `gorm:"column:value;not null" json:"value"`
	TargetEntity  string  `gorm:"column:target_entity;not null" json:"target_entity"`
}

func (TwinImpact) TableName() string {
	return "twin_impact"
}
