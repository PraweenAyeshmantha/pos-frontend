# Copilot Instructions

Use MCP_TOOL_INSTRUCTIONS.md for detailed instructions on how to use the MCP tool with configured API and database targets.

Invoke backend APIs and databases using the provided tools and use them much as possible to assist with development tasks.

All API calls need Authentication headers. Use the provided authentication tools to generate valid tokens.
Use below API to get authentication token:
curl -X POST http://localhost:8080/api/auth/login \
  -H "X-Tenant-ID: your-tenant-id" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin@123"
  }'

All ApI calls need to include the "X-Tenant-ID" header with the appropriate tenant ID. Use PaPos for local development.