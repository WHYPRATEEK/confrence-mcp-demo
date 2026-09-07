import express, { Request, Response } from "express";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type RecordValue = Record<string, unknown>;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dataFile = (name: string) => path.join(root, "data", `${name}.json`);
const readData = async <T>(name: string): Promise<T[]> => JSON.parse(await readFile(dataFile(name), "utf8"));
const writeData = async <T>(name: string, value: T[]) => writeFile(dataFile(name), `${JSON.stringify(value, null, 2)}\n`);
const text = (value: unknown) => String(value ?? "").toLowerCase();

const app = express();
app.use(express.json());

const list = (name: string, filter?: (item: RecordValue) => boolean) => async (_req: Request, res: Response) => {
  const items = await readData<RecordValue>(name);
  res.json(filter ? items.filter(filter) : items);
};
const getById = (name: string) => async (req: Request, res: Response) => {
  const item = (await readData<RecordValue>(name)).find((candidate) => candidate.id === req.params.id);
  if (!item) return res.status(404).json({ error: `${name.slice(0, -1)} not found` });
  res.json(item);
};

app.get("/customers", async (req, res) => {
  const query = text(req.query.query);
  const customers = await readData<RecordValue>("customers");
  res.json(customers.filter((customer) => !query || [customer.id, customer.name, customer.email, customer.plan].some((v) => text(v).includes(query))));
});
app.get("/customers/:id", getById("customers"));
app.get("/customers/:customerId/orders", async (req, res) => res.json((await readData<RecordValue>("orders")).filter((order) => order.customerId === req.params.customerId)));
app.get("/orders", async (req, res) => {
  const status = text(req.query.status);
  res.json((await readData<RecordValue>("orders")).filter((order) => !status || text(order.status) === status));
});
app.get("/orders/:id", getById("orders"));
app.get("/deployments", async (req, res) => {
  const { service, version, status } = req.query;
  res.json((await readData<RecordValue>("deployments")).filter((d) => (!service || d.service === service) && (!version || d.version === version) && (!status || d.status === status)));
});
app.get("/deployments/:id", getById("deployments"));
app.get("/incidents", async (req, res) => {
  const { service, severity, status } = req.query;
  res.json((await readData<RecordValue>("incidents")).filter((i) => (!service || i.service === service) && (!severity || i.severity === severity) && (!status || i.status === status)));
});
app.get("/incidents/:id", getById("incidents"));
app.post("/incidents", async (req, res) => {
  const { service, severity, title, description, assignedTo } = req.body ?? {};
  if (![service, severity, title, description].every((value) => typeof value === "string" && value.trim())) {
    return res.status(400).json({ error: "service, severity, title, and description are required strings" });
  }
  if (!["SEV-1", "SEV-2", "SEV-3", "SEV-4"].includes(severity)) return res.status(400).json({ error: "severity must be SEV-1 through SEV-4" });
  const incidents = await readData<RecordValue>("incidents");
  const next = Math.max(99, ...incidents.map((i) => Number(String(i.id).replace("INC-", "")) || 0)) + 1;
  const incident = { id: `INC-${next}`, service, severity, title, description, assignedTo: assignedTo || undefined, status: "open", createdAt: new Date().toISOString() };
  incidents.push(incident);
  await writeData("incidents", incidents);
  res.status(201).json(incident);
});
app.get("/engineers", async (req, res) => {
  const service = text(req.query.service);
  res.json((await readData<RecordValue>("engineers")).filter((engineer) => !service || ((engineer.services as string[]) ?? []).some((s) => s.toLowerCase() === service)));
});
app.get("/engineers/:id", getById("engineers"));

app.get("/", (_req, res) => res.type("html").send(`<!doctype html><title>AcmeShop MCP Demo</title><style>body{font:16px system-ui;margin:2rem;background:#101827;color:#e5e7eb}h1{color:#7dd3fc}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}.card{background:#1f2937;padding:1rem;border-radius:10px}.n{font-size:2rem;color:#86efac}</style><h1>AcmeShop · MCP demo data</h1><p>Refresh this page after an AI creates an incident to see the write reach the JSON-backed API.</p><div class=grid id=grid></div><script>Promise.all(['customers','orders','deployments','incidents'].map(async name=>[name,(await (await fetch('/'+name)).json()).length])).then(rows=>grid.innerHTML=rows.map(([name,count])=>'<div class=card><div>'+name+'</div><div class=n>'+count+'</div></div>').join(''))</script>`));

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
app.use((error: Error, _req: Request, res: Response, _next: unknown) => { console.error(error); res.status(500).json({ error: "Unexpected server error" }); });
app.listen(3000, () => console.log("AcmeShop mock API running at http://localhost:3000"));
