# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod download

# Copy the source code
COPY . .

# Build the Go app
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/brahma-app ./cmd/main.go

# Final stage
FROM alpine:latest

WORKDIR /root/

# Copy the pre-built binary file from the previous stage
COPY --from=builder /app/brahma-app .

# Expose port (adjust as necessary)
EXPOSE 8080

# Command to run the executable
CMD ["./brahma-app"]
