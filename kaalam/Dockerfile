# Use a highly minimal, secure Alpine Linux baseline
FROM postgres:16-alpine

# Set an accessible operational directory inside the engine container
WORKDIR /app

# Copy the relational data schema and initialization instructions
COPY sql/001_config.sql /docker-entrypoint-initdb.d/001_config.sql
COPY sql/002_entity.sql /docker-entrypoint-initdb.d/002_entity.sql
COPY sql/init_twin.sql /docker-entrypoint-initdb.d/init_twin.sql

# Set environment variables for Postgres
ENV POSTGRES_DB=digital_twin
ENV POSTGRES_USER=twin_user
ENV POSTGRES_PASSWORD=twin_pass

# Configure default terminal access path to open directly into your twin kaalam
CMD ["postgres"]
