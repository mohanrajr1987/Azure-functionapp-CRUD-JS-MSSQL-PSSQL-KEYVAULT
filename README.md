# Azure Function App with MSSQL and Key Vault Integration

This project demonstrates a Node.js Azure Function App with MSSQL database integration using Sequelize ORM, Azure Key Vault for secure credential management, and Azure Application Insights for monitoring. It includes user authentication with JWT tokens, refresh token functionality, and automated database migrations.

## Prerequisites

- Node.js 20.x
- Azure Functions Core Tools v4
- Azure CLI
- Azure Subscription
- MSSQL Server instance
- Azure Key Vault instance

## Project Structure

```
/
├── src/
│   ├── config/
│   │   ├── config.js       # Configuration management
│   │   └── database.js     # Database configuration
│   ├── controllers/
│   │   └── userController.js # User operations controller
│   ├── functions/
│   │   ├── userFunction.js   # Azure Function entry point
│   │   └── function.json     # Azure Function configuration
│   ├── middleware/
│   │   └── auth.js          # Authentication middleware
│   ├── migrations/
│   │   └── 001_initial_schema.js # Database migrations
│   ├── models/
│   │   └── user.js         # User model definition
│   ├── services/
│   │   └── userService.js  # User business logic
│   └── utils/
│       ├── auth.js         # Authentication utilities
│       ├── logger.js       # Logging utilities
│       └── migration.js    # Migration utilities
├── .env                    # Environment variables
├── host.json              # Azure Functions host configuration
├── index.js              # Application entry point
├── local.settings.json   # Local Azure Functions settings
├── package.json          # Project dependencies
└── README.md            # Project documentation
```

## Setup Instructions

### 1. Clone and Install Dependencies
```bash
# Clone the repository
git clone <repository-url>
cd Azure-functionapp-CRUD-JS-MSSQL-KEYVAULT

# Install dependencies
npm install
```

### 2. Azure Services Setup

#### Azure Key Vault Setup
1. Create an Azure Key Vault instance in your Azure portal
2. Add the following secrets to your Key Vault:
   - `DB-SERVER`: Your MSSQL server hostname
   - `DB-NAME`: Your database name
   - `DB-USER`: Database username
   - `DB-PASSWORD`: Database password
   - `JWT-SECRET`: Secret key for JWT access tokens
   - `JWT-REFRESH-SECRET`: Secret key for JWT refresh tokens

#### Azure Application Insights Setup
1. Create an Application Insights resource in Azure Portal
2. Copy the instrumentation key for configuration

### 3. Database Configuration

The application supports both MSSQL and PostgreSQL. You can switch between them by updating the `DB_TYPE` environment variable.

#### MSSQL Configuration
```env
DB_TYPE=mssql
MSSQL_SERVER=your_server
MSSQL_DATABASE=your_database
MSSQL_USER=your_username
MSSQL_PASSWORD=your_password
```

#### PostgreSQL Configuration
```env
DB_TYPE=postgres
PG_HOST=localhost
PG_DATABASE=your_database
PG_USER=your_username
PG_PASSWORD=your_password
PG_PORT=5432
```

### 4. Configure Local Settings

Create or update `local.settings.json`:

> ⚠️ Note: Never commit this file to version control

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "AZURE_KEYVAULT_URL": "https://your-keyvault.vault.azure.net/",
    "WEBSITE_NODE_DEFAULT_VERSION": "~20"
  }
}
```

### 4. Database Initialization

1. Run database migrations:
```bash
node -e "require('./index').initializeApp()"
```

This will:
- Initialize database connection
- Create necessary tables
- Run pending migrations
- Set up logging

### 5. Azure CLI Login
```bash
# Login to Azure
az login

# Set your subscription
az account set --subscription <your-subscription-id>
```

### 5. Run the Application
```bash
# Start the function app locally
func start
```

## Development

### Database Selection

You can switch between MSSQL and PostgreSQL by:

1. Setting the database type in your environment:
```bash
# For MSSQL
export DB_TYPE=mssql

# For PostgreSQL
export DB_TYPE=postgres
```

2. Configuring the appropriate database connection settings in your `.env` file or Azure Key Vault

3. Installing the required dependencies:
```bash
# For MSSQL
npm install tedious

# For PostgreSQL
npm install pg pg-hstore
```

## API Endpoints

### Authentication Endpoints

1. **Register User**
```http
POST /api/users
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
}
```

2. **Login**
```http
POST /api/users/login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "password123"
}
```

3. **Refresh Token**
```http
POST /api/users/refresh
Cookie: refreshToken=<token>
```

4. **Logout**
```http
POST /api/users/logout
Authorization: Bearer <token>
```

### User Management Endpoints

1. **Get User**
```http
GET /api/users/{id}
Authorization: Bearer <token>
```

2. **Update User**
```http
PUT /api/users/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "Updated Name"
}
```

3. **Delete User**
```http
DELETE /api/users/{id}
Authorization: Bearer <token>
```

### Response Format

All API responses follow this format:

```json
{
    "status": 200,
    "body": {
        // Response data
    }
}
```

### Error Responses

```json
{
    "status": 400,
    "body": {
        "error": "Error message"
    }
}
```

## Code Organization

1. **Services Layer (`src/services/`)**:
   - Contains business logic
   - Handles data operations
   - Manages authentication

2. **Controllers Layer (`src/controllers/`)**:
   - Handles HTTP requests
   - Validates input
   - Formats responses

3. **Models Layer (`src/models/`)**:
   - Defines data structures
   - Manages database schema
   - Handles data validation

4. **Middleware (`src/middleware/`)**:
   - Authentication
   - Request logging
   - Error handling

5. **Utils (`src/utils/`)**:
   - Helper functions
   - Logging utilities
   - Database migrations

## Security Features

### Authentication
- JWT-based authentication
- Refresh token rotation
- Secure password hashing with bcrypt
- HTTP-only cookies for refresh tokens
- Token versioning for invalidation

### Data Protection
- Input validation and sanitization
- SQL injection prevention with Sequelize
- Sensitive data encryption
- Secure password storage

### Azure Key Vault Integration
- Secure credential management
- Automatic secret rotation
- Managed identity support
- Access policy management

## Deployment

### Azure Function App Deployment
```bash
# Login to Azure
az login

# Set your subscription
az account set --subscription <your-subscription-id>

# Create a resource group
az group create --name <resource-group-name> --location <location>

# Create a storage account
az storage account create \
  --name <storage-account-name> \
  --location <location> \
  --resource-group <resource-group-name> \
  --sku Standard_LRS

# Create the function app
az functionapp create \
  --name <app-name> \
  --storage-account <storage-account-name> \
  --consumption-plan-location <location> \
  --resource-group <resource-group-name> \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4

# Deploy the function app
func azure functionapp publish <app-name>
```

### Environment Configuration
1. Set up environment variables in Azure:
```bash
az functionapp config appsettings set \
  --name <app-name> \
  --resource-group <resource-group-name> \
  --settings "AZURE_KEYVAULT_URL=<keyvault-url>"
```

2. Configure Managed Identity:
```bash
# Enable system-assigned managed identity
az functionapp identity assign \
  --name <app-name> \
  --resource-group <resource-group-name>

# Get the principal ID
principalId=$(az functionapp identity show \
  --name <app-name> \
  --resource-group <resource-group-name> \
  --query principalId \
  --output tsv)

# Grant Key Vault access
az keyvault set-policy \
  --name <keyvault-name> \
  --object-id $principalId \
  --secret-permissions get list
```

## Monitoring and Logging

### Application Insights Integration

1. **Request Monitoring**:
- Authentication attempts
- API endpoint usage
- Response times
- Success/failure rates

2. **Performance Metrics**:
- Database operation durations
- API response times
- Authentication processing time
- Memory usage and CPU metrics

3. **Error Tracking**:
- Authentication failures
- API errors
- System exceptions
- Stack traces and error contexts

4. **Custom Metrics**:
- User registration rate
- Login success/failure ratio
- Token refresh patterns
- API usage patterns

### Logging Levels

1. **INFO**: Normal operation events
```javascript
logger.info('User logged in successfully', { userId: user.id });
```

2. **WARNING**: Unusual but recoverable events
```javascript
logger.warn('Multiple failed login attempts', { email, attempts });
```

3. **ERROR**: Application errors requiring attention
```javascript
logger.error('Database connection failed', { error });
```

4. **DEBUG**: Detailed debugging information
```javascript
logger.debug('Token validation details', { token, decoded });
```

## Troubleshooting

### 1. Database Connection Issues

#### Symptoms:
- Database connection timeouts
- Sequelize authentication errors
- Connection pool exhaustion

#### Solutions:
```bash
# Check database connectivity
az sql db show-connection-string \
  --server <server-name> \
  --database <database-name> \
  --client sqlcmd

# Verify firewall rules
az sql server firewall-rule list \
  --server <server-name> \
  --resource-group <resource-group-name>
```

### 2. Authentication Problems

#### Common Issues:
1. Token Validation Failures
   ```javascript
   // Check token configuration
   const jwtConfig = await configManager.getJwtConfig();
   console.log('JWT Config:', {
     expiresIn: jwtConfig.expiresIn,
     algorithm: jwtConfig.algorithm
   });
   ```

2. Refresh Token Issues
   ```javascript
   // Verify refresh token in database
   const user = await User.findOne({
     where: { refreshToken: token }
   });
   ```

### 3. Deployment Issues

#### Verify Configuration:
```bash
# Check function app settings
az functionapp config appsettings list \
  --name <app-name> \
  --resource-group <resource-group-name>

# Check function app status
az functionapp show \
  --name <app-name> \
  --resource-group <resource-group-name>
```

#### View Logs:
```bash
# Stream logs
az functionapp logs tail \
  --name <app-name> \
  --resource-group <resource-group-name>

# Download logs
az functionapp logs download \
  --name <app-name> \
  --resource-group <resource-group-name>
```

### 4. Performance Issues

#### Monitoring:
```bash
# Check function metrics
az monitor metrics list \
  --resource <function-app-resource-id> \
  --metric "Requests"

# Check CPU usage
az monitor metrics list \
  --resource <function-app-resource-id> \
  --metric "CPU"
```

#### Solutions:
1. Scale up function app if needed:
```bash
az functionapp plan update \
  --name <app-name> \
  --resource-group <resource-group-name> \
  --sku P1v2
```

2. Enable auto-scaling:
```bash
az functionapp plan update \
  --name <app-name> \
  --resource-group <resource-group-name> \
  --min-instances 1 \
  --max-burst 4
```

## Database Management

### Database Migrations

The application includes several npm scripts for managing database migrations:

1. **Run Pending Migrations**
```bash
npm run migrate
```

2. **Create New Migration**
```bash
# Replace <name> with your migration name, e.g., "add_user_table"
npm run migrate:create <name>
```

3. **Check Migration Status**
```bash
npm run migrate:status
```

4. **Undo Last Migration**
```bash
npm run migrate:undo
```

5. **Undo All Migrations**
```bash
npm run migrate:undo:all
```

#### Migration File Structure
```javascript
// src/migrations/YYYYMMDDHHMMSS_migration_name.js
module.exports = {
  up: async (sequelize) => {
    // Migration code here
    await sequelize.queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      // ... other fields
    });
  },

  down: async (sequelize) => {
    // Rollback code here
    await sequelize.queryInterface.dropTable('Users');
  }
};
```

#### Migration Best Practices

1. **Naming Conventions**
   - Use descriptive names (e.g., `add_user_table`, `update_user_fields`)
   - Include action and target in the name

2. **Reversibility**
   - Always implement both `up` and `down` methods
   - Test rollback functionality

3. **Data Preservation**
   - Be careful with destructive operations
   - Back up data before running migrations

4. **Testing**
   - Test migrations on development environment first
   - Verify data integrity after migration



2. **Migration Structure**:
```javascript
async function up(sequelize) {
    // Migration code
}

async function down(sequelize) {
    // Rollback code
}

module.exports = { up, down };
```

## API Documentation

### Authentication APIs

#### 1. User Sign Up
```bash
curl -X POST http://localhost:7071/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "message": "User created successfully",
  "accessToken": "eyJhbG...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### 2. User Login
```bash
curl -X POST http://localhost:7071/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbG...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### 3. Refresh Token
```bash
curl -X POST http://localhost:7071/api/auth/refresh \
  -H "Cookie: refreshToken=your-refresh-token"
```

**Response:**
```json
{
  "accessToken": "eyJhbG..."
}
```

### User Management APIs

#### 1. Get All Users
```bash
curl -X GET http://localhost:7071/api/UserFunction \
  -H "Authorization: Bearer your-access-token"
```

#### 2. Get User by ID
```bash
curl -X GET http://localhost:7071/api/UserFunction?id=1 \
  -H "Authorization: Bearer your-access-token"
```

#### 3. Update User
```bash
curl -X PUT http://localhost:7071/api/UserFunction?id=1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-access-token" \
  -d '{
    "name": "John Updated",
    "email": "john.updated@example.com"
  }'
```

#### 4. Delete User
```bash
curl -X DELETE http://localhost:7071/api/UserFunction?id=1 \
  -H "Authorization: Bearer your-access-token"
```

## Testing

### Prerequisites
1. Local SQL Server instance running
2. Azure Key Vault configured with all required secrets
3. Application Insights instrumentation key

### Running Tests
1. Start the function app:
```bash
func start
```

2. Test authentication flow:
```bash
# 1. Create a user
curl -X POST http://localhost:7071/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# 2. Login
curl -X POST http://localhost:7071/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 3. Use the returned token for authenticated requests
curl -X GET http://localhost:7071/api/UserFunction \
  -H "Authorization: Bearer your-access-token"
```

## Security Features

- Password encryption using bcrypt
- JWT access tokens (15 minutes expiry)
- HTTP-only secure cookies for refresh tokens (7 days expiry)
- Azure Key Vault integration for secure credential storage
- Email validation
- Protection against duplicate emails

## Deployment to Azure

1. Create an Azure Function App:
```bash
az functionapp create --name your-app-name \
  --storage-account your-storage-account \
  --consumption-plan-location your-region \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4
```

2. Configure application settings:
```bash
az functionapp config appsettings set --name your-app-name \
  --resource-group your-resource-group \
  --settings AZURE_KEYVAULT_URL="https://your-keyvault.vault.azure.net/"
```

3. Deploy the function app:
```bash
func azure functionapp publish your-app-name
```

## Error Handling

The API returns appropriate HTTP status codes:
- 200: Success
- 201: Resource created
- 400: Bad request
- 401: Unauthorized
- 404: Resource not found
- 500: Internal server error

## Development Notes

- The application uses Sequelize ORM for database operations
- JWT tokens are used for API authentication
- Refresh tokens are stored in HTTP-only cookies for security
- All sensitive information is stored in Azure Key Vault
- Database credentials are retrieved securely from Key Vault

## Monitoring and Troubleshooting

### Azure Application Insights

1. **View Logs**:
- Go to Azure Portal > Application Insights
- Navigate to:
  - "Transaction Search" for request logs
  - "Failures" for error analysis
  - "Performance" for response times
  - "Users" for session analysis

2. **Monitor Performance**:
- Check "Live Metrics" for real-time monitoring
- Review "Performance" tab for slow requests
- Analyze "Dependencies" for database operations

### Common Issues

1. **Database Connection**:
- Verify Key Vault secrets
- Check SQL Server firewall rules
- Confirm database user permissions

2. **Authentication**:
- Validate JWT token format
- Check refresh token cookies
- Verify Key Vault JWT secrets

3. **Azure Functions**:
- Check function logs:
  ```bash
  func logs
  ```
- Verify local.settings.json configuration
- Confirm Azure Function runtime version

## Troubleshooting

1. If you encounter CORS issues locally, update your `local.settings.json`:
```json
{
  "Host": {
    "CORS": "*"
  }
}
```

2. For database connection issues:
- Verify your Key Vault secrets are correctly set
- Ensure your IP is allowed in the SQL Server firewall rules
- Check if the database user has appropriate permissions

3. For authentication issues:
- Verify JWT tokens are properly included in request headers
- Check if refresh token cookie is present and valid
- Ensure Key Vault secrets for JWT are properly set

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
