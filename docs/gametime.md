# GameTime

`GameTime` (defined in `@jetlag/shared-types`) represents elapsed game time in **milliseconds**.

## Key facts

- All in-memory, network, and database representations of `gameTime` use
  **milliseconds** uniformly.
- It is continuous, always increasing. Everything happening in game should use
  `gameTime` to track time as it correctly handles pausing/resuming.
