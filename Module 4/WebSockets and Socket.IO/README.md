# WebSockets & Socket.IO: Real-Time Comments

The backend serves a REST API but has no real-time capability. Users viewing a resource
have to refresh the page to see new content. Add a Socket.IO server that broadcasts a
`commentAdded` event to everyone watching a resource whenever a new comment is posted,
and implement the join, leave, and disconnection lifecycle handlers. You complete one file.

---

## What you are building

```
Client A                          Server                          Client B
   joinRoom "post-42"      ──────▶  socket.join('post-42')
                                                                     joinRoom "post-42"
                                                             ◀────── socket.join('post-42')
   newComment "post-42"    ──────▶  io.to('post-42').emit('commentAdded', ...)
                           ◀──────                          ──────▶
  (A receives commentAdded, because io.to() includes the sender)   (B receives it too)
```

## Project structure

```
src/
  app.js       ← Express + HTTP server setup, calls initSocket() (given, do not modify)
  socket.js    ← YOU IMPLEMENT THIS
public/
  index.html   ← browser client with connect/join/leave/comment buttons (given, do not modify)
tests/
  run.js       ← automated tests (do not modify)
package.json    ← express and socket.io are already listed
```

## Setup

```bash
npm install
npm start       # runs on http://localhost:3000
npm test        # fails until you implement socket.js
```

## What to implement: `src/socket.js`

The file already has the `'connection'` handler and its opening log line in place. Five
pieces are marked `// TODO` for you to fill in:

```js
function initSocket(httpServer) {
  // TODO 1: create a new Socket.IO server bound to httpServer
  //         (pass { cors: { origin: '*' } } as options)
  const io = null;

  if (!io) return io;   // remove this line once TODO 1 creates a real server

  io.on('connection', (socket) => {
    console.log(`[+] connected: ${socket.id}`);

    // TODO 2: listen for 'joinRoom', data: { room }, call socket.join(data.room)

    // TODO 3: listen for 'leaveRoom', data: { room }, call socket.leave(data.room)

    // TODO 4: listen for 'newComment', data: { room, text }, broadcast
    //         'commentAdded' with that data to everyone in data.room
    //         (use io.to(data.room).emit(), not io.emit())

    // TODO 5: listen for 'disconnect', log: [-] disconnected: <socket.id> (<reason>)
  });

  return io;
}
```

1. **TODO 1**: create the Socket.IO server: `new Server(httpServer, { cors: { origin: '*' } })`. Delete the `if (!io) return io;` line once this is done, it only exists so the tests fail cleanly before you start.
2. **TODO 2**: `socket.on('joinRoom', (data) => socket.join(data.room))`.
3. **TODO 3**: `socket.on('leaveRoom', (data) => socket.leave(data.room))`.
4. **TODO 4**: `socket.on('newComment', (data) => io.to(data.room).emit('commentAdded', data))`.
5. **TODO 5**: `socket.on('disconnect', (reason) => console.log(...))`.

## Rules

- Do not modify `src/app.js`, `public/index.html`, or `tests/run.js`.
- The entire implementation lives in `src/socket.js`.
- Use `io.to(room).emit()` for room broadcasts, not `io.emit()`, that would go to every connected client regardless of room.

## Run the tests

```bash
npm test
```

Five scenarios:

1. A client that connects receives a unique `socket.id`.
2. A client that joins `'post-42'` and emits `'newComment'` receives a `'commentAdded'` event back.
3. A second client in the same room also receives the `'commentAdded'` event.
4. A client that has left the room does **not** receive subsequent `'commentAdded'` events.
5. The server logs `[+] connected` on connection and `[-] disconnected` on disconnection.

Expected when correct:

```
Results: 5 passed, 0 failed
All tests passed! ✓
```

## Manual check (two browser tabs)

1. `npm start`, then open `http://localhost:3000` in two tabs.
2. Click **Connect** in both, then **Join "post-42"** in both.
3. Click **Post a comment** in Tab 1, both tabs should log `commentAdded` received.
4. Click **Leave "post-42"** in Tab 2, then post another comment from Tab 1, only Tab 1 should receive it now.
5. Close Tab 1, the server terminal should log `[-] disconnected`.

## Debugging guide

| Symptom | Likely cause |
|---|---|
| Test 1 fails, or the server crashes on start | TODO 1 not done, `io` is still `null` |
| Tests 2–3 fail (`commentAdded` never arrives) | TODO 4 missing, or you used `io.emit()` instead of `io.to(data.room).emit()` |
| Test 4 fails (client still receives after leaving) | TODO 3 missing, `socket.leave()` was never called |
| Test 5 fails (no disconnect log) | TODO 5 missing |

## Submission

1. Fork or clone this project and create a branch in your own repository.
2. Implement `src/socket.js` as described above.
3. Run `npm test`, confirm `Results: 5 passed, 0 failed`.
4. Do the manual two-tab check above.
5. Open a PR. In the description, briefly explain: *how do rooms scope event delivery, and what would need to change to support multiple server instances?*
6. Submit the PR link.
