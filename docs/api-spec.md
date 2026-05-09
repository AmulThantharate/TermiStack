# 📡 TermiStack API Specification

## Base URL
`http://localhost:8080`

---

## 1. Health Check
Checks if the API service is alive.

- **URL**: `/health`
- **Method**: `GET`
- **Response (200 OK)**:
  ```json
  { "status": "UP" }
  ```

---

## 2. User Management

### Create User
Creates a new user record in Redis and writes a create event to PostgreSQL.

- **URL**: `/users`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "string",
    "email": "string"
  }
  ```
- **Response (201 Created)**: Returns the created user object with a unique UUID.

### Get All Users
Retrieves all users stored in the system.

- **URL**: `/users`
- **Method**: `GET`
- **Response (200 OK)**: Array of user objects.

### Get User by ID
- **URL**: `/users/{id}`
- **Method**: `GET`
- **Response (200 OK)**: Single user object.
- **Response (404 Not Found)**: If user does not exist.

### Update User
- **URL**: `/users/{id}`
- **Method**: `PUT`
- **Body**:
  ```json
  {
    "name": "string",
    "email": "string"
  }
  ```
- **Response (200 OK)**: Returns the updated user object and writes an update event to PostgreSQL.

### Delete User
- **URL**: `/users/{id}`
- **Method**: `DELETE`
- **Response (204 No Content)**: Success message and writes a delete event to PostgreSQL.

---

## 3. Audit History

### Get All Audit Events
Retrieves user create, update, and delete events stored in PostgreSQL.

- **URL**: `/audits`
- **Method**: `GET`
- **Response (200 OK)**: Array of audit event objects.

---

## Error Handling
The API returns unified error objects:
```json
{
  "error": "Error description message"
}
```
- `400 Bad Request`: Validation failure.
- `404 Not Found`: Resource missing.
- `500 Internal Server Error`: System failure.
