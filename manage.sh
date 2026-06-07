#!/bin/bash

# manage.sh for twin-config

COMMAND=$1

case "$COMMAND" in
    start)
        echo "Starting twin-config..."
        docker compose up -d
        ;;
    stop)
        echo "Stopping twin-config..."
        docker compose down
        ;;
    status)
        echo "Status of twin-config:"
        docker compose ps
        ;;
    delete)
        echo "Deleting twin-config containers and volumes..."
        docker compose down -v
        ;;
    logs)
        echo "Showing logs for twin-config..."
        docker compose logs -f
        ;;
    build)
        echo "Building twin-config image..."
        docker compose build
        ;;
    *)
        echo "Usage: $0 {start|stop|status|delete|logs|build}"
        exit 1
esac
