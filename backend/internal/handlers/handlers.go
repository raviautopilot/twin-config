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

// GetSummary returns count aggregates across database structures.
func (h *Handler) GetSummary(c *gin.Context) {
	h.logger.Info("Received request for twin summary statistics")

	var contactCount int64
	var financialCount int64
	var metaCount int64
	var eventCount int64
	var auditCount int64

	// Main tables counts
	if err := h.db.Model(&models.Contact{}).Count(&contactCount).Error; err != nil {
		h.logger.Error("Failed to fetch contact count", zap.Error(err))
	}
	if err := h.db.Model(&models.FinancialEntity{}).Count(&financialCount).Error; err != nil {
		h.logger.Error("Failed to fetch financial count", zap.Error(err))
	}
	if err := h.db.Model(&models.MetaConfig{}).Count(&metaCount).Error; err != nil {
		h.logger.Error("Failed to fetch meta config count", zap.Error(err))
	}

	// Dynamic counts from pre-seeded schemas (if they exist)
	_ = h.db.Table("twin_event").Count(&eventCount)
	_ = h.db.Table("audit_log").Count(&auditCount)

	// Calculate total net balance across user assets/liabilities
	var totalBalance float64
	h.db.Model(&models.FinancialEntity{}).Select("COALESCE(SUM(balance), 0)").Row().Scan(&totalBalance)

	c.JSON(http.StatusOK, SummaryResponse{
		Status:    "healthy",
		Timestamp: time.Now(),
		Counts: map[string]int64{
			"contacts":           contactCount,
			"financial_entities": financialCount,
			"meta_configs":       metaCount,
			"events":             eventCount,
			"audit_logs":         auditCount,
		},
		Metrics: map[string]interface{}{
			"total_financial_balance": totalBalance,
			"last_updated":            time.Now().Format(time.RFC3339),
		},
	})
}

// GetContacts lists all contact cards.
func (h *Handler) GetContacts(c *gin.Context) {
	h.logger.Info("Received request to list contacts")
	var contacts []models.Contact
	if err := h.db.Order("name asc").Find(&contacts).Error; err != nil {
		h.logger.Error("Failed to find contacts in DB", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load contacts"})
		return
	}
	c.JSON(http.StatusOK, contacts)
}

// CreateContact writes a new contact node.
func (h *Handler) CreateContact(c *gin.Context) {
	h.logger.Info("Received request to create a contact")
	var contact models.Contact
	if err := c.ShouldBindJSON(&contact); err != nil {
		h.logger.Warn("Failed to bind contact JSON", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if contact.Name == "" || contact.Relationship == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name and relationship fields are mandatory"})
		return
	}

	if err := h.db.Create(&contact).Error; err != nil {
		h.logger.Error("Failed to insert contact", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create contact record"})
		return
	}

	h.logger.Info("Contact record established", zap.Uint("id", contact.ID))
	c.JSON(http.StatusCreated, contact)
}

// GetFinancials retrieves all banking credentials and accounts.
func (h *Handler) GetFinancials(c *gin.Context) {
	h.logger.Info("Received request to list financials")
	var financials []models.FinancialEntity
	if err := h.db.Order("bank_name asc").Find(&financials).Error; err != nil {
		h.logger.Error("Failed to find financials in DB", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load financial records"})
		return
	}
	c.JSON(http.StatusOK, financials)
}

// CreateFinancial appends a new bank account or asset type.
func (h *Handler) CreateFinancial(c *gin.Context) {
	h.logger.Info("Received request to create financial record")
	var financial models.FinancialEntity
	if err := c.ShouldBindJSON(&financial); err != nil {
		h.logger.Warn("Failed to bind financial JSON", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if financial.BankName == "" || financial.AccountType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bank_name and account_type fields are mandatory"})
		return
	}

	if err := h.db.Create(&financial).Error; err != nil {
		h.logger.Error("Failed to insert financial", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save financial entity"})
		return
	}

	h.logger.Info("Financial record created", zap.Uint("id", financial.ID))
	c.JSON(http.StatusCreated, financial)
}

// GetMetaConfigs lists all configurations.
func (h *Handler) GetMetaConfigs(c *gin.Context) {
	h.logger.Info("Received request to list meta configs")
	var configs []models.MetaConfig
	if err := h.db.Order("key asc").Find(&configs).Error; err != nil {
		h.logger.Error("Failed to fetch meta configs", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load meta configs"})
		return
	}
	c.JSON(http.StatusOK, configs)
}

// CreateMetaConfig saves a new meta configuration variable (or upserts).
func (h *Handler) CreateMetaConfig(c *gin.Context) {
	h.logger.Info("Received request to save/update meta config")
	var config models.MetaConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		h.logger.Warn("Failed to bind meta config JSON", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if config.Key == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "key is mandatory"})
		return
	}

	// Use Save for upsert capability
	if err := h.db.Save(&config).Error; err != nil {
		h.logger.Error("Failed to upsert meta config", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save meta config"})
		return
	}

	c.JSON(http.StatusOK, config)
}
