# Socket

Types: [`ClientToServerEvents`](../packages/shared-types/src/socket/index.ts), [`ServerToClientEvents`](../packages/shared-types/src/socket/index.ts)

## 1. Connection, authentication

- The authentication token is in the following format: `{Game ID}:{Auth Token}` (for example: `12345:abcde`) and must be passed in the socket.io's `handshake.auth.token` field.
- In case the token is not provided or is invalid, the connection will be terminated. Server logs will provide more details.

```mermaid
    sequenceDiagram
    autonumber

    actor APP as App
    participant WS as Socket

    APP->>WS: Connect with token
    WS->>APP: general.game.joinDataPacket
```

## 2. Notifications/errors

- General purpose events used to notify the user of various events
- Do not need to be persisted in any way, just display them

```mermaid
    sequenceDiagram
    autonumber

    actor APP as App
    participant WS as Socket


    rect
        WS->>APP: general.notification
        Note over APP: Display the notification toast
    end

    rect
        WS->>APP: general.error
        Note over APP: Display the error toast
    end

    rect
        Note over WS: The game server is shutting down,<br />all clients will be disconnected
        WS->>APP: general.shutdown
        WS->>APP: Disconnect
    end
```

## 3. Timeline

- Events synchronizing the game time, state.

```mermaid
    sequenceDiagram
    autonumber

    actor APP as App
    participant WS as Socket

    rect
        Note over WS: The game has started
        WS->>APP: general.timeline.start
    end

    rect
        Note over WS: The game has been paused
        WS->>APP: general.timeline.pause
    end

    rect
        Note over WS: The game has been resumed
        WS->>APP: general.timeline.resume
    end

    rect
        Note over WS: The game has ended
        WS->>APP: general.timeline.end
        Note over WS: After X seconds, the server will shutdown
    end
```

## 4. Player online state

```mermaid
    sequenceDiagram
    autonumber

    actor P1 as Player 1
    actor P2 as Player 2
    participant WS as Socket

    rect
        P1->>WS: Connect
        WS->>P2: general.player.isOnlineUpdate
    end

    rect
        P1->>WS: Disconnect
        WS->>P2: general.player.isOnlineUpdate
    end
```

## 5. Player position updates

```mermaid
    sequenceDiagram
    autonumber

    actor P1 as Player 1
    actor P2 as Player 2 (friend)
    actor P3 as Player 3 (enemy)
    participant WS as Socket

    P1->>WS: general.player.positionUpdate
    Note over WS: Evaluate the new position, who should be notified
    WS->>P2: general.player.positionUpdate

    Note over P3: Does not even see the update
```

## 6. State changes

```mermaid
    sequenceDiagram
    autonumber

    actor APP as App
    participant WS as Socket

    Note over WS: The state has been changed
    WS->>APP: general.state.update
    Note over APP: Apply the Immer patches<br />to the local state
```
