# AcmeShop MCP AI Summit workshop

A small, local demonstration of an AI agent using MCP to investigate AcmeShop operational data and create an incident. The MCP server wraps a mock REST API; the API alone reads and writes JSON files.

```text
User → AI client → MCP → MCP server → Mock REST API → JSON data
```

## Prerequisites

Node.js 20 or later (Node 22 LTS recommended) and npm. No credentials or external services are needed.

## Install and run

```bash
npm install
npm run dev
```

This starts the API at [http://localhost:3000](http://localhost:3000) and starts the MCP process over stdio. Open the API URL for the tiny live dashboard. To run them separately, use `npm run api` and, in another terminal, `npm run mcp`.

Reset the workshop after a write demo:

```bash
npm run reset
```

## Test the REST API

```bash
curl http://localhost:3000/customers/C001
curl 'http://localhost:3000/deployments?service=checkout'
curl http://localhost:3000/incidents
curl -X POST http://localhost:3000/incidents -H 'content-type: application/json' -d '{"service":"checkout","severity":"SEV-2","title":"Demo incident","description":"Created through the mock REST API","assignedTo":"E-42"}'
```

## Connect an MCP client

The server uses the standard local **stdio** transport. Start the mock API first, then configure a local MCP-capable client with this command, from the repository directory:

```json
{
  "mcpServers": {
    "acmeshop": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/Users/prateeksharma/Documents/ChatGPT/Confrence"
    }
  }
}
```

For ChatGPT specifically, local stdio processes and `localhost` are not automatically reachable from every ChatGPT product or deployment. Use the local Codex desktop MCP configuration if available, or expose the server through a supported remote MCP transport only after adding appropriate authentication. This workshop intentionally keeps the default configuration local and credential-free.

The MCP process forwards every tool call to `http://localhost:3000`; it never reads the data files directly. The eight tools are intentionally independent so the model chooses how to investigate.

See [the workshop guide](docs/workshop.md) and [presenter script](docs/demo-script.md).
