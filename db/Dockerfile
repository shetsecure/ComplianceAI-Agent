FROM mysql:8.0

# Set environment variables
ENV MYSQL_ROOT_PASSWORD=root
ENV MYSQL_DATABASE=complianceai

# Copy initialization scripts
COPY init.sql /docker-entrypoint-initdb.d/

# Set permissions
RUN chown -R mysql:mysql /docker-entrypoint-initdb.d/ 