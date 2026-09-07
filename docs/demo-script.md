# AcmeShop presenter script

## Opening

Say: “An AI can reason, but it cannot see our systems by itself.” Ask without MCP: **Why did our checkout service have payment problems?** Point out that the answer is necessarily generic.

Connect AcmeShop MCP, then ask the exact same question. Expected behavior: the agent uses the independent incident, deployment, and customer/order tools. It should identify checkout version 3.2.1 at 14:30 UTC, the subsequent payment failures, and the retry-callback clue. Do not prescribe the tool sequence—the point is that the model chooses it.

## Demo 1 — Read-only investigation

Prompt: **Why did our checkout service have payment problems recently?**

Expected: inspect deployments, incidents, and failed orders; explain the likely relationship; do not create an incident.

## Demo 2 — Customer investigation

Prompt: **Sarah says she was charged twice. Investigate what happened and tell me whether she should be refunded.**

Expected: find Sarah (C001), get her orders, see the matching payment reference `pi_sarah_1` and diagnostic note, and recommend a refund review. The demo deliberately has no refund tool.

## Demo 3 — Agentic investigation

Prompt: **Our checkout service is having payment problems. Investigate what is happening, identify the likely root cause, find the engineer responsible, and create an incident if necessary.**

Expected: inspect historical incidents and recent deployment; investigate failed/Enterprise-customer impact; identify Alex Johnson (E-42), the Payments on-call owner; and create an assigned SEV-2 incident. If the connected client supports confirmation for tool calls, ask the presenter to approve the write. Refresh the dashboard to visibly confirm the incident count increased.

## Escalation sequence

Ask: **Who owns the checkout service?** Then: **What happened to our Enterprise customers?** Finally: **Create an incident summarizing the problem and assign it to the responsible engineer.**

Close with: “MCP is not the AI. It is the standardized bridge that lets an AI use data and take bounded actions.” Run `npm run reset` before repeating the demo.
