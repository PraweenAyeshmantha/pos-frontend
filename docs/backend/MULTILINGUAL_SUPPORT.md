# Multi-Language Support

This document describes the multi-language (internationalization/i18n) support implemented in the POS Backend application.

## Overview

The POS Backend now supports multiple languages for error messages, validation messages, and success messages. The system automatically detects the user's preferred language from the `Accept-Language` HTTP header and returns messages in the appropriate language.

## Supported Languages

Currently, the following languages are supported:

- **English (en)** - Default language
- **Spanish (es)** - Español
- **French (fr)** - Français

## How It Works

### 1. Configuration

The multi-language support is configured in `LocaleConfig.java`:

```java
@Configuration
public class LocaleConfig {
    @Bean
    public MessageSource messageSource() {
        ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();
        messageSource.setBasename("classpath:messages");
        messageSource.setDefaultEncoding("UTF-8");
        messageSource.setDefaultLocale(Locale.ENGLISH);
        messageSource.setCacheSeconds(3600);
        messageSource.setFallbackToSystemLocale(false);
        return messageSource;
    }

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver localeResolver = new AcceptHeaderLocaleResolver();
        localeResolver.setDefaultLocale(Locale.ENGLISH);
        return localeResolver;
    }
}
```

### 2. Message Files

Messages are stored in properties files in `src/main/resources/`:

- `messages.properties` - English (default)
- `messages_es.properties` - Spanish
- `messages_fr.properties` - French

### 3. Message Resolution

The `MessageService` is used throughout the application to resolve localized messages:

```java
@Service
public class MessageService {
    private final MessageSource messageSource;

    public String getMessage(String key, Object... args) {
        Locale locale = LocaleContextHolder.getLocale();
        return messageSource.getMessage(key, args, key, locale);
    }
}
```

## Using the API

### Setting the Language

To receive messages in a specific language, include the `Accept-Language` header in your HTTP request:

```bash
# Request in English
curl -H "Accept-Language: en" http://localhost:8080/posai/api/...

# Request in Spanish
curl -H "Accept-Language: es" http://localhost:8080/posai/api/...

# Request in French
curl -H "Accept-Language: fr" http://localhost:8080/posai/api/...
```

### Example Response

When an error occurs, the API will return the message in the requested language:

**English (Accept-Language: en)**
```json
{
  "messageKey": "error.not-found",
  "message": "We couldn't find what you're looking for. It may have been removed or doesn't exist.",
  "path": "/api/products/999",
  "timestamp": "2025-10-17T19:00:00Z"
}
```

**Spanish (Accept-Language: es)**
```json
{
  "messageKey": "error.not-found",
  "message": "No pudimos encontrar lo que está buscando. Es posible que se haya eliminado o no exista.",
  "path": "/api/products/999",
  "timestamp": "2025-10-17T19:00:00Z"
}
```

**French (Accept-Language: fr)**
```json
{
  "messageKey": "error.not-found",
  "message": "Nous n'avons pas pu trouver ce que vous cherchez. Il a peut-être été supprimé ou n'existe pas.",
  "path": "/api/products/999",
  "timestamp": "2025-10-17T19:00:00Z"
}
```

## Adding a New Language

To add support for a new language:

1. Create a new properties file in `src/main/resources/` with the format `messages_{language_code}.properties`
   - For example: `messages_de.properties` for German
   - Use ISO 639-1 language codes

2. Copy all message keys from `messages.properties` and translate the values

3. The language will be automatically available for use with the `Accept-Language` header

### Example: Adding German Support

Create `src/main/resources/messages_de.properties`:

```properties
# Generic Error Messages
error.generic=Bei der Verarbeitung Ihrer Anfrage ist ein unerwartetes Problem aufgetreten.
error.invalid-token=Ihre Sitzung ist abgelaufen oder das Token ist ungültig.
# ... (translate all other keys)
```

Then use it in requests:

```bash
curl -H "Accept-Language: de" http://localhost:8080/posai/api/...
```

## Message Keys

All message keys follow a consistent naming pattern:

- `error.*` - Error messages
- `success.*` - Success messages
- `error.{entity}.*` - Entity-specific error messages
- `success.{entity}.*` - Entity-specific success messages

### Common Message Keys

| Key | Description |
|-----|-------------|
| `error.generic` | Generic error message |
| `error.not-found` | Resource not found |
| `error.validation` | Validation error |
| `error.unauthorized` | Unauthorized access |
| `success.created` | Resource created successfully |
| `success.updated` | Resource updated successfully |
| `success.deleted` | Resource deleted successfully |

See `messages.properties` for the complete list of available message keys.

## Fallback Behavior

If a message is not found for the requested language:

1. The system tries to use the default language (English)
2. If the message is still not found, the message key itself is returned

This ensures that the application never fails due to missing translations.

## Best Practices

1. **Always use message keys**: Don't hardcode user-facing messages in the code. Use message keys with the `MessageService`.

2. **Include the message key in responses**: The API includes both the `messageKey` and the translated `message` in error responses. This allows frontend applications to implement their own translations if needed.

3. **Test with different languages**: When developing new features, test with multiple languages to ensure messages are properly internationalized.

4. **Keep translations consistent**: When adding new message keys, add translations for all supported languages at the same time.

5. **Use placeholders for dynamic content**: Use `{0}`, `{1}`, etc. for dynamic values in messages:
   ```properties
   error.outlet.not-found=Outlet with ID {0} was not found.
   ```

## Integration with Frontend

Frontend applications can:

1. Set the `Accept-Language` header based on user preference
2. Use the `messageKey` from error responses to implement client-side translations
3. Display the localized `message` directly from the API response

## Testing

Multi-language support is tested in `LocaleConfigTest.java`, which verifies:

- Messages are correctly loaded for each language
- Fallback to English works correctly
- Message parameters are properly substituted
- Configuration beans are properly instantiated

Run the tests with:

```bash
./mvnw test -Dtest=LocaleConfigTest
```

## Technical Details

- **Framework**: Spring Boot's built-in i18n support
- **Locale Resolution**: `AcceptHeaderLocaleResolver` (uses HTTP `Accept-Language` header)
- **Message Source**: `ReloadableResourceBundleMessageSource`
- **Default Encoding**: UTF-8
- **Cache Duration**: 1 hour (3600 seconds)
- **Fallback**: English (no system locale fallback)

## Future Enhancements

Potential improvements for the multi-language support:

1. Add more languages (German, Italian, Portuguese, Chinese, Japanese, etc.)
2. Implement database-backed translations for dynamic content
3. Add language preference storage per user/tenant
4. Implement translation management UI
5. Add support for regional variants (e.g., en-US vs en-GB, es-ES vs es-MX)
6. Add support for custom language switching via query parameter or custom header
