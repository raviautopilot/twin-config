#!/bin/bash

# docker-setup.sh for twin-config full stack

COMMAND=$1
COMPOSE_FILE="docker/docker-compose.yml"

# You can pass an optional service name (db, backend, frontend)
SERVICE=$2

case "$COMMAND" in
    start)
        echo "Starting the full stack (db, backend, frontend)..."
        docker compose -f $COMPOSE_FILE up -d $SERVICE
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
