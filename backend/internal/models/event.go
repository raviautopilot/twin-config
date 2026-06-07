package models

// EventDetail maps to event_details table
type EventDetail struct {
	EventID      string `gorm:"column:event_id;primaryKey" json:"event_id"`
	AttributeKey string `gorm:"column:attribute_key;primaryKey" json:"attribute_key"`
	AttributeVal string `gorm:"column:attribute_val;not null" json:"attribute_val"`
}

func (EventDetail) TableName() string {
	return "event_details"
}
