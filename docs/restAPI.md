# General rules for any REST API endpoint

In the diagrams, only the successful response is shown. The unsuccessful
responses are the same for all endpoints and can be inferred from the HTTP
response codes.

## HTTP Response Codes

- **200: Success** - The body contains a JSON object in the respective format

- **400: Bad Request** - Most likely the user is unauthorized to perform the
  given action at that given time or with the given data. Can also indicate a
  malformed request. **Any route can return this status code.** The body
  contains a JSON object in this format:
  `{ "message": "Description of the error" }`
- **404: Not Found** - The route does not exist. The body contains a JSON object
  in this format: `{ "message": "Route not found" }`
- **500: Internal Server Error** - Most likely a server crash, check the server
  logs for details. The body contains (unless things went really wrong) a JSON
  object in this format: `{ "message": "Internal server error" }`

## Authentication

- **Unless specified otherwise**, all endpoints require authentication
- To authenticate, include an `Authorization` header with in this format:
  `Bearer <token>` (replace entire \<token> with the actual token)
