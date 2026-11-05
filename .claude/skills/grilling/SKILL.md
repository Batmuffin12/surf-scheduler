---
name: grilling
description: Interview the user relentlessly about a plan or design until every decision is settled. Invoked by /grill-me.
disable-model-invocation: true
---

# Grilling

Interview the user relentlessly about every aspect of the plan until you reach a shared understanding.

- Walk down each branch of the design tree, resolving dependencies between decisions one by one: settle a decision before asking about the ones that depend on it.
- Ask one question at a time. For each question, give your recommended answer and why.
- If a question can be answered by exploring the codebase or the docs in this repo (`APIS.md`, `docs/`), explore instead of asking.
- Keep a running list of decisions made. When no open branches remain, summarise every decision and suggest `/to-spec` as the next step.
