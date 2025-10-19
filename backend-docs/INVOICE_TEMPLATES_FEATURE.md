# Invoice Templates Feature

## Overview

The Invoice Templates feature enables administrators to create, customize, and manage multiple invoice layouts for the POS system. This feature provides flexibility for businesses to personalize their invoices while maintaining consistency across different outlets.

## Business Use Case

### Problem Statement
Different retailers may require different invoice formats based on their branding, legal requirements, or customer preferences. The system needs to support:

1. Multiple invoice layouts with different designs
2. Customization of header and footer content
3. Control over what information appears on invoices
4. Assignment of specific templates to specific outlets
5. A default template as fallback

### Solution
The Invoice Templates feature provides a comprehensive template management system that allows administrators to:

- Create and manage multiple invoice templates
- Fully customize each template's appearance and content
- Assign templates to specific outlets
- Enable or disable templates without deleting them
- Set one template as the default for all outlets

## Key Features

### 1. Template Customization

Each invoice template can be customized with:

- **Name**: Descriptive name for the template
- **Header Text**: Custom header content (multi-line support)
- **Footer Text**: Custom footer content (multi-line support)
- **Logo URL**: Link to company logo image
- **Show Company Info**: Toggle to show/hide company details
- **Show Tax Details**: Toggle to show/hide tax information
- **Paper Size**: Configure paper size (A4, Letter, etc.)
- **Active Status**: Enable/disable the template
- **Default Status**: Mark as default template

### 2. Template Management

#### Create Templates
Administrators can create unlimited invoice templates with different layouts and configurations.

#### Update Templates
Templates can be updated at any time to reflect branding changes or business requirements.

#### Delete Templates
Templates can be soft-deleted (marked as inactive) while preserving historical data. Default templates are protected from deletion.

#### View Templates
- View all templates
- Filter by active status
- Filter by outlet assignment
- Get the default template
- View template details including assigned outlets

### 3. Outlet Assignment

Templates can be assigned to specific outlets, allowing:

- Different outlets to use different invoice designs
- Same template to be used by multiple outlets
- Flexible assignment and removal of outlets
- View which outlets are using which templates

### 4. Default Template Management

The system automatically manages the default template:

- Only one template can be marked as default at a time
- Setting a new default automatically unsets the previous one
- Default templates cannot be deleted (protection)
- Provides fallback when outlet-specific templates aren't assigned

## API Endpoints

### Template CRUD Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/invoice-templates` | Create a new template |
| GET | `/api/admin/invoice-templates` | Get all templates (supports filtering) |
| GET | `/api/admin/invoice-templates/{id}` | Get template by ID |
| GET | `/api/admin/invoice-templates/default` | Get the default template |
| PUT | `/api/admin/invoice-templates/{id}` | Update a template |
| DELETE | `/api/admin/invoice-templates/{id}` | Soft delete a template |

### Outlet Assignment Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/invoice-templates/{id}/outlets/{outletId}` | Assign outlet to template |
| DELETE | `/api/admin/invoice-templates/{id}/outlets/{outletId}` | Remove outlet from template |
| GET | `/api/admin/invoice-templates/{id}/outlets` | Get assigned outlets |

### Query Parameters

- `?active=true` - Filter only active templates
- `?outletId={id}` - Get templates assigned to specific outlet

## Data Model

### InvoiceTemplate Entity

```java
{
  "id": Long,
  "name": String,
  "headerText": String,      // Multi-line text
  "footerText": String,      // Multi-line text
  "logoUrl": String,
  "showCompanyInfo": Boolean,
  "showTaxDetails": Boolean,
  "paperSize": String,       // "A4", "LETTER", etc.
  "isDefault": Boolean,
  "isActive": Boolean,
  "assignedOutlets": Set<Outlet>,
  "createdDate": OffsetDateTime,
  "modifiedDate": OffsetDateTime
}
```

## Usage Scenarios

### Scenario 1: Creating a Custom Template for Premium Stores

A business has premium stores that need branded invoices with logos and custom messages:

1. Admin creates a new template named "Premium Invoice"
2. Sets header with store branding
3. Adds footer with promotional message
4. Uploads logo URL
5. Assigns template to premium outlet locations
6. Activates the template

### Scenario 2: Different Templates for Different Regions

A business operates in multiple regions with different tax requirements:

1. Admin creates "Region A Template" with tax details shown
2. Admin creates "Region B Template" with tax details hidden
3. Each template is assigned to respective regional outlets
4. Outlets automatically use their assigned templates

### Scenario 3: Updating Company Branding

Company updates its branding across all stores:

1. Admin updates the default template with new logo
2. Updates header text with new company information
3. Changes are immediately reflected for all outlets using default template

### Scenario 4: Seasonal Promotions

Business wants to add seasonal messaging:

1. Admin clones existing template (via create with same settings)
2. Adds seasonal message to footer
3. Temporarily assigns to specific outlets
4. After promotion, switches back to standard template

## Business Rules

1. **Single Default**: Only one template can be marked as default
2. **Protected Deletion**: Default templates cannot be deleted
3. **Soft Delete**: Deleted templates are marked inactive, not removed
4. **Active Filter**: Inactive templates don't appear in active listings
5. **Outlet Assignment**: Templates can be assigned to multiple outlets
6. **Audit Trail**: All changes are tracked with timestamps and users

## Benefits

### For Administrators
- Easy template management through REST API
- No coding required for customization
- Full control over invoice appearance
- Ability to A/B test different layouts

### For Business Owners
- Brand consistency across outlets
- Flexibility for different outlet types
- Professional invoice appearance
- Quick updates without development

### For Customers
- Clear, branded invoices
- Consistent experience
- Professional appearance
- All necessary information displayed

## Integration with POS System

The Invoice Templates feature integrates seamlessly with the existing POS system:

1. **Outlet Integration**: Uses existing Outlet entities and relationships
2. **Tenant Support**: Works within multi-tenant architecture
3. **Audit System**: Leverages existing audit trail functionality
4. **API Consistency**: Follows established API patterns
5. **Error Handling**: Uses standard exception handling

## Frontend Integration Guide

### Suggested UI Components

1. **Template List View**
   - Table with template names, status, default flag
   - Filter controls for active/all templates
   - Actions: Edit, Delete, Set as Default

2. **Template Editor**
   - Form with all template fields
   - Preview section showing how invoice will look
   - Logo upload interface
   - Outlet assignment multi-select

3. **Template Selector (POS)**
   - Dropdown showing available templates for outlet
   - Default template pre-selected
   - Quick preview on hover

### Recommended Workflow

1. **Initial Setup**
   - Create default template
   - Configure basic information
   - Test with sample invoice

2. **Template Creation**
   - Use template creation form
   - Fill in customization fields
   - Save and activate

3. **Outlet Assignment**
   - Select template
   - Choose outlets from list
   - Assign and save

4. **Invoice Generation**
   - System fetches template for outlet
   - Falls back to default if none assigned
   - Applies template to invoice data
   - Generates formatted invoice

## Error Handling

The system provides clear error messages for:

- Template not found
- Attempt to delete default template
- Invalid template data
- Outlet not found for assignment
- Default template not configured

## Testing

Comprehensive test coverage includes:

- Template CRUD operations
- Default template management
- Outlet assignment/removal
- Soft delete functionality
- Error scenarios
- Edge cases

## Future Enhancements

Potential enhancements for future versions:

1. **Template Builder UI**: Visual drag-and-drop template editor
2. **Template Cloning**: Duplicate existing templates
3. **Template Categories**: Organize templates by type or purpose
4. **Template Versioning**: Track and rollback template changes
5. **Advanced Customization**: Custom CSS, dynamic fields, conditional content
6. **Template Preview**: Live preview of how invoice will look
7. **Template Sharing**: Share templates between tenants
8. **Template Library**: Pre-built template collection
9. **Multilingual Support**: Different languages for different templates
10. **Email Templates**: Extend to email invoice templates

## Related Documentation

- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [INVOICE_TEMPLATES_IMPLEMENTATION_SUMMARY.md](INVOICE_TEMPLATES_IMPLEMENTATION_SUMMARY.md) - Implementation details
- [README.md](README.md) - General system documentation

## Summary

The Invoice Templates feature provides a flexible, powerful way for businesses to customize their invoice appearance while maintaining consistency and professionalism. It follows established patterns in the codebase and integrates seamlessly with existing functionality, making it easy to use and maintain.
