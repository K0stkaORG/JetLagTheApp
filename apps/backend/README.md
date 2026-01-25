# Backend2

Modern, secure backend server built with TypeScript, Express, Socket.io, and PostgreSQL.

## Features

- ✅ **TypeScript** - Type-safe development
- ✅ **Express** - Fast REST API framework
- ✅ **Socket.io** - Real-time bidirectional communication
- ✅ **PostgreSQL** - Robust relational database
- ✅ **Docker** - Containerized deployment
- ✅ **Security** - Helmet, CORS, rate limiting
- ✅ **Validation** - Zod schema validation
- ✅ **Logging** - Winston structured logging
- ✅ **Error Handling** - Centralized error management

## Project Structure

```
apps/backend2/
├── src/
│   ├── index.ts           # Application entry point
│   ├── server.ts          # Server setup & configuration
│   ├── db/
│   │   └── index.ts       # Database connection pool
│   ├── lib/
│   │   └── logger.ts      # Winston logger configuration
│   ├── middleware/
│   │   ├── errorHandler.ts    # Error handling middleware
│   │   └── validation.ts      # Request validation middleware
│   ├── routes/
│   │   ├── index.ts           # Route registration
│   │   └── example.routes.ts  # Example API routes
│   └── sockets/
│       └── index.ts           # Socket.io event handlers
├── Dockerfile             # Production Docker image
├── docker-compose.yml     # Docker Compose configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies & scripts
└── .env.example          # Environment variables template
```

## Prerequisites

- Node.js 20+
- pnpm (or npm/yarn)
- PostgreSQL 16+ (or use Docker)
- Docker & Docker Compose (optional, for containerized deployment)

## Getting Started

### 1. Install Dependencies

```bash
cd apps/backend2
pnpm install
```

### 2. Setup Environment Variables

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

- Set `DATABASE_URL` to your PostgreSQL connection string
- Change `JWT_SECRET` and `SESSION_SECRET` to secure random values
- Configure `ALLOWED_ORIGINS` for CORS

### 3. Setup Database

Create a PostgreSQL database:

```sql
CREATE DATABASE backend2;
```

Or use Docker Compose (includes PostgreSQL):

```bash
docker-compose up -d db
```

### 4. Run the Application

**Development mode** (with auto-reload):

```bash
pnpm dev
```

**Production mode**:

```bash
pnpm build
pnpm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## Docker Deployment

### Build and Run with Docker Compose

Run from `apps/backend2` directory:

```bash
docker-compose up -d
```

This will start both the application and PostgreSQL database.

### Build Docker Image Manually

From the **monorepo root**:

```bash
docker build -f apps/backend2/Dockerfile -t backend2 .
```

### Run Docker Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/backend2 \
  backend2
```

## API Endpoints

### Health Check

```
GET /health
```

Returns server health status.

### Example Endpoints

```
GET /api/example
POST /api/example
```

See [example.routes.ts](src/routes/example.routes.ts) for implementation details.

## Socket.io Events

### Client → Server

- `message` - Send a message
- `join-room` - Join a room
- `leave-room` - Leave a room

### Server → Client

- `message` - Message response
- `joined-room` - Confirmed room join
- `left-room` - Confirmed room leave
- `user-joined` - Another user joined the room
- `user-left` - Another user left the room

See [sockets/index.ts](src/sockets/index.ts) for implementation details.

## Security Features

- **Helmet** - Sets security-related HTTP headers
- **CORS** - Configurable cross-origin resource sharing
- **Rate Limiting** - Prevents abuse (100 requests per 15 minutes)
- **Input Validation** - Zod schema validation for requests
- **Non-root User** - Docker container runs as non-privileged user
- **Health Checks** - Docker container health monitoring

## Development

### Available Scripts

- `pnpm dev` - Start development server with auto-reload
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm type-check` - Check TypeScript types

### Adding New Routes

1. Create a new route file in `src/routes/`
2. Register it in `src/routes/index.ts`
3. Use validation middleware for request validation

### Adding New Socket Events

Add event handlers in `src/sockets/index.ts`.

## Environment Variables

| Variable          | Description                            | Default                 |
| ----------------- | -------------------------------------- | ----------------------- |
| `NODE_ENV`        | Environment mode                       | `development`           |
| `PORT`            | Server port                            | `3000`                  |
| `LOG_LEVEL`       | Logging level                          | `info`                  |
| `DATABASE_URL`    | PostgreSQL connection string           | -                       |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `http://localhost:3000` |
| `JWT_SECRET`      | JWT signing secret                     | -                       |
| `SESSION_SECRET`  | Session secret                         | -                       |

## License

ISC
