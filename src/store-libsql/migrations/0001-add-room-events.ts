import { Effect } from 'effect'
import { SqlClient } from 'effect/unstable/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  return sql`
    CREATE TABLE room_events (
      roomId TEXT NOT NULL,
      eventId TEXT NOT NULL,
      type TEXT NOT NULL,
      sender TEXT,
      state_key TEXT,
      unsigned JSON,
      content JSON,
      origin_server_ts INTEGER NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      PRIMARY KEY (roomId, eventId)
    )
  `
})

// {
//               "content": {
//                 "name": "blehblehbleh"
//               },
//               "eventId": "$S27Vtqye8cljNEpAWmNPNJuPuoL1pBcngM1JdvgCGkw",
//               "originServerTs": 1756992882735,
//               "sender": "@sting:maishond.nl",
//               "stateKey": "",
//               "type": "m.room.name",
//               "unsigned": {
//                 "age": 17000708253
//               }
//             },
