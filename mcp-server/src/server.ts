import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const apiBase = process.env.ACME_API_URL ?? "http://localhost:3000";
const server = new McpServer({ name: "acmeshop-workshop", version: "1.0.0" });

// The MCP layer deliberately calls HTTP endpoints only. It never opens JSON files.
async function api(path: string, options?: RequestInit) {
  try {
    const response = await fetch(`${apiBase}${path}`, options);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? `API returned HTTP ${response.status}`);
    return { content: [{ type: "text" as const, text: JSON.stringify(body, null, 2) }] };
  } catch (error) {
    return { content: [{ type: "text" as const, text: `AcmeShop API error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
  }
}
const query = (values: Record<string, string | undefined>) => {
  const params = new URLSearchParams(Object.entries(values).filter((entry): entry is [string, string] => Boolean(entry[1])));
  return params.size ? `?${params}` : "";
};

server.registerTool("search_customers", {
  description: "Search AcmeShop customers by name, email, plan, or customer ID. Use this to identify a customer before looking up their orders.",
  inputSchema: { query: z.string().describe("Name, email, plan, or customer ID to search for") }
}, async ({ query: search }) => api(`/customers?${new URLSearchParams({ query: search })}`));

server.registerTool("get_customer_orders", {
  description: "Get every order for one customer ID. Use this when investigating a customer's payment history, duplicate charges, or failed checkout attempts.",
  inputSchema: { customerId: z.string().describe("AcmeShop customer ID, such as C001") }
}, async ({ customerId }) => api(`/customers/${encodeURIComponent(customerId)}/orders`));

server.registerTool("get_order", {
  description: "Get full details of one order, including payment status, attempts, payment reference, and any diagnostic note.",
  inputSchema: { orderId: z.string().describe("Order ID, such as O1002") }
}, async ({ orderId }) => api(`/orders/${encodeURIComponent(orderId)}`));

server.registerTool("search_deployments", {
  description: "Find deployments by service, version, or status. Use this when investigating whether a recent deployment may be related to an operational problem.",
  inputSchema: { service: z.string().optional(), version: z.string().optional(), status: z.string().optional() }
}, async (input) => api(`/deployments${query(input)}`));

server.registerTool("search_incidents", {
  description: "Find current or historical incidents by service, severity, or status. Use this to discover prior symptoms, root causes, and whether a problem is already being tracked.",
  inputSchema: { service: z.string().optional(), severity: z.string().optional(), status: z.string().optional() }
}, async (input) => api(`/incidents${query(input)}`));

server.registerTool("find_engineer", {
  description: "Find engineers responsible for a service. Use this to identify the owning team and on-call engineer after investigating an issue.",
  inputSchema: { service: z.string().describe("Service name, for example checkout") }
}, async ({ service }) => api(`/engineers?${new URLSearchParams({ service })}`));

server.registerTool("get_engineer", {
  description: "Get detailed information for one engineer, including their team, services, on-call status, and contact email.",
  inputSchema: { engineerId: z.string().describe("Engineer ID, such as E-42") }
}, async ({ engineerId }) => api(`/engineers/${encodeURIComponent(engineerId)}`));

server.registerTool("create_incident", {
  description: "Create a new production incident when an operational problem has been identified. Use this only when the investigation provides enough evidence that an incident should be created. This writes to AcmeShop's incident system.",
  inputSchema: {
    service: z.string(), severity: z.enum(["SEV-1", "SEV-2", "SEV-3", "SEV-4"]), title: z.string(), description: z.string(), assignedTo: z.string().optional()
  }
}, async (incident) => api("/incidents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(incident) }));

await server.connect(new StdioServerTransport());
console.error(`AcmeShop MCP server connected over stdio; forwarding tools to ${apiBase}`);
