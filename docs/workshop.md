# AcmeShop workshop guide

## Part 1 — What problem are we solving?

An AI can discuss operational issues, but it cannot inspect AcmeShop's orders, deployments, or incident system without capabilities. MCP gives an AI client a standard way to discover and call those capabilities.

## Part 2 — REST API vs MCP

The REST API is the application interface: it owns validation and persistence. MCP is an AI-friendly layer over that API: named tools, input schemas, and descriptions tell the model what it can safely do. In this demo the path is always MCP tool → HTTP API → JSON.

## Part 3 — Build an MCP tool

Open `mcp-server/src/server.ts`. Each `registerTool` has a clear name, a description that guides model choice, an input schema, and one HTTP call. `search_deployments` is a useful example: it does not decide that a deployment caused an incident; it only makes that evidence available.

## Part 4 — Connect the MCP server

Run `npm run dev`, configure a local stdio MCP client as shown in the README, and confirm it lists the AcmeShop tools. Keep the API dashboard open at http://localhost:3000.

## Part 5 — Let the AI investigate

Ask why checkout had payment problems. A good agent can inspect incident history, recent checkout deployments, and customer orders. The data correlates failures beginning just after checkout 3.2.1, whose deployment notes mention retry callbacks; a prior incident provides related context.

## Part 6 — Let the AI take an action

Ask the agent to create an incident only after it has evidence. The `create_incident` tool makes a POST request and appends to `data/incidents.json`. Refresh the dashboard to show the changed incident count. Reset with `npm run reset` before the next audience.

## Part 7 — Discussion: what makes a good MCP server?

- Tool descriptions are part of agent design: they tell the model when a capability is appropriate.
- Tool granularity matters: independent, composable reads let the model investigate rather than following a hard-coded workflow.
- Read access is easier to expose than writes. Writes need permissions, authentication, human approval, idempotency, and clear error handling.
- Production servers need observability, audit trails, rate limits, prompt-injection defenses, and least-privilege access. This local demo intentionally omits those controls to stay simple.
