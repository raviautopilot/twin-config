package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/raviautopilot/twin-config/backend/internal/config"
	"github.com/raviautopilot/twin-config/backend/internal/handlers"
	"github.com/raviautopilot/twin-config/backend/internal/models"
)

func main() {
	// Initialize Uber's Zap Logger in structured JSON configuration
	zapLogger, err := zap.NewProduction()
	if err != nil {
		panic(fmt.Sprintf("Failed to initialize Zap logger: %v", err))
	}
	defer zapLogger.Sync()

	zapLogger.Info("Launching Digital Twin config engine backend")

	// Load configuration parameters
	cfg := config.LoadConfig()

	// Initialize the GORM Zap Logger bridge
	gormZapLogger := &config.GormZapLogger{
		ZapLogger: zapLogger,
		LogLevel:  gormlogger.Info, // Log all SQL statements
	}

	// Connect to local PostgreSQL
	dsn := cfg.GetDSN()
	zapLogger.Info("Connecting to PostgreSQL database", zap.String("host", cfg.DBHost), zap.String("port", cfg.DBPort))
	
	var db *gorm.DB
	var dbErr error
	maxRetries := 15
	retryDelay := 2 * time.Second

	for i := 1; i <= maxRetries; i++ {
		zapLogger.Info(fmt.Sprintf("Attempting to connect to database (attempt %d/%d)...", i, maxRetries))
		db, dbErr = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: gormZapLogger,
		})
		if dbErr == nil {
			break
		}
		zapLogger.Warn("Failed to establish PostgreSQL connection, retrying in 2 seconds...", zap.Error(dbErr))
		time.Sleep(retryDelay)
	}

	if dbErr != nil {
		zapLogger.Fatal("Failed to establish PostgreSQL connection via GORM after retries", zap.Error(dbErr))
	}

	zapLogger.Info("PostgreSQL connection established successfully")

	// Execute database auto-migrations for the digital twin structures
	zapLogger.Info("Running model auto-migrations")
	err = db.AutoMigrate(
		&models.Contact{},
		&models.FinancialEntity{},
		&models.MetaConfig{},
	)
	if err != nil {
		zapLogger.Fatal("Model auto-migrations failed", zap.Error(err))
	}
	zapLogger.Info("Model auto-migrations finished successfully")

	// Seed some initial data if database is empty to make dashboard look rich immediately
	seedInitialDataIfEmpty(db, zapLogger)

	// Configure Gin Router
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()

	// Register structured request logger middleware
	router.Use(ZapRequestLogger(zapLogger))
	// Register global recovery middleware
	router.Use(gin.Recovery())
	// Register CORS middleware to allow requests from React dashboard (localhost)
	router.Use(CORSMiddleware())

	// Initialize handlers
	h := handlers.NewHandler(db, zapLogger)

	// API Routing structure
	v1 := router.Group("/api/v1")
	{
		twin := v1.Group("/twin")
		{
			twin.GET("/summary", h.GetSummary)
		}

		contacts := v1.Group("/contacts")
		{
			contacts.GET("", h.GetContacts)
			contacts.POST("", h.CreateContact)
		}

		financials := v1.Group("/financials")
		{
			financials.GET("", h.GetFinancials)
			financials.POST("", h.CreateFinancial)
		}

		meta := v1.Group("/meta")
		{
			meta.GET("", h.GetMetaConfigs)
			meta.POST("", h.CreateMetaConfig)
		}
	}

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP", "time": time.Now()})
	})

	serverAddr := ":" + cfg.AppPort
	zapLogger.Info("HTTP server running", zap.String("address", serverAddr))
	if err := router.Run(serverAddr); err != nil {
		zapLogger.Fatal("Failed to start HTTP server", zap.Error(err))
	}
}

// CORSMiddleware configures cross-origin resource sharing headers.
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// ZapRequestLogger returns a structured request logging middleware.
func ZapRequestLogger(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		logger.Info("HTTP Request",
			zap.Int("status", status),
			zap.String("method", c.Request.Method),
			zap.String("path", path),
			zap.String("query", query),
			zap.String("ip", c.ClientIP()),
			zap.Duration("latency", latency),
			zap.String("user-agent", c.Request.UserAgent()),
		)
	}
}

// seedInitialDataIfEmpty injects sample configurations if tables are clean
func seedInitialDataIfEmpty(db *gorm.DB, logger *zap.Logger) {
	var count int64
	db.Model(&models.Contact{}).Count(&count)
	if count == 0 {
		logger.Info("Seeding sample contact entities")
		contacts := []models.Contact{
			{
				Name:         "Sarah Jenkins",
				Relationship: "Professional (VP of Eng)",
				ContactDetails: models.ContactDetails{
					Email: "sarah.jenkins@techcorp.com",
					Phone: "+1 (555) 019-2834",
					Notes: "Met at SF Tech Conference. Interested in contract team scaling.",
				},
				Tags: []string{"professional", "tech-lead", "sf-network"},
			},
			{
				Name:         "David Chen",
				Relationship: "Friend",
				ContactDetails: models.ContactDetails{
					Email: "dchen@gmail.com",
					Phone: "+1 (555) 012-9845",
					Notes: "College roommate. Good contact for AI workflows.",
				},
				Tags: []string{"personal", "college", "advisor"},
			},
			{
				Name:         "Elizabeth Vance",
				Relationship: "Tenant",
				ContactDetails: models.ContactDetails{
					Email: "elizabeth.vance@vanceproperties.net",
					Phone: "+1 (555) 043-9871",
					Notes: "Tenant at unit 3B. Rental contract expires June 2027.",
				},
				Tags: []string{"real-estate", "billing-sync"},
			},
		}
		db.Create(&contacts)
	}

	db.Model(&models.FinancialEntity{}).Count(&count)
	if count == 0 {
		logger.Info("Seeding sample financial entities")
		financials := []models.FinancialEntity{
			{
				BankName:    "Chase checking",
				AccountType: "checking",
				Balance:     8450.75,
				AssociatedWorkflows: models.AssociatedWorkflows{
					Bills:     []string{"Adobe Creative Suite", "GitHub Copilot Subscription"},
					Schedules: []string{"Salary Deposit (Bi-weekly)", "Rent Transfer (Monthly)"},
					Metadata:  map[string]string{"routing_number": "121000248", "account_last_4": "5091"},
				},
			},
			{
				BankName:    "Fidelity Brokerage",
				AccountType: "investment",
				Balance:     42190.43,
				AssociatedWorkflows: models.AssociatedWorkflows{
					Bills:     []string{},
					Schedules: []string{"Auto-buy Index Fund (1st of Month)"},
					Metadata:  map[string]string{"account_last_4": "9928"},
				},
			},
			{
				BankName:    "Marcus by Goldman Sachs",
				AccountType: "savings",
				Balance:     15243.88,
				AssociatedWorkflows: models.AssociatedWorkflows{
					Bills:     []string{},
					Schedules: []string{"Emergency Fund Booster (Weekly)"},
					Metadata:  map[string]string{"apy": "4.4%", "account_last_4": "4281"},
				},
			},
		}
		db.Create(&financials)
	}

	db.Model(&models.MetaConfig{}).Count(&count)
	if count == 0 {
		logger.Info("Seeding sample configuration settings")
		configs := []models.MetaConfig{
			{
				Key:   "twin_owner_name",
				Value: "Alex Mercer",
			},
			{
				Key: "notification_settings",
				Value: map[string]interface{}{
					"enable_email": true,
					"enable_slack": false,
					"digest_time":  "20:00",
				},
			},
			{
				Key: "backup_schedules",
				Value: []string{
					"Daily incremental (02:00 UTC)",
					"Weekly full (Sunday 01:00 UTC)",
				},
			},
		}
		db.Create(&configs)
	}
}
