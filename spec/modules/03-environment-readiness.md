# M03 — Environment discovery and readiness

Status: proposed module specification. This document defines required behavior, not implemented capabilities. It derives from [SPEC.md](../SPEC.md); requirement IDs identify the assigned source contracts.

## Purpose and scope

Engineers implementing this module must provide an honest, actionable account of the local prerequisites for planning, execution, verification, and optional measurement. Environment inspection must work on macOS and Linux. It must detect locally installed Claude Code, Codex, Grok CLI, and Pi without assuming that every detected installation is usable for every configuration. **[R005, R006]**

On opening the library, present the inventory benchmark as the default choice while exposing discovered harnesses, model information, authentication readiness, runtimes, browser support, and hardware collectors. Discovery supplies readiness information; choosing the template remains a library/TUI responsibility. **[R029]**

## Required readiness behavior

Report each prerequisite independently, including what was established and what remains unknown. Finding an executable does not establish authentication, model compatibility, supported effort settings, or successful headless operation. Authentication failures must appear as authentication failures; an inconclusive check must remain unknown. Unsupported settings must remain visibly unsupported rather than being silently substituted. Model discovery and offline catalog fallback follow [M04 — Model catalog](04-model-catalog.md), and harness readiness follows [M05 — Headless execution](05-harness-execution-isolation.md). **[R029, R137]**

Offline discovery must distinguish unavailable live information from known local findings and cached model information. Cached or bundled catalog entries retain M04's source and age information; they do not prove current account access. Likewise, inability to verify access while offline must not be presented as a confirmed authentication rejection. A readiness display must preserve these distinctions wherever users inspect the environment or choose configurations. **[R137]**

When no supported harness is installed, show an actionable error and prevent local planning and execution. This condition must leave library browsing, template and result ZIP import/export, saved-result access, and reporting from retained results available. Do not turn the absent execution prerequisite into an application-wide failure. When a harness is installed but a selected operation is unusable, communicate the specific prerequisite failure to launch validation rather than describe the installation as absent. **[R029, R137]**

Hardware readiness must distinguish missing tools, insufficient permissions, missing drivers or kernel interfaces, unsupported hardware, and collector failures. These are different causes with different possible remedies. An unavailable sensor or permission failure cannot prevent an otherwise valid benchmark; users can continue with unavailable metrics explicitly identified. Available measurements retain their actual scope through [M18 — Hardware monitoring](18-hardware-monitoring.md). **[R103, R146]**

The Environment view and doctor inspection must provide macOS/Linux installation or setup guidance appropriate to the detected condition, supporting documentation, and a recheck action. Guidance must not suggest that installing a tool resolves unsupported hardware. Collector-specific capability checks and verified platform guidance belong to M18; this module must surface their findings faithfully. Neither inspection nor recheck may automatically install tools or change system permissions. **[R103, R146]**

## Conceptual operation contracts

These contracts define observable inputs and outcomes without prescribing data structures, probe commands, or internal architecture.

| Operation | Input and required outcome |
|---|---|
| Inspect environment | Given the local macOS/Linux environment, report discovery findings for the four named harnesses and readiness findings for models, authentication, runtimes, browser support, and collectors. Include limitations instead of inferring availability. **[R005, R006, R029, R137]** |
| Assess an intended operation | Given the relevant template/configuration prerequisites and discovery findings, expose unmet requirements to the consuming module. Preserve the no-harness planning/execution block while keeping library, exchange, and retained-result functions available. Optional collector deficiencies remain nonblocking. **[R029, R137, R146]** |
| Explain an unavailable capability | Return the affected capability, established cause or unresolved uncertainty, effect on the intended operation, and actionable guidance. For collectors, preserve all five failure distinctions and supporting platform documentation. **[R103, R137]** |
| Recheck | Repeat the relevant readiness inspection after user-managed setup and display the resulting findings. A continuing or newly discovered failure remains explicit; requesting recheck is not permission to install software or change permissions. **[R103]** |

## Dependencies and handoffs

[M04](04-model-catalog.md) supplies model/effort capability and offline-fallback information; [M05](05-harness-execution-isolation.md) supplies supported harness and authentication outcomes; [M18](18-hardware-monitoring.md) supplies collector availability and metric scope. M03 combines their findings for presentation without strengthening unknown findings into verified capabilities. **[R029, R103, R137, R146]**

[M07 — Run configuration](07-run-configuration.md) consumes prerequisite findings for the selected launch. [M15 — TUI](15-terminal-interface.md) exposes the library/default-template and Environment experiences; [M14 — CLI](14-command-line-interface.md) exposes doctor. [M17 — ZIP exchange](17-zip-exchange.md) and [M13 — HTML report](13-standalone-html-report.md) remain reachable when no harness is installed. **[R029, R103, R137]**

## Acceptance criteria

- On both supported operating systems, inspection distinguishes installed and absent instances of all four harnesses and exposes runtime, browser, authentication, model, and collector findings. The library initially offers the inventory benchmark. **[R005, R006, R029]**
- With no supported harness, local planning/execution is blocked with corrective guidance, while library browsing, ZIP exchange, saved-result inspection, and saved-result reporting remain usable. **[R029, R137]**
- Offline, unsupported, authentication-failed, and unknown cases remain distinguishable; executable discovery alone cannot produce a verified authentication or model-support claim. **[R137]**
- Each collector failure category produces appropriate macOS/Linux guidance and documentation in Environment and doctor. Recheck reflects subsequent user changes without installing tools or changing permissions itself. **[R103]**
- Missing sensors, permissions, or collectors leave benchmarking available; unavailable metrics are labeled, and available metrics retain M18's measurement scope. **[R103, R146]**
