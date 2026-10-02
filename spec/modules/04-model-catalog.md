# M04 — Model, effort, and capability catalog

Status: proposed requirements derived from [SPEC.md](../SPEC.md). This module defines required catalog behavior; it does not assert that any particular model, effort, provider, or harness capability currently exists.

## Purpose and boundary

Provide a versioned YAML catalog organized by harness and provider so planner, competitor, and judge selections use explicit compatibility information. Availability and effort support depend on the installed harness version, provider, and account. Matching a model name is insufficient evidence that a configuration works. Allow configured cloud providers and local model endpoints only through harnesses that support them; a reachable endpoint alone does not establish harness compatibility. **[R010, R061]**

The catalog describes evidence available for a selection, while environment discovery and execution establish other readiness conditions. Discovery, offline fallback, unsupported settings, and authentication failures must remain distinguishable. Catalog presence must never be presented as successful authentication or guaranteed execution. **[R137]**

## Catalog information contract

Each entry identifies its model and display name, supported effort values, known default effort, relevant capabilities such as image input, and optional pricing. Include the metadata source, retrieval date, and applicable harness version. Unknown defaults, capabilities, or prices remain unknown; absence of metadata must not manufacture a value. Expose known support, explicit lack of support, and unknown information as different states. **[R062]**

Compatibility lookup receives the selected harness and installed version, provider or configured endpoint, account context, and model. Its result carries the applicable catalog information and its support status, rather than resolving solely by display name. Account context establishes the scope of availability information; entries discovered for one context must not become evidence of another account's access. Local endpoints receive the same compatibility treatment as cloud providers. **[R010, R061]**

Maintain three separate sources: a bundled baseline, a discovered cache, and user overrides. Resolve overlapping information in that precedence order, so discovered data supersedes the baseline and explicit overrides take priority. Preserve each source independently; refresh must not overwrite overrides. The resulting selection must retain enough provenance to show which source supplied its information. An override is user-supplied metadata, not evidence that authentication or effective settings were observed. **[R062, R064, R065, R137]**

## Discovery and resolution operations

On first launch, attempt automatic discovery through available harness/provider interfaces. Thereafter use cached catalog data, refreshing when the installed harness version changes or the user explicitly requests refresh. A refresh obtains information applicable to the discovered installation and provider/account context; it must not silently recast old version metadata as newly verified support. **[R061, R063]**

A failed refresh preserves the last valid catalog data and exposes the failure alongside the usable fallback. Offline operation may use cached or bundled entries, with source and age visible. If discovery supplies no information for a capability, preserve that uncertainty instead of inventing support. Refresh success for metadata does not certify account authentication or readiness for a model invocation. **[R062, R063, R137]**

Effort selection offers only values known to be supported for the chosen combination. When effort support is unknown, offer a harness-default option and instruct execution to omit an explicit effort argument. Do not guess a list from another model, provider, account, or harness version. A known catalog default is metadata; it is not proof of the effort an invocation actually used. **[R061, R062, R065]**

Keep requested model and effort settings separate from effective settings. Execution may populate effective settings only when the harness exposes them; otherwise mark them unverified or unknown. A failed invocation must not silently substitute a different model. A refresh or fallback must not turn a rejected request into an apparent successful run under another selection. **[R065]**

## Dependencies and failure behavior

[M03](03-environment-readiness.md) supplies installed harness/version and readiness observations. [M07](07-run-configuration.md) consumes compatibility results for setup and launch validation. [M05](05-harness-execution-isolation.md) applies supported endpoint/model selections, omission of unknown effort arguments, and requested/effective reporting. [M15](15-terminal-interface.md) and [M14](14-command-line-interface.md) expose metadata, refresh, and failure states consistently. These boundaries do not prescribe an internal architecture. **[R010, R061, R063, R065, R137]**

When no supported harness is installed, contribute an actionable error that prevents local planning and execution while preserving library browsing, import/export, and saved-result access. Cached models must not bypass that restriction. Explicitly unsupported settings, unknown support, discovery failure, offline fallback, and authentication failure require honest explanations rather than a generic ready indicator. **[R137]**

## Acceptance criteria

- A versioned YAML catalog distinguishes identical model names across harness/provider/account contexts and applicable installed versions, including supported local and cloud configurations. **[R010, R061]**
- Entry inspection exposes every required metadata item and represents known, unsupported, and unknown states without fabricated defaults or pricing. **[R062]**
- First launch attempts discovery; later launches use cache; version changes and manual requests refresh. Failed refresh preserves last-good data; offline fallback shows source and age. **[R063]**
- Overlapping baseline, cache, and override information resolves with overrides highest, and refresh leaves overrides intact. **[R064]**
- Unknown effort support offers harness-default and produces no explicit effort argument. Unsupported efforts are not offered, failures do not substitute models, and requested settings never masquerade as verified effective settings. **[R065]**
- Missing harnesses block local model work while retained-data operations remain accessible; authentication and metadata uncertainty remain visible independently. **[R137]**
