# Lobby

## 1. List available games

```mermaid
sequenceDiagram
    autonumber

    actor APP as App
    participant REST as Rest API

    APP->>REST: GET /api/lobby
    REST->>APP: LobbyListResponse
```

[`LobbyListResponse`](../packages/shared-types/src/restAPI/lobby.ts)

## 2. Download datasets

- for all available games, if the dataset is not already downloaded, download it
- pay attention to the difference between metadataId (shared between all
  versions, tied to the name) and datasetId (unique for each version)

```mermaid
sequenceDiagram
    autonumber

    actor APP as App
    participant REST as Rest API

    APP->>REST: POST /api/dataset GetDatasetRequest
    REST->>APP: GetDatasetResponse
```

[`GetDatasetRequest`](../packages/shared-types/src/restAPI/dataset.ts), [`GetDatasetResponse`](../packages/shared-types/src/restAPI/dataset.ts)
