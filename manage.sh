#!/bin/bash

# manage.sh for twin-config

COMMAND=$1
COMPOSE_FILE="docker/docker-compose.yml"

case "$COMMAND" in
    start)
        echo "Starting twin-config..."
        docker compose -f $COMPOSE_FILE up -d
        ;;
    stop)
        echo "Stopping twin-config..."
        docker compose -f $COMPOSE_FILE down
        ;;
    status)
        echo "Status of twin-config:"
        docker compose -f $COMPOSE_FILE ps
        ;;
    delete)
        echo "Deleting twin-config containers and volumes..."
        docker compose -f $COMPOSE_FILE down -v
        ;;
    logs)
        echo "Showing logs for twin-config..."
        docker compose -f $COMPOSE_FILE logs -f
        ;;
    build)
        echo "Building twin-config image..."
        docker compose -f $COMPOSE_FILE build
        ;;
    *)
        echo "Usage: $0 {start|stop|status|delete|logs|build}"
        exit 1
esac
