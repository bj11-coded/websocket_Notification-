# WebSocket Notification System Documentation

This document describes the WebSocket integration for real-time notifications in the application. The system uses **Socket.io** to enable bidirectional communication between the server and connected clients, primarily used for broadcasting notifications.

## 1. Overview

The flow of a notification is as follows:

1.  **Trigger**: A client or external service sends a POST request to `/notification` with notification details.
2.  **Processing**: The `notification` controller validates the data and saves it to the database.
3.  **Broadcast**: The server emits a `notification` event via Socket.io to _all_ connected clients.
4.  **Delivery**: Connected clients receive the event and update their UI in real-time.

## 2. Server-Side Implementation

The server-side implementation involves initializing the Socket.io server, attaching it to the HTTP server, and exposing it for use in controllers.

### 2.1 Configuration (`config/server.config.js`)

This file manages the Socket.io instance. It exports `initSocket` for initialization and `getIo` for retrieving the instance elsewhere in the application.

```javascript
// config/server.config.js
import { Server } from "socket.io";

let io;

export const initSocket = async (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Allows connections from any origin
    },
  });

  io.on("connection", (socket) => {
    console.log("Connected Successfully...", socket.id);
    socket.on("disconnect", () => {
      console.log("Client Disconnected...", socket.id);
    });
  });
};

export const getIo = () => {
  if (!io) {
    throw new Error("Socket not initialized...");
  }
  return io;
};
```

### 2.2 Initialization (`index.js`)

The Socket.io server is initialized alongside the Express application. It is important that `initSocket` is called with the HTTP server instance, _not_ the Express app instance directly.

```javascript
// index.js
import http from "http";
import { initSocket } from "./config/server.config.js";

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
```

### 2.3 Emitting Notifications (`controllers/notification.controller.js`)

When a notification is created via the API endpoint, the controller retrieves the initialized `io` instance and emits the event.

```javascript
// controllers/notification.controller.js
import { getIo } from "../config/server.config.js";

export const notification = async (req, res) => {
  // ... (validation and database logic)

  // Retrieve the initialized socket instance
  const io = getIo();

  // Emit the 'notification' event to all connected clients
  // The 'newNotification' object contains data like { message: "...", userId: "..." }
  io.emit("notification", newNotification);

  // ... (response logic)
};
```

## 3. Client-Side Implementation

The client connects to the socket server and listens for events.

### 3.1 Connection (`notification.html`)

The client uses the Socket.io client library (loaded via CDN) to establish a connection.

**Important**: Ensure the client connects to the same port the server is running on.

- Developing locally: If server runs on `5000`, client must connect to `http://localhost:5000`.

```html
<!-- Load Socket.io Client -->
<script src="https://cdn.socket.io/4.8.3/socket.io.min.js"></script>

<script>
  // Initialize connection
  // Ensure the URL matches your server's address and port
  const socket = io("http://localhost:5000"); // Update port as needed

  // Listen for connection success
  socket.on("connect", () => {
    console.log("Connected to Server with ID:", socket.id);
  });

  // Listen for 'notification' events from the server
  socket.on("notification", (data) => {
    console.log("New Notification Received:", data);

    // Update the UI
    const notificationElement = document.getElementById("Notification");
    if (notificationElement) {
      notificationElement.innerHTML = data.message;
    }
  });

  // Listen for errors
  socket.on("connect_error", (err) => {
    console.error("Connection Error:", err.message);
  });
</script>
```

## 4. API Reference

### Events

| Event Name     | Direction        | Payload  | Description                                                |
| :------------- | :--------------- | :------- | :--------------------------------------------------------- |
| `connection`   | Client -> Server | -        | Fired when a client connects.                              |
| `disconnect`   | Client -> Server | -        | Fired when a client disconnects.                           |
| `notification` | Server -> Client | `object` | Contains notification details (e.g., `message`, `userId`). |

## 5. Troubleshooting

### Common Issues

1.  **Connection Refused / 404 Not Found**
    - **Cause**: The client is trying to connect to the wrong URL or port.
    - **Fix**: Check `index.js` for the `PORT` variable (default 5000) and ensure the client code uses `io("http://localhost:5000")`.
    - _Note: In the current codebase, `notification.html` uses port 4001, while `index.js` typically defaults to 5000. These must match._

2.  **CORS Errors**
    - **Cause**: The client origin is different from the server origin and blocked by browser security.
    - **Fix**: Ensure `cors` is configured in `initSocket`:
      ```javascript
      io = new Server(server, {
        cors: { origin: "*" }, // or specific origins like "http://localhost:3000"
      });
      ```

3.  **"Socket not initialized" Error**
    - **Cause**: `getIo()` is called before `initSocket(server)` has completed or before the server has started.
    - **Fix**: Ensure `initSocket(server)` is called in `index.js` before any routes that use `getIo()` are accessed.

## 6. Advanced Topics

### 6.1 Private Messaging (Targeted Notifications)

Currently, the system broadcasts to everyone using `io.emit`. To send notifications to specific users, you should use **Rooms**.

1. **Join a Room**: When a user connects (or when they login), have them join a room named after their `userId`.

   ```javascript
   // Server-Side: Inside io.on("connection", ...)
   socket.on("join_room", (userId) => {
     socket.join(userId);
     console.log(`Socket ${socket.id} joined room ${userId}`);
   });
   ```

2. **Send to Room**:
   ```javascript
   // Controller
   io.to(targetUserId).emit("notification", data);
   ```

### 6.2 Authentication (Middleware)

To prevent unauthorized access, add middleware before the connection is established.

```javascript
// config/server.config.js
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (isValid(token)) {
    next();
  } else {
    next(new Error("Authentication error"));
  }
});
```

### 6.3 Scaling with Redis

If you deploy to multiple server instances (e.g., using PM2 cluster mode or Kubernetes), a client connected to Server A won't receive messages emitted from Server B.

**Solution**: Use the Socket.io Redis Adapter.

1. Install: `npm install @socket.io/redis-adapter redis`
2. Configure:

   ```javascript
   import { createAdapter } from "@socket.io/redis-adapter";
   import { createClient } from "redis";

   const pubClient = createClient({ url: "redis://localhost:6379" });
   const subClient = pubClient.duplicate();

   await Promise.all([pubClient.connect(), subClient.connect()]);

   io.adapter(createAdapter(pubClient, subClient));
   ```

## 7. Testing

You can test WebSocket connections without building a frontend using tools like **Postman** (v10+ supports Socket.io) or **Firecamp**.

**Testing with Postman:**

1. Create a new request and select **Socket.io**.
2. Enter URL: `http://localhost:5000` (or your server URL).
3. Click **Connect**.
4. In the "Events" tab, listen for `notification`.
5. Send a POST request to your API to trigger the notification.
6. Verify the event appears in the Postman Socket.io logs.

## 8. Deployment Checklist

- [ ] **Sticky Sessions**: If using Nginx or a Load Balancer, enable sticky sessions (ip_hash) because Socket.io starts with HTTP long-polling.
- [ ] **Secure WebSockets**: Use `wss://` (handled automatically if you use HTTPS domain).
- [ ] **Environment Variables**: Ensure `PORT` and allowed CORS origins are set via `.env`.
