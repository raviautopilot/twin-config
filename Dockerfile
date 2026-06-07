# Use a highly minimal, secure Alpine Linux baseline
FROM postgres:16-alpine

# Set an accessible operational directory inside the engine container
WORKDIR /app

# Copy the relational data schema and initialization instructions
COPY config.sql /docker-entrypoint-initdb.d/01_config.sql
COPY init_twin.sql /docker-entrypoint-initdb.d/02_init_twin.sql

# Set environment variables for Postgres
ENV POSTGRES_DB=digital_twin
ENV POSTGRES_USER=twin_user
ENV POSTGRES_PASSWORD=twin_pass

# Configure default terminal access path to open directly into your twin database
CMD ["postgres"]
