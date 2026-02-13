# E2E Encrypted Chat – Zero-Access Messaging

This project is a fully functional end-to-end encrypted chat application built using the MERN stack (MongoDB, Express, React, Node.js). Messages are encrypted on the client side using libsodium (NaCl), the same cryptographic library used by Signal and WhatsApp. The server never sees plaintext; it only stores and relays ciphertext, nonces, and public keys.

## Overview

This application implements a zero-access architecture. Unlike traditional HTTPS, which only protects data while it is moving between the user and the server, this system ensures that data remains encrypted even when stored on the server. Even if the server is compromised, an attacker cannot read past or future messages because the private keys required for decryption never leave the user's browser.

Key architectural points:
*   **Key generation:** Key pairs (Curve25519) are generated in the browser during registration.
*   **Encryption:** All encryption and decryption occur exclusively on the user's device.
*   **Key storage:** Private keys are stored in the browser's `localStorage` and are never transmitted to the server.
*   **Server role:** The server stores public keys and encrypted messages. It cannot decrypt the data it holds.
*   **Real-time:** Messaging uses Socket.IO with automatic reconnection and fallback to long-polling.
*   **Authentication:** The system uses JWT for session management and bcrypt for password hashing.

## Features

*   **User System:** Registration and login with bcrypt password hashing and JWT tokens.
*   **Cryptography:** Automatic Curve25519 key pair generation upon registration.
*   **Security:** Client-side encryption and decryption using XSalsa20-Poly1305 authenticated encryption.
*   **Communication:** Real-time messaging via WebSocket (Socket.IO).
*   **History:** Encrypted message history is stored in MongoDB.
*   **User Interface:** A clean, responsive UI that lists registered users and supports message status updates (delivered/read).

## Technology Stack

*   **Frontend:** React 18, Vite, Axios, Socket.IO-client
*   **Cryptography:** libsodium-wrappers (NaCl: Curve25519, XSalsa20, Poly1305)
*   **Backend:** Node.js, Express, Socket.IO, JSON Web Token (JWT), bcryptjs
*   **Database:** MongoDB + Mongoose ODM
*   **Styling:** Custom CSS (Flexbox/Grid)

## How It Works

### 1. Registration and Key Generation
When a user registers, the browser generates a public/private key pair using `libsodium`. The public key is sent to the server and stored in the database. The private key remains in the browser's `localStorage` and is never transmitted.

### 2. Sending a Message
To send a message, the application fetches the recipient's public key from the server. It combines the recipient's public key with the sender's private key to compute a shared secret. A unique 24-byte nonce is generated for the message. The message is encrypted using XSalsa20 and authenticated with Poly1305. Only the ciphertext, nonce, and sender's public key are sent to the server.

### 3. Receiving a Message
The recipient's browser receives the ciphertext, nonce, and sender's public key. It retrieves the recipient's private key from `localStorage`, re-computes the shared secret, verifies the authentication tag, and decrypts the message for display.

### 4. Zero-Access Verification
Inspection of the database will show that all message content is stored as base64-encoded strings. Network inspection will confirm that plaintext messages are never sent over the network. Because a unique nonce is used for every message, encrypting the same message twice will result in completely different ciphertext.

## Installation and Setup

### Prerequisites
*   Node.js version 18 or higher
*   MongoDB (local instance or MongoDB Atlas)
*   Git

### Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/e2e-encrypted-chat.git
    cd e2e-encrypted-chat
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**

    Create a file named `.env.server` for the backend:
    ```
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/e2e-chat
    JWT_SECRET=your_super_secret_jwt_key_change_me
    NODE_ENV=development
    CORS_ORIGIN=http://localhost:3000
    ```

    Create a file named `.env` for the frontend (Vite proxy handles routing, so these can be empty for local development):
    ```
    VITE_API_URL=
    VITE_WS_URL=
    ```

4.  **Run the application:**
    ```bash
    npm run dev
    ```
    This starts the frontend on `http://localhost:3000` and the backend on `http://localhost:5000`.

## Deployment

This setup describes deploying the frontend to a static host (like ByteXL Nimbus) and exposing the backend via an ngrok tunnel.

1.  **Start the backend server:**
    ```bash
    npm run server
    ```

2.  **Start ngrok:**
    ```bash
    ngrok http 5000
    ```
    Copy the generated HTTPS URL (e.g., `https://abc123.ngrok-free.dev`).

3.  **Update Frontend Configuration:**
    Edit `src/services/api.js` and set the `API_URL` to your ngrok URL.
    In `src/components/ChatWindow.jsx`, update the `SOCKET_URL` if necessary.

4.  **Build the Frontend:**
    ```bash
    npm run build
    ```
    Upload the contents of the `dist/` folder to your hosting provider.

## API Endpoints

All endpoints are prefixed with `/api`.

| Method | Endpoint | Description | Authentication Required |
| :--- | :--- | :--- | :--- |
| POST | `/auth/register` | Register new user and store public key | No |
| POST | `/auth/login` | Login and receive JWT | No |
| GET | `/auth/users` | List all users (excluding self) | Yes |
| POST | `/messages/send` | Send an encrypted message | Yes |
| GET | `/messages/conversation/:id` | Get conversation history with a user | Yes |
| PUT | `/messages/:id/delivered` | Mark message as delivered | Yes |
| PUT | `/messages/:id/read` | Mark message as read | Yes |
| GET | `/health` | Check server and database status | No |

## Project Structure

```
e2e-encrypted-chat/
├── models/               # Mongoose schemas (User, Message)
├── routes/               # Express route handlers (auth, messages)
├── middleware/           # JWT authentication middleware
├── src/                  # React frontend
│   ├── components/       # UI components
│   ├── services/         # API and crypto services
│   ├── App.jsx
│   └── main.jsx
├── server.js             # Main Express server + Socket.IO
├── vite.config.js        # Vite configuration
├── .env.server           # Backend environment variables
└── package.json          # Dependencies
```

## Cryptographic Details

*   **Key Exchange:** Curve25519 (ECDH) via `crypto_box_keypair`.
*   **Encryption:** XSalsa20 stream cipher.
*   **Authentication:** Poly1305 MAC.
*   **Nonce:** 24-byte random value generated per message via `randombytes_buf`.
*   **Encoding:** All binary data (keys, ciphertext, nonce) are base64-encoded for JSON transport.

The library `libsodium` was chosen because it provides audited, high-level authenticated encryption (AEAD) in a single operation, preventing common implementation errors.

## Troubleshooting

*   **Network Error on register:** Ensure the backend is running (`npm run server`) and the API URL in the frontend code is correct.
*   **401 Unauthorized:** The JWT has likely expired. Log out and log in again.
*   **Decryption failed:** This occurs if the private key in `localStorage` does not match the public key stored on the server (e.g., if the user logs in on a new device or clears storage without re-registering). Log out and log in to regenerate keys.
*   **Socket.IO not connecting:** WebSockets might be blocked. Ensure the ngrok URL is current and the client is configured to try polling as a fallback.

## Contributors

*   MD MABUD
*   MD REHAN
*   KANISHK GUPTA
*   KRISH MALIK

Supervised by Prof. Meenakshi Rana, Chandigarh University.

## License

This project is licensed under the MIT License.