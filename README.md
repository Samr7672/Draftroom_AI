# Draftroom

Draftroom is an AI-powered writing workspace for creating, refining, and organizing marketing content. It combines a React and Vite client with an Express API, MongoDB persistence, JWT authentication, and LangChain.js-powered OpenAI generation.

## Quick Links

- **Client:** [http://localhost:5173](http://localhost:5173)
- **Server API:** [http://localhost:5000](http://localhost:5000)
- **API health check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

## What You Can Do

- Create an account and sign in with email and password.
- Generate blog posts, LinkedIn posts, email newsletters, product descriptions, ad copy, and video scripts.
- Guide generation with a topic, tone, length, target audience, and keywords.
- Improve, shorten, expand, or change the tone of an existing draft.
- Edit titles and content directly in the workspace.
- Search saved drafts by title or topic.
- Copy content to the clipboard or delete drafts.
- Keep each user's drafts isolated in MongoDB.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| AI | LangChain.js and OpenAI ChatOpenAI |
| Authentication | JWT and bcryptjs |
| Development | Node watch mode and Vite HMR |

## Project Structure

```text
.
├── client/
│   ├── src/
│   │   ├── api.js       # Authenticated API client
│   │   ├── App.jsx      # Auth, generator, editor, and draft list UI
│   │   └── styles.css   # Application styles
│   └── index.html
├── server/
│   ├── middleware/auth.js
│   ├── models/          # User and content schemas
│   ├── routes/          # Auth and content endpoints
│   ├── services/ai.js   # LangChain generation and transformations
│   ├── server.js        # Express and MongoDB bootstrap
│   └── .env.example
├── package.json
└── README.md
```

## Requirements

- Node.js 18 or newer
- npm
- MongoDB 6 or newer, running locally or available through MongoDB Atlas
- An OpenAI API key with access to the configured model

## Local Setup

### 1. Install dependencies

From the repository root:

```bash
npm run install:all
```

### 2. Configure the server

Copy the example environment file:

```bash
cp server/.env.example server/.env
```

On Windows PowerShell, use:

```powershell
Copy-Item server/.env.example server/.env
```

Update `server/.env` with your values:

```dotenv
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/content-platform
JWT_SECRET=replace-with-a-long-random-secret
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
CLIENT_URL=http://localhost:5173
```

`MONGODB_URI`, `JWT_SECRET`, and `OPENAI_API_KEY` are required. The server exits during startup if any of them are missing.

### 3. Start the application

Run each command in its own terminal from the repository root:

```bash
npm run dev:server
npm run dev:client
```

Then open the [Draftroom client](http://localhost:5173). The API will be available at [http://localhost:5000](http://localhost:5000), and its health response is available at [http://localhost:5000/api/health](http://localhost:5000/api/health).

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run install:all` | Install server and client dependencies |
| `npm run dev:server` | Start the API with Node watch mode |
| `npm run dev:client` | Start the Vite development server |
| `npm run build --prefix client` | Build the frontend for production |
| `npm run start --prefix server` | Start the API without watch mode |

## API Reference

Protected content routes require an `Authorization` header using the JWT returned by registration or login:

```http
Authorization: Bearer <token>
```

### Health

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Check that the API is reachable |

### Authentication

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create a user and return a JWT |
| `POST` | `/api/auth/login` | Authenticate a user and return a JWT |

### Content

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/content?q=<query>` | List drafts, optionally filtered by title or topic |
| `POST` | `/api/content/generate` | Generate and save a new draft |
| `POST` | `/api/content/:id/transform` | Improve, shorten, expand, or change a draft's tone |
| `PUT` | `/api/content/:id` | Save title or body edits |
| `DELETE` | `/api/content/:id` | Delete a draft |

Supported transformation actions are `improve`, `shorten`, `expand`, and `tone`.

## AI Generation Flow

1. The client sends the selected format and writing instructions to the API.
2. The content route validates the request and associates it with the signed-in user.
3. `server/services/ai.js` builds a LangChain prompt and calls the configured OpenAI model.
4. The generated text is parsed, titled, stored in MongoDB, and returned to the client.
5. Transformations reuse the same service with the requested action and tone.

## Production Notes

Build the client from the repository root:

```bash
npm run build --prefix client
```

Deploy `client/dist` to a static host and run the server with:

```bash
npm run start --prefix server
```

Before deployment:

- Use a production MongoDB connection string.
- Generate a unique, long `JWT_SECRET` and keep it outside source control.
- Set `OPENAI_API_KEY` through the deployment platform's secret manager.
- Set `CLIENT_URL` to the deployed frontend origin.
- Keep `server/.env` out of version control.
- Put the API behind HTTPS and a reverse proxy where appropriate.

## Troubleshooting

**The server exits immediately**

Check that `server/.env` exists and includes `MONGODB_URI`, `JWT_SECRET`, and `OPENAI_API_KEY`. Then verify that MongoDB is running and reachable.

**The browser cannot reach the API**

Confirm both development servers are running and that `CLIENT_URL` matches the client origin. The default client URL is `http://localhost:5173`.

**Generation fails**

Verify that the OpenAI key is valid, the configured model is available to the account, and the server terminal does not report a rate-limit or provider error.
