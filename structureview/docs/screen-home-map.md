# Screen & Navigation → Home Map

> Companion to `docs/design/ui-intensive-spec-map.md` (which maps _specs_ → design-system
> decisions). This maps every **prototype screen** and **nav item** to its owning product,
> so the fleet stops sharing one undifferentiated sidebar. Source screens:
> `roundhousehq-ui-experiment/src/pages`. Contribution to S69 / S46.

## Direction (agreed)

- **One design system.** The Electron app consumes `@trainyard/ui` exactly like the web
  enterprise app — no forked `flowtrain.css`, no divergent components.
- **Only the shell is desktop-specific.** Window chrome, native menu, file dialogs,
  packaging (`src/main`, preload, `ui/` Vite wrapper) stay Electron-only. Everything inside
  the shell is the shared web UI.
- **Primary rail + contextual sidebar.** A thin fleet rail (the products) plus a secondary
  sidebar whose contents change with the active product. A product's nav items live in _its_
  contextual sidebar, not in a shared global list.

## The fleet (products = primary rail)

| Locomotive    | Product                 | Route               | Source screen                           |
| ------------- | ----------------------- | ------------------- | --------------------------------------- |
| Roundhouse    | Hub / fleet shell (S38) | `/roundhouse`       | `Roundhouse.tsx`                        |
| **Structure** | **StructureView**       | `/structureview`    | `StructureView.tsx` (this app)          |
| Quality       | Quality Guardian        | `/quality-guardian` | `QualityGuardian.tsx` + most `ccqg/*`   |
| Ship          | Q2 Release              | `/q2-release`       | `Q2Release.tsx`                         |
| Certify       | Tier 4                  | `/tier4`            | `Tier4.tsx`                             |
| —             | Lemonade Bench (demo)   | `/lemonade-bench`   | `LemonadeBench.tsx` (demo-surface, S69) |
| —             | Auth shell              | `/`                 | `Login.tsx` (S58)                       |

## Screen → home

| Screen                                           | Home product            | Specs           | Disposition                                         |
| ------------------------------------------------ | ----------------------- | --------------- | --------------------------------------------------- |
| `Login.tsx`                                      | Auth shell              | S58             | product-candidate (Clerk)                           |
| `Roundhouse.tsx`                                 | Roundhouse hub          | S38, S46        | extract-pattern (owns top-level nav/shell)          |
| `StructureView.tsx`                              | **StructureView**       | S35, S63        | product-candidate (this app)                        |
| `QualityGuardian.tsx`                            | Quality Guardian        | S37, S41        | product-candidate                                   |
| `ccqg/CCQGGate.tsx`                              | Quality Guardian        | S61             | product-candidate                                   |
| `ccqg/CCQGReport.tsx`                            | Quality Guardian        | S37             | product-candidate                                   |
| `ccqg/CCQGMetrics.tsx`                           | Quality Guardian        | S49, S62        | product-candidate                                   |
| `ccqg/CCQGTrends.tsx`, `ccqg/QualityTrends.tsx`  | Quality Guardian        | S49             | product-candidate (consolidate — likely duplicates) |
| `ccqg/QualityOverview.tsx`                       | Quality Guardian        | S37             | product-candidate                                   |
| `ccqg/CCQGProviders.tsx`                         | Quality Guardian        | —               | product-candidate (AI provider config)              |
| `ccqg/AgentActivity.tsx`                         | Quality Guardian        | S50             | product-candidate                                   |
| `ccqg/DomainAgents.tsx`, `ccqg/DomainWizard.tsx` | Quality Guardian        | S63             | product-candidate                                   |
| `ccqg/NFR.tsx`                                   | Quality Guardian (Q4)   | S35 §3.9        | product-candidate                                   |
| `ccqg/Lifecycle.tsx`                             | Quality Guardian        | —               | product-candidate                                   |
| `ccqg/TradingDomain.tsx`                         | Quality Guardian        | S14             | product-candidate (domain example)                  |
| `ccqg/Compliance.tsx`                            | **Certify / Tier 4**    | S59, FINRA 4511 | product-candidate                                   |
| `ccqg/CICD.tsx`                                  | **Ship / Q2**           | S61             | product-candidate                                   |
| `ccqg/TestPlan.tsx`                              | **Ship / Q2**           | S40, S60        | product-candidate                                   |
| `ccqg/ExecSummary.tsx`                           | Ship + Certify (shared) | S26             | product-candidate (cross-product)                   |
| `LemonadeBench.tsx`                              | Demo / marketing        | —               | demo-surface                                        |

## Nav homing — fixes the scratched items

The current StructureView build shows one flat sidebar mixing four products. Correct homes:

**Stays in StructureView's contextual sidebar:**
Overview · Documents · EARS Analysis · Sections · BDD Generator · (Reports/Export → see below)

**Moves out** (shown only when that product is active):

| Scratched nav item      | Real home                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| TIMC Dashboard          | Quality Guardian (TIMC Phase 2 dashboard, S35 §3.5+) — not StructureView Lite             |
| Reports & Export        | Ship / Q2 (release reporting) or a shared export action — not a StructureView-only screen |
| Compliance Matrix       | Certify / Tier 4                                                                          |
| CI/CD Pipeline          | Ship / Q2                                                                                 |
| Test Plan               | Ship / Q2                                                                                 |
| Trading Domain          | Quality Guardian (domain agents)                                                          |
| Memory Store, MCP Tools | Platform-level (shell "Learnings"), not a product sidebar                                 |

So StructureView's sidebar collapses from ~15 items across 3 sections to **5 focused items**.
The rest reappear under their owning product when that product is selected on the primary rail.

## Open questions

1. **TIMC Dashboard ownership** — StructureView _Lite_ shows the inline TIMC Light panel
   (per-document). The full TIMC Phase 2 _Dashboard_ (cross-segment, S35 §3.5–3.10) is a
   Quality-pipeline surface → Quality Guardian. Confirm the split.
2. **Trends duplication** — `CCQGTrends` vs `QualityTrends` look like the same screen; pick one.
3. **ExecSummary** — shared by Ship and Certify; decide whether it's one shared component or
   two product views.
4. **Reports & Export** — confirm whether StructureView needs its own export, or consumes a
   shared platform export.
