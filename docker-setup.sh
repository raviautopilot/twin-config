#!/bin/bash

# docker-setup.sh for twin-config full stack

COMMAND=$1
COMPOSE_FILE="docker-compose.yml"

# You can pass an optional service name (db, backend, frontend)
SERVICE=$2

case "$COMMAND" in
    start)
        echo "Starting the full stack (db, backend, frontend)..."
        docker compose -f $COMPOSE_FILE up -d $SERVICE

        # Generate usage.md
        cat > usage.md <<- 'EOF'
# Application Usage Guide

This document provides details on how to access and use the deployed applications.

## Services

### Frontend

*   **URL**: [http://localhost:3000](http://localhost:3000)
*   **Description**: The main web interface for the application.

### Backend

*   **URL**: [http://localhost:8080](http://localhost:8080)
*   **Description**: The backend API server. You can use this for direct API calls or for debugging.

### Database (PostgreSQL)

*   **Host**: localhost
*   **Port**: 5432
*   **Username**: twin_user
*   **Password**: twin_pass
*   **Database Name**: digital_twin
*   **Description**: The PostgreSQL database. You can connect to it using any standard SQL client.

EOF
        echo "usage.md file generated with access details."
        ;;
    stop)
        echo "Stopping the full stack..."
        docker compose -f $COMPOSE_FILE down
        ;;
    status)
        echo "Status of all services:"
        docker compose -f $COMPOSE_FILE ps
        ;;
    delete)
        echo "Deleting all containers and volumes..."
        docker compose -f $COMPOSE_FILE down -v
        ;;
    logs)
        echo "Showing logs for all services. Use 'logs [service_name]' for specific logs."
        docker compose -f $COMPOSE_FILE logs -f $SERVICE
        ;;
    build)
        echo "Building all services..."
        docker compose -f $COMPOSE_FILE build $SERVICE
        ;;
    *)
        echo "Usage: $0 {start|stop|status|delete|logs|build} [service_name]"
        echo "Service names: db, backend, frontend"
        exit 1
esac
