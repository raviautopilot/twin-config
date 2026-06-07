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

	_ "github.com/raviautopilot/twin-config/backend/docs"
	"github.com/raviautopilot/twin-config/backend/internal/config"
	"github.com/raviautopilot/twin-config/backend/internal/handlers"
	"github.com/raviautopilot/twin-config/backend/internal/models"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title           Digital Twin Config Engine API
// @version         1.0
// @description     Configuration Management & Auditing Engine API for Personal Life Operating System (PLOS).
// @contact.name    PLOS Support
// @host            localhost:8080
// @BasePath        /api/v1
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
	zapLogger.Info("Connecting to PostgreSQL kaalam", zap.String("host", cfg.DBHost), zap.String("port", cfg.DBPort))

	var db *gorm.DB
	var dbErr error
	maxRetries := 15
	retryDelay := 2 * time.Second

	for i := 1; i <= maxRetries; i++ {
		zapLogger.Info(fmt.Sprintf("Attempting to connect to kaalam (attempt %d/%d)...", i, maxRetries))
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

	// Execute kaalam auto-migrations for the digital twin structures
	zapLogger.Info("Running model auto-migrations")
	err = db.AutoMigrate(
		&models.CfgModule{},
		&models.CfgType{},
		&models.CfgEventType{},
		&models.CfgDimension{},
		&models.CfgAttributeKey{},
		&models.TwinEvent{},
		&models.TwinImpact{},
		&models.EventDetail{},
		&models.AuditLog{},
	)
	if err != nil {
		zapLogger.Fatal("Model auto-migrations failed", zap.Error(err))
	}
	zapLogger.Info("Model auto-migrations finished successfully")

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
		v1.GET("/summary", h.GetSummary)

		// Config tables
		cfg := v1.Group("/cfg")
		{
			// cfg_modules
			cfg.GET("/modules", h.GetModules)
			cfg.POST("/modules", h.CreateModule)
			cfg.PUT("/modules/:id", h.UpdateModule)
			cfg.DELETE("/modules/:id", h.DeleteModule)

			// cfg_type
			cfg.GET("/types", h.GetTypes)
			cfg.POST("/types", h.CreateType)
			cfg.PUT("/types/:id", h.UpdateType)
			cfg.DELETE("/types/:id", h.DeleteType)

			// cfg_event_types
			cfg.GET("/event-types", h.GetEventTypes)
			cfg.POST("/event-types", h.CreateEventType)
			cfg.PUT("/event-types/:id", h.UpdateEventType)
			cfg.DELETE("/event-types/:id", h.DeleteEventType)

			// cfg_dimensions
			cfg.GET("/dimensions", h.GetDimensions)
			cfg.POST("/dimensions", h.CreateDimension)
			cfg.PUT("/dimensions/:id", h.UpdateDimension)
			cfg.DELETE("/dimensions/:id", h.DeleteDimension)

			// cfg_attribute_keys
			cfg.GET("/attribute-keys", h.GetAttributeKeys)
			cfg.POST("/attribute-keys", h.CreateAttributeKey)
			cfg.PUT("/attribute-keys/:code/:key", h.UpdateAttributeKey)
			cfg.DELETE("/attribute-keys/:code/:key", h.DeleteAttributeKey)
		}

		// Event tables
		twin := v1.Group("/twin")
		{
			// twin_event
			twin.GET("/events", h.GetEvents)
			twin.POST("/events", h.CreateEvent)
			twin.PUT("/events/:id", h.UpdateEvent)
			twin.DELETE("/events/:id", h.DeleteEvent)

			// twin_impact
			twin.GET("/impacts", h.GetImpacts)
			twin.POST("/impacts", h.CreateImpact)
			twin.PUT("/impacts/:id", h.UpdateImpact)
			twin.DELETE("/impacts/:id", h.DeleteImpact)

			// event_details
			twin.GET("/event-details", h.GetEventDetails)
			twin.POST("/event-details", h.CreateEventDetail)
			twin.PUT("/event-details/:id/:key", h.UpdateEventDetail)
			twin.DELETE("/event-details/:id/:key", h.DeleteEventDetail)
		}
	}

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP", "time": time.Now()})
	})

	// Swagger UI route
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

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
