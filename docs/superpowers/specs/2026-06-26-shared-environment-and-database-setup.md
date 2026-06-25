# Design Specification: Shared Development Environment and Database Setup

This document specifies the technical design and environment configuration rules for AutoWash Pro team development. It defines the shared MS SQL Server database setup via Docker Compose and the fallback manual installation instructions.

---

## 1. Development Environment Defaults & Database Configuration

To ensure all 6 developers in the team work with the exact same runtime environment and database settings, the project enforces unified defaults.

### 1.1. Backend Runtime Defaults
*   **Programming Language**: Java
*   **Java SDK Version**: `17` (Default LTS version)
*   **Build Tool**: Maven (uses `pom.xml`)

### 1.2. Core Database Configuration Details
*   **Database Engine**: Microsoft SQL Server 2022
*   **Port**: `1433` (Standard SQL Server Port)
*   **Default Username**: `sa`
*   **Default Password**: `123456`
*   **Target Database Name**: `autowash_pro`


### 1.2. Spring Boot Connection Properties (`application.properties`)
All local Spring Boot application configurations must use the following property values:

```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=autowash_pro;encrypt=true;trustServerCertificate=true;createDatabaseIfNotExist=true
spring.datasource.username=sa
spring.datasource.password=123456
spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

---

## 2. Docker Compose Configuration (Option A - Recommended)

For developers with Docker installed, a lightweight, isolated SQL Server instance is managed using Docker Compose.

### 2.1. Docker Compose Schema (`docker-compose.yml`)
The `docker-compose.yml` file is placed in the project root directory:

```yaml
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-CU14-ubuntu-22.04
    container_name: autowash-sqlserver
    ports:
      - "127.0.0.1:1433:1433"
    environment:
      - ACCEPT_EULA=Y
      - MSSQL_SA_PASSWORD=123456
      - MSSQL_PID=Developer
    volumes:
      - mssql-data:/var/opt/mssql
    restart: always

volumes:
  mssql-data:
    driver: local
```

### 2.2. Volume Persistence
*   Data is persisted inside a named volume `mssql-data` mapped to `/var/opt/mssql`. This prevents database deletion when the container stops or is removed.

---

## 3. Manual Installation (Option B - Fallback)

For developers without Docker, SQL Server must be installed natively on Windows.

### 3.1. Installation Requirements
*   **SQL Server Edition**: Developer or Express Edition (2019 or newer).
*   **SQL Server Management Studio (SSMS)**: For database administration and verification.

### 3.2. Configuration Steps
1.  **Authentication Mode**:
    *   During installation, select **Mixed Mode (SQL Server authentication and Windows authentication)**.
    *   Set password for the **`sa`** login to **`123456`**.
2.  **TCP/IP Protocol Configuration**:
    *   Open **SQL Server Configuration Manager**.
    *   Navigate to **SQL Server Network Configuration** -> **Protocols for MSSQLSERVER** (or SQLEXPRESS).
    *   Right-click **TCP/IP** and select **Enable**.
    *   Double-click **TCP/IP**, select the **IP Addresses** tab, scroll to **IPAll**, and set **TCP Port** to `1433`.
3.  **Service Restart**:
    *   Go to **SQL Server Services** in the Configuration Manager.
    *   Right-click **SQL Server** and click **Restart**.

---

## 4. Agent Interactive Setup Flow

Agents interacting with team members for workspace setups must execute the following protocol:

1.  **Identity Verification**: Ask the developer's name (once per project clone).
2.  **Database Environment Questionnaire**:
    *   Agent asks: *"Bạn có muốn sử dụng Docker để chạy Database SQL Server không? (Có / Không)"*
    *   If **Có**: Guide the developer through installing Docker Desktop and executing `docker compose up -d`.
    *   If **Không**: Provide instructions to install SQL Server Express/Developer natively with `sa`/`123456` credentials, enabling TCP/IP on port `1433`.
