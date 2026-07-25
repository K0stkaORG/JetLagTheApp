# Authentication Flow

## 1. Verify user provided server URL

- Does not require authentication
- Do that only when the user changes the server URL

```mermaid
sequenceDiagram
    autonumber

    actor APP as App
    participant REST as Rest API

    APP->>REST: GET /api/isJetlagServer
    alt Is JetLag Server
        REST-->>APP: 200 OK { "isJetlagServer": true }
    else Is Not JetLag Server
        REST-->>APP: Anything else
    end
```

## 2. Register

- Does not require authentication

```mermaid
sequenceDiagram
    autonumber

    actor APP as App
    participant REST as Rest API

    APP->>REST: POST /api/auth/register RegisterRequest
    REST-->>APP: 200 OK
```

[`RegisterRequest`](../packages/shared-types/src/restAPI/auth.ts)

## 3. Login

- Does not require authentication

```mermaid
sequenceDiagram
    autonumber

    actor APP as App
    participant REST as Rest API

    APP->>REST: POST /api/auth/login LoginRequest
    REST-->>APP: LoginResponse
```

[`LoginRequest`](../packages/shared-types/src/restAPI/auth.ts), [`LoginResponse`](../packages/shared-types/src/restAPI/auth.ts)

### 4. Revalidate Token

```mermaid
sequenceDiagram
    autonumber

    actor APP as App
    participant REST as Rest API

    APP->>REST: GET /api/auth/revalidate
    REST-->>APP: RevalidateResponse
```

[`RevalidateResponse`](../packages/shared-types/src/restAPI/auth.ts)
