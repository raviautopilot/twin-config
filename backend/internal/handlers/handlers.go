package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/raviautopilot/twin-config/backend/internal/models"
)

type Handler struct {
	db     *gorm.DB
	logger *zap.Logger
}

func NewHandler(db *gorm.DB, logger *zap.Logger) *Handler {
	return &Handler{db: db, logger: logger}
}

type SummaryResponse struct {
	Status    string                 `json:"status"`
	Timestamp time.Time              `json:"timestamp"`
	Counts    map[string]int64       `json:"counts"`
	Metrics   map[string]interface{} `json:"metrics"`
}

// GetSummary godoc
// @Summary      Get twin summary statistics
// @Description  Retrieve count aggregates across the 9 database tables
// @Tags         summary
// @Produce      json
// @Success      200  {object}  SummaryResponse
// @Router       /summary [get]
func (h *Handler) GetSummary(c *gin.Context) {
	h.logger.Info("Received request for twin summary statistics")

	var modulesCount int64
	var typesCount int64
	var eventTypesCount int64
	var dimensionsCount int64
	var attributeKeysCount int64
	var eventsCount int64
	var impactsCount int64
	var detailsCount int64
	var auditCount int64

	h.db.Model(&models.CfgModule{}).Count(&modulesCount)
	h.db.Model(&models.CfgType{}).Count(&typesCount)
	h.db.Model(&models.CfgEventType{}).Count(&eventTypesCount)
	h.db.Model(&models.CfgDimension{}).Count(&dimensionsCount)
	h.db.Model(&models.CfgAttributeKey{}).Count(&attributeKeysCount)
	h.db.Model(&models.TwinEvent{}).Count(&eventsCount)
	h.db.Model(&models.TwinImpact{}).Count(&impactsCount)
	h.db.Model(&models.EventDetail{}).Count(&detailsCount)
	h.db.Model(&models.AuditLog{}).Count(&auditCount)

	c.JSON(http.StatusOK, SummaryResponse{
		Status:    "healthy",
		Timestamp: time.Now(),
		Counts: map[string]int64{
			"cfg_modules":        modulesCount,
			"cfg_type":           typesCount,
			"cfg_event_types":    eventTypesCount,
			"cfg_dimensions":     dimensionsCount,
			"cfg_attribute_keys": attributeKeysCount,
			"twin_event":         eventsCount,
			"twin_impact":        impactsCount,
			"event_details":      detailsCount,
			"audit_log":          auditCount,
		},
		Metrics: map[string]interface{}{
			"last_updated": time.Now().Format(time.RFC3339),
		},
	})
}

// === cfg_modules CRUD ===

// GetModules godoc
// @Summary      List all modules
// @Description  Get a list of all PLOS configuration modules
// @Tags         modules
// @Produce      json
// @Success      200  {array}   models.CfgModule
// @Failure      500  {object}  map[string]string
// @Router       /cfg/modules [get]
func (h *Handler) GetModules(c *gin.Context) {
	var items []models.CfgModule
	if err := h.db.Order("module_id asc").Find(&items).Error; err != nil {
		h.logger.Error("Failed to fetch modules", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch modules"})
		return
	}
	c.JSON(http.StatusOK, items)
}

// CreateModule godoc
// @Summary      Create a new module
// @Description  Create a new configuration module
// @Tags         modules
// @Accept       json
// @Produce      json
// @Param        module  body      models.CfgModule  true  "Module details"
// @Success      201     {object}  models.CfgModule
// @Failure      400     {object}  map[string]string
// @Failure      500     {object}  map[string]string
// @Router       /cfg/modules [post]
func (h *Handler) CreateModule(c *gin.Context) {
	var item models.CfgModule
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if item.ModuleID == "" || item.ModuleName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "module_id and module_name are required"})
		return
	}
	if err := h.db.Create(&item).Error; err != nil {
		h.logger.Error("Failed to create module", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create module"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

// UpdateModule godoc
// @Summary      Update an existing module
// @Description  Update a configuration module by ID
// @Tags         modules
// @Accept       json
// @Produce      json
// @Param        id      path      string            true  "Module ID"
// @Param        module  body      models.CfgModule  true  "Module details"
// @Success      200     {object}  models.CfgModule
// @Failure      400     {object}  map[string]string
// @Failure      404     {object}  map[string]string
// @Failure      500     {object}  map[string]string
// @Router       /cfg/modules/{id} [put]
func (h *Handler) UpdateModule(c *gin.Context) {
	id := c.Param("id")
	var item models.CfgModule
	if err := h.db.First(&item, "module_id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Module not found"})
		return
	}
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item.ModuleID = id // Keep original ID
	if err := h.db.Save(&item).Error; err != nil {
		h.logger.Error("Failed to update module", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update module"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// DeleteModule godoc
// @Summary      Delete a module
// @Description  Delete a configuration module by ID
// @Tags         modules
// @Produce      json
// @Param        id      path      string  true  "Module ID"
// @Success      200     {object}  map[string]string
// @Failure      500     {object}  map[string]string
// @Router       /cfg/modules/{id} [delete]
func (h *Handler) DeleteModule(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&models.CfgModule{}, "module_id = ?", id).Error; err != nil {
		h.logger.Error("Failed to delete module", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete module"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Module deleted successfully"})
}

// === cfg_type CRUD ===

// GetTypes godoc
// @Summary      List all entity types
// @Description  Get a list of all entity templates
// @Tags         types
// @Produce      json
// @Success      200  {array}   models.CfgType
// @Failure      500  {object}  map[string]string
// @Router       /cfg/types [get]
func (h *Handler) GetTypes(c *gin.Context) {
	var items []models.CfgType
	if err := h.db.Order("type_id asc").Find(&items).Error; err != nil {
		h.logger.Error("Failed to fetch types", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch types"})
		return
	}
	c.JSON(http.StatusOK, items)
}

// CreateType godoc
// @Summary      Create a new entity type
// @Description  Create a new entity configuration template
// @Tags         types
// @Accept       json
// @Produce      json
// @Param        type  body      models.CfgType  true  "Type details"
// @Success      201   {object}  models.CfgType
// @Failure      400   {object}  map[string]string
// @Failure      500   {object}  map[string]string
// @Router       /cfg/types [post]
func (h *Handler) CreateType(c *gin.Context) {
	var item models.CfgType
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if item.ModuleID == "" || item.ConfigType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "module_id and config_type are required"})
		return
	}
	if err := h.db.Create(&item).Error; err != nil {
		h.logger.Error("Failed to create type", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create type"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

// UpdateType godoc
// @Summary      Update an existing entity type
// @Description  Update an entity template by ID
// @Tags         types
// @Accept       json
// @Produce      json
// @Param        id    path      string          true  "Type ID"
// @Param        type  body      models.CfgType  true  "Type details"
// @Success      200   {object}  models.CfgType
// @Failure      400   {object}  map[string]string
// @Failure      404   {object}  map[string]string
// @Failure      500   {object}  map[string]string
// @Router       /cfg/types/{id} [put]
func (h *Handler) UpdateType(c *gin.Context) {
	id := c.Param("id")
	var item models.CfgType
	if err := h.db.First(&item, "type_id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Type not found"})
		return
	}
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.db.Save(&item).Error; err != nil {
		h.logger.Error("Failed to update type", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update type"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// DeleteType godoc
// @Summary      Delete an entity type
// @Description  Delete an entity template by ID
// @Tags         types
// @Produce      json
// @Param        id  path      string  true  "Type ID"
// @Success      200 {object}  map[string]string
// @Failure      500 {object}  map[string]string
// @Router       /cfg/types/{id} [delete]
func (h *Handler) DeleteType(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&models.CfgType{}, "type_id = ?", id).Error; err != nil {
		h.logger.Error("Failed to delete type", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete type"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Type deleted successfully"})
}

// === cfg_event_types CRUD ===

// GetEventTypes godoc
// @Summary      List all event types
// @Description  Get a list of all PLOS event categories
// @Tags         event-types
// @Produce      json
// @Success      200  {array}   models.CfgEventType
// @Failure      500  {object}  map[string]string
// @Router       /cfg/event-types [get]
func (h *Handler) GetEventTypes(c *gin.Context) {
	var items []models.CfgEventType
	if err := h.db.Order("event_type_code asc").Find(&items).Error; err != nil {
		h.logger.Error("Failed to fetch event types", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch event types"})
		return
	}
	c.JSON(http.StatusOK, items)
}

// CreateEventType godoc
// @Summary      Create a new event type
// @Description  Create a new event classification category
// @Tags         event-types
// @Accept       json
// @Produce      json
// @Param        event_type  body      models.CfgEventType  true  "Event Type details"
// @Success      201         {object}  models.CfgEventType
// @Failure      400         {object}  map[string]string
// @Failure      500         {object}  map[string]string
// @Router       /cfg/event-types [post]
func (h *Handler) CreateEventType(c *gin.Context) {
	var item models.CfgEventType
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if item.EventTypeCode == "" || item.ModuleCode == "" || item.DisplayName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event_type_code, module_code, and display_name are required"})
		return
	}
	if err := h.db.Create(&item).Error; err != nil {
		h.logger.Error("Failed to create event type", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event type"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

// UpdateEventType godoc
// @Summary      Update an existing event type
// @Description  Update an event category by code
// @Tags         event-types
// @Accept       json
// @Produce      json
// @Param        id          path      string               true  "Event Type Code"
// @Param        event_type  body      models.CfgEventType  true  "Event Type details"
// @Success      200         {object}  models.CfgEventType
// @Failure      400         {object}  map[string]string
// @Failure      404         {object}  map[string]string
// @Failure      500         {object}  map[string]string
// @Router       /cfg/event-types/{id} [put]
func (h *Handler) UpdateEventType(c *gin.Context) {
	id := c.Param("id")
	var item models.CfgEventType
	if err := h.db.First(&item, "event_type_code = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event type not found"})
		return
	}
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item.EventTypeCode = id
	if err := h.db.Save(&item).Error; err != nil {
		h.logger.Error("Failed to update event type", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update event type"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// DeleteEventType godoc
// @Summary      Delete an event type
// @Description  Delete an event category by code
// @Tags         event-types
// @Produce      json
// @Param        id  path      string  true  "Event Type Code"
// @Success      200 {object}  map[string]string
// @Failure      500 {object}  map[string]string
// @Router       /cfg/event-types/{id} [delete]
func (h *Handler) DeleteEventType(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&models.CfgEventType{}, "event_type_code = ?", id).Error; err != nil {
		h.logger.Error("Failed to delete event type", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete event type"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Event type deleted successfully"})
}

// === cfg_dimensions CRUD ===

// GetDimensions godoc
// @Summary      List all dimensions
// @Description  Get a list of all PLOS unit dimensions
// @Tags         dimensions
// @Produce      json
// @Success      200  {array}   models.CfgDimension
// @Failure      500  {object}  map[string]string
// @Router       /cfg/dimensions [get]
func (h *Handler) GetDimensions(c *gin.Context) {
	var items []models.CfgDimension
	if err := h.db.Order("dimension_code asc").Find(&items).Error; err != nil {
		h.logger.Error("Failed to fetch dimensions", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch dimensions"})
		return
	}
	c.JSON(http.StatusOK, items)
}

// CreateDimension godoc
// @Summary      Create a new dimension
// @Description  Create a new measurement context dimension
// @Tags         dimensions
// @Accept       json
// @Produce      json
// @Param        dimension  body      models.CfgDimension  true  "Dimension details"
// @Success      201        {object}  models.CfgDimension
// @Failure      400        {object}  map[string]string
// @Failure      500        {object}  map[string]string
// @Router       /cfg/dimensions [post]
func (h *Handler) CreateDimension(c *gin.Context) {
	var item models.CfgDimension
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if item.DimensionCode == "" || item.UnitCode == "" || item.Description == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "dimension_code, unit_code, and description are required"})
		return
	}
	if err := h.db.Create(&item).Error; err != nil {
		h.logger.Error("Failed to create dimension", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create dimension"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

// UpdateDimension godoc
// @Summary      Update an existing dimension
// @Description  Update a measurement dimension by code
// @Tags         dimensions
// @Accept       json
// @Produce      json
// @Param        id         path      string               true  "Dimension Code"
// @Param        dimension  body      models.CfgDimension  true  "Dimension details"
// @Success      200        {object}  models.CfgDimension
// @Failure      400        {object}  map[string]string
// @Failure      404        {object}  map[string]string
// @Failure      500        {object}  map[string]string
// @Router       /cfg/dimensions/{id} [put]
func (h *Handler) UpdateDimension(c *gin.Context) {
	id := c.Param("id")
	var item models.CfgDimension
	if err := h.db.First(&item, "dimension_code = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dimension not found"})
		return
	}
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item.DimensionCode = id
	if err := h.db.Save(&item).Error; err != nil {
		h.logger.Error("Failed to update dimension", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update dimension"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// DeleteDimension godoc
// @Summary      Delete a dimension
// @Description  Delete a measurement dimension by code
// @Tags         dimensions
// @Produce      json
// @Param        id  path      string  true  "Dimension Code"
// @Success      200 {object}  map[string]string
// @Failure      500 {object}  map[string]string
// @Router       /cfg/dimensions/{id} [delete]
func (h *Handler) DeleteDimension(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&models.CfgDimension{}, "dimension_code = ?", id).Error; err != nil {
		h.logger.Error("Failed to delete dimension", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete dimension"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Dimension deleted successfully"})
}

// === cfg_attribute_keys CRUD ===

// GetAttributeKeys godoc
// @Summary      List all attribute keys
// @Description  Get a list of all PLOS event property validation keys
// @Tags         attribute-keys
// @Produce      json
// @Success      200  {array}   models.CfgAttributeKey
// @Failure      500  {object}  map[string]string
// @Router       /cfg/attribute-keys [get]
func (h *Handler) GetAttributeKeys(c *gin.Context) {
	var items []models.CfgAttributeKey
	if err := h.db.Order("event_type_code asc, attribute_key asc").Find(&items).Error; err != nil {
		h.logger.Error("Failed to fetch attribute keys", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attribute keys"})
		return
	}
	c.JSON(http.StatusOK, items)
}

// CreateAttributeKey godoc
// @Summary      Create a new attribute key
// @Description  Create a new validation property key for event types
// @Tags         attribute-keys
// @Accept       json
// @Produce      json
// @Param        attribute_key  body      models.CfgAttributeKey  true  "Attribute Key details"
// @Success      201            {object}  models.CfgAttributeKey
// @Failure      400            {object}  map[string]string
// @Failure      500            {object}  map[string]string
// @Router       /cfg/attribute-keys [post]
func (h *Handler) CreateAttributeKey(c *gin.Context) {
	var item models.CfgAttributeKey
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if item.EventTypeCode == "" || item.AttributeKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event_type_code and attribute_key are required"})
		return
	}
	if err := h.db.Create(&item).Error; err != nil {
		h.logger.Error("Failed to create attribute key", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create attribute key"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

// UpdateAttributeKey godoc
// @Summary      Update an existing attribute key
// @Description  Update a validation key by event code and key name
// @Tags         attribute-keys
// @Accept       json
// @Produce      json
// @Param        code           path      string                  true  "Event Type Code"
// @Param        key            path      string                  true  "Attribute Key"
// @Param        attribute_key  body      models.CfgAttributeKey  true  "Attribute Key details"
// @Success      200            {object}  models.CfgAttributeKey
// @Failure      400            {object}  map[string]string
// @Failure      404            {object}  map[string]string
// @Failure      500            {object}  map[string]string
// @Router       /cfg/attribute-keys/{code}/{key} [put]
func (h *Handler) UpdateAttributeKey(c *gin.Context) {
	code := c.Param("code")
	key := c.Param("key")
	var item models.CfgAttributeKey
	if err := h.db.First(&item, "event_type_code = ? AND attribute_key = ?", code, key).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Attribute key not found"})
		return
	}
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item.EventTypeCode = code
	item.AttributeKey = key
	if err := h.db.Save(&item).Error; err != nil {
		h.logger.Error("Failed to update attribute key", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update attribute key"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// DeleteAttributeKey godoc
// @Summary      Delete an attribute key
// @Description  Delete a validation key by event code and key name
// @Tags         attribute-keys
// @Produce      json
// @Param        code  path      string  true  "Event Type Code"
// @Param        key   path      string  true  "Attribute Key"
// @Success      200   {object}  map[string]string
// @Failure      500   {object}  map[string]string
// @Router       /cfg/attribute-keys/{code}/{key} [delete]
func (h *Handler) DeleteAttributeKey(c *gin.Context) {
	code := c.Param("code")
	key := c.Param("key")
	if err := h.db.Delete(&models.CfgAttributeKey{}, "event_type_code = ? AND attribute_key = ?", code, key).Error; err != nil {
		h.logger.Error("Failed to delete attribute key", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete attribute key"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Attribute key deleted successfully"})
}

// === twin_event CRUD ===

// GetEvents godoc
// @Summary      List all events
// @Description  Get a list of all logged twin events
// @Tags         events
// @Produce      json
// @Success      200  {array}   models.TwinEvent
// @Failure      500  {object}  map[string]string
// @Router       /twin/events [get]
func (h *Handler) GetEvents(c *gin.Context) {
	var items []models.TwinEvent
	if err := h.db.Order("occurred_at desc").Find(&items).Error; err != nil {
		h.logger.Error("Failed to fetch events", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch events"})
		return
	}
	c.JSON(http.StatusOK, items)
}

// CreateEvent godoc
// @Summary      Create a new event
// @Description  Log a new twin event entry in the ledger
// @Tags         events
// @Accept       json
// @Produce      json
// @Param        event  body      models.TwinEvent  true  "Event details"
// @Success      201    {object}  models.TwinEvent
// @Failure      400    {object}  map[string]string
// @Failure      500    {object}  map[string]string
// @Router       /twin/events [post]
func (h *Handler) CreateEvent(c *gin.Context) {
	var item models.TwinEvent
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if item.EventID == "" || item.EventTypeCode == "" || item.OccurredAt.IsZero() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event_id, event_type_code, and occurred_at are required"})
		return
	}
	if err := h.db.Create(&item).Error; err != nil {
		h.logger.Error("Failed to create event", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

// UpdateEvent godoc
// @Summary      Update an existing event
// @Description  Update a ledger event by ID
// @Tags         events
// @Accept       json
// @Produce      json
// @Param        id     path      string            true  "Event ID"
// @Param        event  body      models.TwinEvent  true  "Event details"
// @Success      200    {object}  models.TwinEvent
// @Failure      400    {object}  map[string]string
// @Failure      404    {object}  map[string]string
// @Failure      500    {object}  map[string]string
// @Router       /twin/events/{id} [put]
func (h *Handler) UpdateEvent(c *gin.Context) {
	id := c.Param("id")
	var item models.TwinEvent
	if err := h.db.First(&item, "event_id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item.EventID = id
	if err := h.db.Save(&item).Error; err != nil {
		h.logger.Error("Failed to update event", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update event"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// DeleteEvent godoc
// @Summary      Delete an event
// @Description  Delete a ledger event by ID (cascade impacts and details)
// @Tags         events
// @Produce      json
// @Param        id  path      string  true  "Event ID"
// @Success      200 {object}  map[string]string
// @Failure      500 {object}  map[string]string
// @Router       /twin/events/{id} [delete]
func (h *Handler) DeleteEvent(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&models.TwinEvent{}, "event_id = ?", id).Error; err != nil {
		h.logger.Error("Failed to delete event", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete event"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Event deleted successfully"})
}

// === twin_impact CRUD ===

// GetImpacts godoc
// @Summary      List all impacts
// @Description  Get a list of all logged twin impacts
// @Tags         impacts
// @Produce      json
// @Success      200  {array}   models.TwinImpact
// @Failure      500  {object}  map[string]string
// @Router       /twin/impacts [get]
func (h *Handler) GetImpacts(c *gin.Context) {
	var items []models.TwinImpact
	if err := h.db.Order("impact_id asc").Find(&items).Error; err != nil {
		h.logger.Error("Failed to fetch impacts", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch impacts"})
		return
	}
	c.JSON(http.StatusOK, items)
}

// CreateImpact godoc
// @Summary      Create a new impact
// @Description  Create a new ledger impact adjustment
// @Tags         impacts
// @Accept       json
// @Produce      json
// @Param        impact  body      models.TwinImpact  true  "Impact details"
// @Success      201     {object}  models.TwinImpact
// @Failure      400     {object}  map[string]string
// @Failure      500     {object}  map[string]string
// @Router       /twin/impacts [post]
func (h *Handler) CreateImpact(c *gin.Context) {
	var item models.TwinImpact
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if item.ImpactID == "" || item.EventID == "" || item.DimensionCode == "" || item.TargetEntity == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "impact_id, event_id, dimension_code, and target_entity are required"})
		return
	}
	if err := h.db.Create(&item).Error; err != nil {
		h.logger.Error("Failed to create impact", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create impact"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

// UpdateImpact godoc
// @Summary      Update an existing impact
// @Description  Update a ledger impact by ID
// @Tags         impacts
// @Accept       json
// @Produce      json
// @Param        id      path      string             true  "Impact ID"
// @Param        impact  body      models.TwinImpact  true  "Impact details"
// @Success      200     {object}  models.TwinImpact
// @Failure      400     {object}  map[string]string
// @Failure      404     {object}  map[string]string
// @Failure      500     {object}  map[string]string
// @Router       /twin/impacts/{id} [put]
func (h *Handler) UpdateImpact(c *gin.Context) {
	id := c.Param("id")
	var item models.TwinImpact
	if err := h.db.First(&item, "impact_id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Impact not found"})
		return
	}
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item.ImpactID = id
	if err := h.db.Save(&item).Error; err != nil {
		h.logger.Error("Failed to update impact", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update impact"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// DeleteImpact godoc
// @Summary      Delete an impact
// @Description  Delete a ledger impact by ID
// @Tags         impacts
// @Produce      json
// @Param        id  path      string  true  "Impact ID"
// @Success      200 {object}  map[string]string
// @Failure      500 {object}  map[string]string
// @Router       /twin/impacts/{id} [delete]
func (h *Handler) DeleteImpact(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&models.TwinImpact{}, "impact_id = ?", id).Error; err != nil {
		h.logger.Error("Failed to delete impact", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete impact"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Impact deleted successfully"})
}

// === event_details CRUD ===

// GetEventDetails godoc
// @Summary      List all event details
// @Description  Get a list of all logged event metadata attributes
// @Tags         event-details
// @Produce      json
// @Success      200  {array}   models.EventDetail
// @Failure      500  {object}  map[string]string
// @Router       /twin/event-details [get]
func (h *Handler) GetEventDetails(c *gin.Context) {
	var items []models.EventDetail
	if err := h.db.Order("event_id asc, attribute_key asc").Find(&items).Error; err != nil {
		h.logger.Error("Failed to fetch event details", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch event details"})
		return
	}
	c.JSON(http.StatusOK, items)
}

// CreateEventDetail godoc
// @Summary      Create a new event detail
// @Description  Add metadata property attributes to a logged event
// @Tags         event-details
// @Accept       json
// @Produce      json
// @Param        detail  body      models.EventDetail  true  "Event Detail details"
// @Success      201     {object}  models.EventDetail
// @Failure      400     {object}  map[string]string
// @Failure      500     {object}  map[string]string
// @Router       /twin/event-details [post]
func (h *Handler) CreateEventDetail(c *gin.Context) {
	var item models.EventDetail
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if item.EventID == "" || item.AttributeKey == "" || item.AttributeVal == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event_id, attribute_key, and attribute_val are required"})
		return
	}
	if err := h.db.Create(&item).Error; err != nil {
		h.logger.Error("Failed to create event detail", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event detail"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

// UpdateEventDetail godoc
// @Summary      Update an existing event detail
// @Description  Update event metadata by event ID and attribute key name
// @Tags         event-details
// @Accept       json
// @Produce      json
// @Param        id      path      string              true  "Event ID"
// @Param        key     path      string              true  "Attribute Key"
// @Param        detail  body      models.EventDetail  true  "Event Detail details"
// @Success      200     {object}  models.EventDetail
// @Failure      400     {object}  map[string]string
// @Failure      404     {object}  map[string]string
// @Failure      500     {object}  map[string]string
// @Router       /twin/event-details/{id}/{key} [put]
func (h *Handler) UpdateEventDetail(c *gin.Context) {
	id := c.Param("id")
	key := c.Param("key")
	var item models.EventDetail
	if err := h.db.First(&item, "event_id = ? AND attribute_key = ?", id, key).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event detail not found"})
		return
	}
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item.EventID = id
	item.AttributeKey = key
	if err := h.db.Save(&item).Error; err != nil {
		h.logger.Error("Failed to update event detail", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update event detail"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// DeleteEventDetail godoc
// @Summary      Delete an event detail
// @Description  Delete event metadata by event ID and attribute key name
// @Tags         event-details
// @Produce      json
// @Param        id   path      string  true  "Event ID"
// @Param        key  path      string  true  "Attribute Key"
// @Success      200  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /twin/event-details/{id}/{key} [delete]
func (h *Handler) DeleteEventDetail(c *gin.Context) {
	id := c.Param("id")
	key := c.Param("key")
	if err := h.db.Delete(&models.EventDetail{}, "event_id = ? AND attribute_key = ?", id, key).Error; err != nil {
		h.logger.Error("Failed to delete event detail", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete event detail"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Event detail deleted successfully"})
}
