import { Effect } from 'effect'
import { SqlClient } from 'effect/unstable/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE room_events (
      raw TEXT JSON CHECK (json_valid(raw)) NOT NULL,
      event_id TEXT NOT NULL,
      room_id TEXT NOT NULL,
      sender TEXT NOT NULL GENERATED ALWAYS AS (json_extract(raw, '$.sender')) VIRTUAL,
      type TEXT NOT NULL GENERATED ALWAYS AS (json_extract(raw, '$.type')) VIRTUAL,
      state_key TEXT GENERATED ALWAYS AS (json_extract(raw, '$.stateKey')) VIRTUAL,
      relates_to TEXT,

      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

      PRIMARY KEY (event_id),
      FOREIGN KEY (relates_to) REFERENCES room_events(event_id)
    );
  `

  yield* sql`CREATE INDEX idx_room_events_room_id ON room_events(room_id);`

  yield* sql`
    CREATE TABLE global (
      id INTEGER PRIMARY KEY CHECK (id = 0),
      next_batch TEXT
    )
  `
})
