# Customer Menu APIs - Quick Start Guide

This guide helps you quickly understand and use the Customer Menu APIs.

## 📋 What's Included

This implementation provides everything needed for the Customer Menu functionality:

### 1. 🧪 **Tests** (29 tests, all passing)
- `src/test/java/com/pos/controller/CustomerControllerTest.java` - 13 controller tests
- `src/test/java/com/pos/service/CustomerServiceTest.java` - 16 service tests

### 2. 📖 **Documentation**
- `CUSTOMER_API_DOCUMENTATION.md` - Complete API reference with examples
- `CUSTOMER_MENU_IMPLEMENTATION_SUMMARY.md` - Implementation overview and verification

### 3. 🔧 **Test Script**
- `test-customer-api.sh` - Automated test script for all endpoints

## 🚀 Quick Start

### Run Tests
```bash
# Using Java 21
export JAVA_HOME=/usr/lib/jvm/temurin-21-jdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

# Run customer tests only
./mvnw test -Dtest=CustomerControllerTest,CustomerServiceTest

# Run all tests
./mvnw test
```

### Test the APIs Manually
```bash
# Make script executable (first time only)
chmod +x test-customer-api.sh

# Run the test script
./test-customer-api.sh
```

### Read the Documentation
```bash
# View API documentation
cat CUSTOMER_API_DOCUMENTATION.md

# View implementation summary
cat CUSTOMER_MENU_IMPLEMENTATION_SUMMARY.md
```

## 📱 API Endpoints

All endpoints are available at `/api/pos/customers` with the following operations:

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| Create | POST | `/api/pos/customers` | Add new customer |
| Update | PUT | `/api/pos/customers/{id}` | Update customer info |
| Delete | DELETE | `/api/pos/customers/{id}` | Soft delete customer |
| Get by ID | GET | `/api/pos/customers/{id}` | Get specific customer |
| Get All | GET | `/api/pos/customers` | Get all customers |
| Get Active | GET | `/api/pos/customers?active=true` | Get only active customers |
| Search | GET | `/api/pos/customers/search?term=` | Search by name/email/phone |

## 🔍 Example Usage

### Create a Customer
```bash
curl -X POST "http://localhost:8080/posai/api/pos/customers" \
  -H "X-Tenant-ID: PaPos" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "address": "123 Main St"
  }'
```

### Search Customers
```bash
# Search by name
curl "http://localhost:8080/posai/api/pos/customers/search?term=John" \
  -H "X-Tenant-ID: PaPos"

# Search by email
curl "http://localhost:8080/posai/api/pos/customers/search?term=john@example.com" \
  -H "X-Tenant-ID: PaPos"

# Search by phone
curl "http://localhost:8080/posai/api/pos/customers/search?term=1234" \
  -H "X-Tenant-ID: PaPos"
```

### Get Active Customers
```bash
curl "http://localhost:8080/posai/api/pos/customers?active=true" \
  -H "X-Tenant-ID: PaPos"
```

## ✨ Key Features

### 1. Multi-Field Search
The search endpoint searches across:
- Customer name (case-insensitive)
- Email address (case-insensitive)
- Phone number

### 2. Soft Delete
Delete operations set `isActive = false` instead of removing records:
- Historical data remains intact
- Customers can be reactivated
- Orders remain valid

### 3. Active Filtering
Use `?active=true` to get only active customers for the POS UI

### 4. Multi-Tenancy
All requests require `X-Tenant-ID` header for proper data isolation

## 📊 Test Coverage

```
CustomerControllerTest.java
├── testCreateCustomer_Success ✅
├── testUpdateCustomer_Success ✅
├── testGetCustomer_Success ✅
├── testGetCustomer_NotFound_ThrowsException ✅
├── testGetCustomers_AllCustomers ✅
├── testGetCustomers_ActiveCustomersOnly ✅
├── testGetCustomers_InactiveFilter_FalseParameter ✅
├── testSearchCustomers_ByName ✅
├── testSearchCustomers_ByEmail ✅
├── testSearchCustomers_ByPhone ✅
├── testSearchCustomers_NoResults ✅
├── testDeleteCustomer_Success ✅
└── testDeleteCustomer_NotFound_ThrowsException ✅

CustomerServiceTest.java
├── testCreateCustomer_Success ✅
├── testUpdateCustomer_Success ✅
├── testUpdateCustomer_NotFound_ThrowsException ✅
├── testGetCustomerById_Success ✅
├── testGetCustomerById_NotFound_ThrowsException ✅
├── testGetAllCustomers_Success ✅
├── testGetActiveCustomers_Success ✅
├── testSearchCustomers_ByName ✅
├── testSearchCustomers_ByEmail ✅
├── testSearchCustomers_ByPhone ✅
├── testSearchCustomers_NoResults ✅
├── testDeleteCustomer_Success ✅
├── testDeleteCustomer_NotFound_ThrowsException ✅
├── testUpdateLoyaltyPoints_Success ✅
├── testUpdateLoyaltyPoints_NegativePoints ✅
└── testUpdateLoyaltyPoints_CustomerNotFound_ThrowsException ✅

Total: 29 tests ✅
```

## 🔒 Security

✅ **CodeQL Security Scan:** PASSED  
✅ **No Vulnerabilities Detected**

## 🎯 Requirements Met

All requirements from the issue are fully implemented:

✅ Cashiers can **add** customers  
✅ Cashiers can **update** customers  
✅ Cashiers can **delete** customers  
✅ Cashiers can **search** customers by name, email, or phone  
✅ Cashiers can **select** a customer for orders  

## 📚 Additional Resources

- **Full API Documentation:** See `CUSTOMER_API_DOCUMENTATION.md`
- **Implementation Details:** See `CUSTOMER_MENU_IMPLEMENTATION_SUMMARY.md`
- **Test Script:** Run `./test-customer-api.sh`
- **Existing API Docs:** See `API_DOCUMENTATION.md` for other endpoints

## 🤝 Integration with Orders

Customer ID can be passed to order creation:
```json
POST /api/pos/orders
{
  "customerId": 1,
  "outletId": 1,
  "cashierId": 1,
  "orderType": "COUNTER",
  "items": [...],
  "payments": [...]
}
```

## 💡 Tips

1. **Always use `active=true`** for POS customer selection to avoid showing deleted customers
2. **Search is case-insensitive** and supports partial matching
3. **Delete is soft** - records are never physically deleted
4. **Multi-tenancy is enforced** - always include `X-Tenant-ID` header

## 🐛 Troubleshooting

### Tests failing with "Java 21 required"
```bash
export JAVA_HOME=/usr/lib/jvm/temurin-21-jdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
```

### API returns 404
- Check that the server is running
- Verify the base URL includes context path: `/posai/api/pos/customers`
- Ensure `X-Tenant-ID` header is present

### Search returns empty results
- Verify customer exists and is active
- Check search term matches name, email, or phone
- Remember search only returns active customers

## ✅ Verification Checklist

Before using in production:
- [ ] Run all tests: `./mvnw test -Dtest=CustomerControllerTest,CustomerServiceTest`
- [ ] Run test script: `./test-customer-api.sh`
- [ ] Verify security scan: CodeQL should show 0 vulnerabilities
- [ ] Test create customer endpoint
- [ ] Test search functionality
- [ ] Test customer selection in order flow
- [ ] Verify soft delete behavior

---

**Ready to use!** All Customer Menu APIs are fully implemented, tested, and documented.
