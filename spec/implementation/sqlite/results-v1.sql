-- AxBenchmark results database schema v1: normative proposed DDL, not a migration runner.
-- Empty database only; execute through M02 with foreign_keys already enabled.
-- SQLite >= 3.37.0. Engine validators named in RESULTS-DATABASE.md remain mandatory.
PRAGMA foreign_keys = ON;
BEGIN IMMEDIATE;
PRAGMA application_id = 1096303181; -- project-assigned AXBM application identity
PRAGMA user_version = 1;

CREATE TABLE schema_migration (
version INTEGER PRIMARY KEY, ddl_sha256 TEXT NOT NULL, applied_at TEXT NOT NULL
) STRICT;

CREATE TABLE publication (
publication_id INTEGER PRIMARY KEY AUTOINCREMENT,
transaction_id TEXT NOT NULL UNIQUE, intent_digest TEXT NOT NULL,
kind TEXT NOT NULL CHECK (kind IN ('append','import','analysis','annotation','migration','template','configuration','planner_approval')),
committed_at TEXT NOT NULL
) STRICT;

CREATE TABLE operation_receipt (
operation_id TEXT PRIMARY KEY, request_digest TEXT NOT NULL,
receipt_digest TEXT NOT NULL, result_ref TEXT, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE outbox_event (
event_id TEXT PRIMARY KEY, topic TEXT NOT NULL, object_id TEXT NOT NULL,
object_revision TEXT NOT NULL, event_kind TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE exact_value (
value_id TEXT PRIMARY KEY,
numerator TEXT NOT NULL CHECK(numerator='0' OR
(numerator GLOB '[1-9]*' AND numerator NOT GLOB '*[^0-9]*') OR
(numerator GLOB '-[1-9]*' AND substr(numerator,2) NOT GLOB '*[^0-9]*')), denominator TEXT NOT NULL CHECK (denominator GLOB '[1-9]*' AND denominator NOT GLOB '*[^0-9]*'),
UNIQUE(numerator, denominator)
) STRICT;

CREATE TABLE source_observation (
source_id TEXT PRIMARY KEY, source_kind TEXT NOT NULL,
safe_uri TEXT, source_revision TEXT, retrieved_at TEXT NOT NULL,
digest_algorithm TEXT, retained_digest TEXT, parser_id TEXT, parser_version TEXT,
evidence_pointer TEXT, redaction_reason TEXT, publication_id INTEGER NOT NULL REFERENCES publication(publication_id),
CHECK ((digest_algorithm IS NULL) = (retained_digest IS NULL))
) STRICT;

CREATE TABLE evidence_artifact (
artifact_id TEXT PRIMARY KEY, content_sha256 TEXT NOT NULL UNIQUE,
relative_path TEXT NOT NULL UNIQUE, media_type TEXT NOT NULL,
byte_count TEXT NOT NULL CHECK (byte_count IS NULL OR byte_count = '0' OR (byte_count GLOB '[1-9]*' AND byte_count NOT GLOB '*[^0-9]*')), evidence_kind TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id),
CHECK (relative_path NOT LIKE '/%' AND relative_path NOT LIKE '%..%' AND relative_path NOT LIKE '%\%')
) STRICT;

CREATE TABLE rubric_version (
rubric_ref TEXT PRIMARY KEY, profile_id TEXT NOT NULL, profile_version TEXT NOT NULL,
rubric_digest TEXT NOT NULL UNIQUE, family TEXT NOT NULL
CHECK (family IN ('web','backend','mobile','devops','agentic','specification'))
) STRICT;

CREATE TABLE rubric_category (
rubric_ref TEXT NOT NULL REFERENCES rubric_version(rubric_ref), category_key TEXT NOT NULL,
ordinal INTEGER NOT NULL CHECK (ordinal BETWEEN 1 AND 6), label TEXT NOT NULL,
default_weight TEXT NOT NULL REFERENCES exact_value(value_id), business_gate INTEGER NOT NULL CHECK (business_gate IN (0,1)),
PRIMARY KEY(rubric_ref, category_key), UNIQUE(rubric_ref, ordinal)
) STRICT;

CREATE TABLE rubric_criterion (
rubric_ref TEXT NOT NULL, category_key TEXT NOT NULL, criterion_key TEXT NOT NULL,
ordinal INTEGER NOT NULL CHECK (ordinal > 0), description TEXT NOT NULL, evidence_requirement TEXT NOT NULL,
PRIMARY KEY(rubric_ref, category_key, criterion_key),
FOREIGN KEY(rubric_ref, category_key) REFERENCES rubric_category(rubric_ref, category_key),
UNIQUE(rubric_ref, category_key, ordinal)
) STRICT;

CREATE TABLE rubric_anchor (
rubric_ref TEXT NOT NULL, category_key TEXT NOT NULL, criterion_key TEXT NOT NULL,
grade INTEGER NOT NULL CHECK (grade IN (1,3,5)), description TEXT NOT NULL,
PRIMARY KEY(rubric_ref,category_key,criterion_key,grade),
FOREIGN KEY(rubric_ref,category_key,criterion_key) REFERENCES rubric_criterion(rubric_ref,category_key,criterion_key)
) STRICT;

CREATE TABLE template_revision (
template_sha256 TEXT PRIMARY KEY, canonical_schema TEXT NOT NULL,
benchmark_type TEXT NOT NULL CHECK (benchmark_type IN ('one_shot','multi_step')),
project_type TEXT NOT NULL CHECK(project_type IN ('frontend','backend','fullstack','mobile','devops','agentic','specification')),
target_mode TEXT NOT NULL CHECK(target_mode IN ('from_scratch','modify')), task_commit_policy_ref TEXT,
rubric_ref TEXT NOT NULL REFERENCES rubric_version(rubric_ref), baseline_digest TEXT NOT NULL,
definition_artifact_id TEXT NOT NULL REFERENCES evidence_artifact(artifact_id), publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE template_task (
template_sha256 TEXT NOT NULL REFERENCES template_revision(template_sha256),
task_id TEXT NOT NULL, ordinal TEXT NOT NULL CHECK (ordinal GLOB '[1-9]*' AND ordinal NOT GLOB '*[^0-9]*'), prompt_artifact_id TEXT REFERENCES evidence_artifact(artifact_id),
PRIMARY KEY(template_sha256,task_id), UNIQUE(template_sha256,ordinal)
) STRICT;

CREATE TABLE machine_snapshot (
machine_snapshot_id TEXT PRIMARY KEY, machine_id TEXT NOT NULL, label TEXT NOT NULL,
snapshot_digest TEXT NOT NULL UNIQUE, os_name TEXT NOT NULL, os_version TEXT NOT NULL,
architecture TEXT NOT NULL, captured_at TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE machine_component (
machine_snapshot_id TEXT NOT NULL REFERENCES machine_snapshot(machine_snapshot_id),
component_id TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('cpu','gpu','memory','disk','other')),
manufacturer TEXT, model TEXT, unit_count TEXT CHECK (unit_count IS NULL OR unit_count = '0' OR (unit_count GLOB '[1-9]*' AND unit_count NOT GLOB '*[^0-9]*')), memory_bytes TEXT CHECK (memory_bytes IS NULL OR memory_bytes = '0' OR (memory_bytes GLOB '[1-9]*' AND memory_bytes NOT GLOB '*[^0-9]*')),
PRIMARY KEY(machine_snapshot_id,component_id)
) STRICT;

CREATE TABLE harness_release (
harness_release_id TEXT PRIMARY KEY, harness_id TEXT NOT NULL, version TEXT NOT NULL,
executable_digest TEXT, adapter_version TEXT NOT NULL,
UNIQUE(harness_id,version,executable_digest,adapter_version)
) STRICT;

CREATE TABLE model_checkpoint (
checkpoint_id TEXT PRIMARY KEY, source_namespace TEXT, repository_id TEXT,
requested_revision TEXT, resolved_revision TEXT, identity_state TEXT NOT NULL
CHECK(identity_state IN ('known','unknown','unavailable','conflicting')), identity_reason TEXT
) STRICT;

CREATE TABLE artifact_manifest (
manifest_id TEXT PRIMARY KEY, manifest_digest TEXT NOT NULL UNIQUE,
policy_version TEXT NOT NULL, completeness TEXT NOT NULL CHECK(completeness IN ('complete','partial','unknown')),
source_id TEXT REFERENCES source_observation(source_id)
) STRICT;

CREATE TABLE model_artifact_file (
manifest_id TEXT NOT NULL REFERENCES artifact_manifest(manifest_id), logical_path TEXT NOT NULL,
role TEXT NOT NULL, digest_algorithm TEXT NOT NULL, content_digest TEXT NOT NULL, byte_count TEXT NOT NULL CHECK (byte_count IS NULL OR byte_count = '0' OR (byte_count GLOB '[1-9]*' AND byte_count NOT GLOB '*[^0-9]*')),
PRIMARY KEY(manifest_id,logical_path)
) STRICT;

CREATE TABLE variant_snapshot (
variant_snapshot_id TEXT PRIMARY KEY, variant_id TEXT NOT NULL, descriptor_revision INTEGER NOT NULL CHECK(descriptor_revision>0),
descriptor_digest TEXT NOT NULL UNIQUE,
schema_version INTEGER NOT NULL CHECK(schema_version=1), normalization_version TEXT NOT NULL,
display_label TEXT NOT NULL, family_claim TEXT, execution_fingerprint TEXT,
fingerprint_state TEXT NOT NULL CHECK(fingerprint_state IN ('complete','partial','unknown','unavailable')),
root_completeness TEXT NOT NULL CHECK(root_completeness IN ('complete','partial','unknown')),
selected_manifest_id TEXT REFERENCES artifact_manifest(manifest_id),
adapter_state TEXT NOT NULL CHECK(adapter_state IN ('known_empty','known','unknown','unavailable')),
publication_id INTEGER NOT NULL REFERENCES publication(publication_id), UNIQUE(variant_id,descriptor_revision), CHECK(fingerprint_state <> 'complete' OR execution_fingerprint IS NOT NULL)
) STRICT;

CREATE TABLE lineage_node (
variant_snapshot_id TEXT NOT NULL REFERENCES variant_snapshot(variant_snapshot_id), node_id TEXT NOT NULL,
kind TEXT NOT NULL CHECK(kind IN ('base','fine_tune','adapter','merge','conversion','quantization','unknown')),
checkpoint_id TEXT REFERENCES model_checkpoint(checkpoint_id), output_manifest_id TEXT REFERENCES artifact_manifest(manifest_id),
operation_name TEXT, tool_name TEXT, tool_version TEXT, recipe_digest TEXT,
training_method TEXT, training_precision TEXT,
PRIMARY KEY(variant_snapshot_id,node_id)
) STRICT;

CREATE TABLE lineage_edge (
variant_snapshot_id TEXT NOT NULL, child_node_id TEXT NOT NULL, parent_ordinal INTEGER NOT NULL CHECK(parent_ordinal>0),
parent_node_id TEXT, unknown_parent_reason TEXT,
PRIMARY KEY(variant_snapshot_id,child_node_id,parent_ordinal),
FOREIGN KEY(variant_snapshot_id,child_node_id) REFERENCES lineage_node(variant_snapshot_id,node_id),
FOREIGN KEY(variant_snapshot_id,parent_node_id) REFERENCES lineage_node(variant_snapshot_id,node_id),
CHECK((parent_node_id IS NULL) <> (unknown_parent_reason IS NULL)), CHECK(child_node_id <> parent_node_id)
) STRICT;

CREATE TABLE variant_root (
variant_snapshot_id TEXT NOT NULL, node_id TEXT NOT NULL,
PRIMARY KEY(variant_snapshot_id,node_id),
FOREIGN KEY(variant_snapshot_id,node_id) REFERENCES lineage_node(variant_snapshot_id,node_id)
) STRICT;

CREATE TABLE variant_adapter (
variant_snapshot_id TEXT NOT NULL REFERENCES variant_snapshot(variant_snapshot_id), ordinal INTEGER NOT NULL CHECK(ordinal>0),
manifest_id TEXT NOT NULL REFERENCES artifact_manifest(manifest_id), scale_value TEXT NOT NULL REFERENCES exact_value(value_id),
application_mode TEXT NOT NULL, config_digest TEXT,
PRIMARY KEY(variant_snapshot_id,ordinal)
) STRICT;

CREATE TABLE quantization_claim (
variant_snapshot_id TEXT NOT NULL, node_id TEXT NOT NULL,
state TEXT NOT NULL CHECK(state IN ('known','unknown','unavailable','conflicting')),
weight_kind TEXT CHECK(weight_kind IN ('none','quantized')),
method_namespace TEXT, method_name TEXT, method_version TEXT, native_preset TEXT,
bit_value TEXT REFERENCES exact_value(value_id), group_size TEXT CHECK (group_size IS NULL OR group_size = '0' OR (group_size GLOB '[1-9]*' AND group_size NOT GLOB '*[^0-9]*')), format_name TEXT, format_version TEXT,
tensor_policy_digest TEXT, recipe_digest TEXT, coverage TEXT NOT NULL,
basis TEXT NOT NULL CHECK(basis IN ('observed','reported','user_declared')),
source_id TEXT REFERENCES source_observation(source_id), reason TEXT,
PRIMARY KEY(variant_snapshot_id,node_id),
FOREIGN KEY(variant_snapshot_id,node_id) REFERENCES lineage_node(variant_snapshot_id,node_id),
CHECK((state='known' AND weight_kind IS NOT NULL) OR (state<>'known' AND weight_kind IS NULL))
) STRICT;

CREATE TABLE precision_claim (
variant_snapshot_id TEXT NOT NULL, node_id TEXT NOT NULL,
facet TEXT NOT NULL CHECK(facet IN ('stored_weight','runtime_weight','compute','accumulator','kv_cache')),
state TEXT NOT NULL CHECK(state IN ('known','unknown','unavailable','conflicting')),
native_dtype TEXT, basis TEXT NOT NULL CHECK(basis IN ('observed','reported','user_declared')),
source_id TEXT REFERENCES source_observation(source_id), reason TEXT,
PRIMARY KEY(variant_snapshot_id,node_id,facet),
FOREIGN KEY(variant_snapshot_id,node_id) REFERENCES lineage_node(variant_snapshot_id,node_id),
CHECK((state='known' AND native_dtype IS NOT NULL) OR (state<>'known' AND native_dtype IS NULL))
) STRICT;

CREATE TABLE creator (
creator_id TEXT PRIMARY KEY, namespace TEXT NOT NULL, public_handle TEXT NOT NULL,
public_url TEXT, UNIQUE(namespace,public_handle)
) STRICT;

CREATE TABLE creator_claim (
creator_claim_id TEXT PRIMARY KEY, variant_snapshot_id TEXT NOT NULL, node_id TEXT NOT NULL,
role TEXT NOT NULL CHECK(role IN ('base_author','fine_tune_creator','trainer','quantizer','converter','distributor','uploader')),
state TEXT NOT NULL CHECK(state IN ('known','unknown','unavailable','conflicting')), reason TEXT,
FOREIGN KEY(variant_snapshot_id,node_id) REFERENCES lineage_node(variant_snapshot_id,node_id),
UNIQUE(variant_snapshot_id,node_id,role)
) STRICT;

CREATE TABLE creator_claim_value (
creator_claim_id TEXT NOT NULL REFERENCES creator_claim(creator_claim_id), value_ordinal INTEGER NOT NULL CHECK(value_ordinal>0),
creator_id TEXT NOT NULL REFERENCES creator(creator_id),
basis TEXT NOT NULL CHECK(basis IN ('observed','reported','user_declared')),
source_id TEXT NOT NULL REFERENCES source_observation(source_id),
PRIMARY KEY(creator_claim_id,value_ordinal)
) STRICT;

CREATE TABLE date_claim (
date_claim_id TEXT PRIMARY KEY, variant_snapshot_id TEXT NOT NULL, node_id TEXT NOT NULL,
kind TEXT NOT NULL CHECK(kind IN ('created','published','uploaded','observed')),
state TEXT NOT NULL CHECK(state IN ('known','unknown','unavailable','conflicting')), reason TEXT,
FOREIGN KEY(variant_snapshot_id,node_id) REFERENCES lineage_node(variant_snapshot_id,node_id),
UNIQUE(variant_snapshot_id,node_id,kind)
) STRICT;

CREATE TABLE date_claim_value (
date_claim_id TEXT NOT NULL REFERENCES date_claim(date_claim_id), value_ordinal INTEGER NOT NULL CHECK(value_ordinal>0),
raw_value TEXT NOT NULL, normalized_value TEXT NOT NULL,
precision TEXT NOT NULL CHECK(precision IN ('instant','day','month','year')), supplied_timezone TEXT,
basis TEXT NOT NULL CHECK(basis IN ('observed','reported','user_declared')),
source_id TEXT NOT NULL REFERENCES source_observation(source_id),
PRIMARY KEY(date_claim_id,value_ordinal)
) STRICT;

CREATE TABLE variant_annotation (
annotation_id TEXT PRIMARY KEY, operation_id TEXT NOT NULL UNIQUE REFERENCES operation_receipt(operation_id) DEFERRABLE INITIALLY DEFERRED,
prior_snapshot_id TEXT NOT NULL REFERENCES variant_snapshot(variant_snapshot_id),
kind TEXT NOT NULL CHECK(kind IN ('claim_correction','effective_observation','attribution_exclusion')),
subject_kind TEXT NOT NULL CHECK(subject_kind IN ('descriptor','result')), result_id TEXT REFERENCES retained_result(result_id),
replacement_snapshot_id TEXT REFERENCES variant_snapshot(variant_snapshot_id),
observation_id TEXT REFERENCES effective_variant_observation(observation_id), exclusion_id TEXT REFERENCES variant_exclusion(exclusion_id),
author_ref TEXT NOT NULL, evidence_artifact_id TEXT REFERENCES evidence_artifact(artifact_id),
reason TEXT NOT NULL, annotated_at TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id),
CHECK((subject_kind='result')=(result_id IS NOT NULL)),
CHECK((kind='claim_correction' AND replacement_snapshot_id IS NOT NULL AND observation_id IS NULL AND exclusion_id IS NULL)
OR (kind='effective_observation' AND replacement_snapshot_id IS NULL AND observation_id IS NOT NULL AND exclusion_id IS NULL AND result_id IS NOT NULL)
OR (kind='attribution_exclusion' AND replacement_snapshot_id IS NULL AND observation_id IS NULL AND exclusion_id IS NOT NULL AND result_id IS NOT NULL))
) STRICT;

CREATE TABLE judge_group (
judge_group_id TEXT PRIMARY KEY, group_digest TEXT NOT NULL UNIQUE,
backend TEXT NOT NULL CHECK(backend IN ('harness_review','decision_rubric','human_review')),
rubric_ref TEXT NOT NULL REFERENCES rubric_version(rubric_ref), policy_digest TEXT NOT NULL,
harness_release_id TEXT REFERENCES harness_release(harness_release_id),
model_checkpoint_id TEXT REFERENCES model_checkpoint(checkpoint_id),
variant_snapshot_id TEXT REFERENCES variant_snapshot(variant_snapshot_id),
requested_effort TEXT, effective_effort TEXT, decision_engine_ref TEXT, pack_ref TEXT,
reviewer_ref TEXT, reviewer_version TEXT, reviewer_digest TEXT,
form_policy_ref TEXT, form_policy_version TEXT, form_policy_digest TEXT,
decision_profile_version TEXT, decision_profile_digest TEXT,
-- M12 pins these selections before bindings/reviews; deferred reciprocal FKs close one publication.
selected_access_binding_id TEXT, selected_existing_agent_binding_id TEXT,
selected_effort_contract_id TEXT REFERENCES effort_contract(effort_contract_id),
FOREIGN KEY(selected_access_binding_id,judge_group_id)
REFERENCES configuration_access_binding(access_binding_id,judge_group_id) DEFERRABLE INITIALLY DEFERRED,
FOREIGN KEY(selected_existing_agent_binding_id,judge_group_id)
REFERENCES configuration_existing_agent_binding(binding_id,judge_group_id) DEFERRABLE INITIALLY DEFERRED,
CHECK(backend='harness_review' OR (selected_access_binding_id IS NULL AND selected_existing_agent_binding_id IS NULL AND selected_effort_contract_id IS NULL)),
CHECK(selected_access_binding_id IS NULL OR (selected_effort_contract_id IS NOT NULL AND model_checkpoint_id IS NOT NULL)),
CHECK((backend='human_review' AND reviewer_ref IS NOT NULL AND form_policy_ref IS NOT NULL
AND harness_release_id IS NULL AND model_checkpoint_id IS NULL AND variant_snapshot_id IS NULL
AND requested_effort IS NULL AND effective_effort IS NULL AND decision_engine_ref IS NULL AND pack_ref IS NULL)
OR (backend<>'human_review' AND reviewer_ref IS NULL AND reviewer_version IS NULL AND reviewer_digest IS NULL
AND form_policy_ref IS NULL AND form_policy_version IS NULL AND form_policy_digest IS NULL)),
CHECK(backend='decision_rubric' OR (decision_profile_version IS NULL AND decision_profile_digest IS NULL))
) STRICT;

CREATE TABLE benchmark_run (
run_uid TEXT PRIMARY KEY, run_label TEXT NOT NULL,
template_sha256 TEXT NOT NULL REFERENCES template_revision(template_sha256),
machine_snapshot_id TEXT NOT NULL REFERENCES machine_snapshot(machine_snapshot_id),
launch_digest TEXT NOT NULL, launched_at TEXT NOT NULL, origin_kind TEXT NOT NULL CHECK(origin_kind IN ('local','imported')),
original_judge_group_id TEXT NOT NULL REFERENCES judge_group(judge_group_id),
display_currency TEXT NOT NULL, currency_snapshot_digest TEXT NOT NULL, jobs TEXT NOT NULL CHECK (jobs GLOB '[1-9]*' AND jobs NOT GLOB '*[^0-9]*'), launch_schema_version TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE run_configuration (
run_uid TEXT NOT NULL REFERENCES benchmark_run(run_uid), configuration_id TEXT NOT NULL,
frozen_digest TEXT NOT NULL, display_label TEXT NOT NULL,
harness_release_id TEXT NOT NULL REFERENCES harness_release(harness_release_id),
model_checkpoint_id TEXT REFERENCES model_checkpoint(checkpoint_id),
requested_variant_snapshot_id TEXT REFERENCES variant_snapshot(variant_snapshot_id),
resolved_variant_snapshot_id TEXT REFERENCES variant_snapshot(variant_snapshot_id),
requested_effort TEXT, effective_effort TEXT, provider_ref TEXT, sanitized_account_ref TEXT,
environment_policy_digest TEXT NOT NULL, serving_controls_digest TEXT NOT NULL,
expected_trial_count TEXT NOT NULL CHECK (expected_trial_count GLOB '[1-9]*' AND expected_trial_count NOT GLOB '*[^0-9]*'), PRIMARY KEY(run_uid,configuration_id)
) STRICT;

CREATE TABLE expected_trial (
expected_trial_id TEXT PRIMARY KEY, run_uid TEXT NOT NULL, configuration_id TEXT NOT NULL,
trial_index TEXT NOT NULL CHECK (trial_index GLOB '[1-9]*' AND trial_index NOT GLOB '*[^0-9]*'), FOREIGN KEY(run_uid,configuration_id) REFERENCES run_configuration(run_uid,configuration_id),
UNIQUE(run_uid,configuration_id,trial_index)
) STRICT;

CREATE TABLE retained_result (
result_id TEXT PRIMARY KEY, expected_trial_id TEXT NOT NULL UNIQUE REFERENCES expected_trial(expected_trial_id),
started_at TEXT, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE result_seal (
result_id TEXT PRIMARY KEY REFERENCES retained_result(result_id), facts_digest TEXT NOT NULL,
finalization_receipt_digest TEXT NOT NULL, terminal_status TEXT NOT NULL,
sealed_at TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE result_evidence (
result_evidence_id TEXT PRIMARY KEY, result_id TEXT NOT NULL REFERENCES retained_result(result_id),
artifact_id TEXT NOT NULL REFERENCES evidence_artifact(artifact_id), task_id TEXT,
phase TEXT NOT NULL, logical_name TEXT NOT NULL, coverage TEXT NOT NULL,
publication_id INTEGER NOT NULL REFERENCES publication(publication_id), UNIQUE(result_id,phase,task_id,logical_name)
) STRICT;

CREATE TABLE task_attempt (
attempt_id TEXT PRIMARY KEY, result_id TEXT NOT NULL REFERENCES retained_result(result_id), task_id TEXT NOT NULL,
attempt_index TEXT NOT NULL CHECK (attempt_index GLOB '[1-9]*' AND attempt_index NOT GLOB '*[^0-9]*'), process_status TEXT NOT NULL, exit_code INTEGER,
started_at TEXT, finished_at TEXT, failure_reason TEXT, publication_id INTEGER NOT NULL REFERENCES publication(publication_id), UNIQUE(result_id,task_id,attempt_index)
) STRICT;

CREATE TABLE check_result (
check_result_id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL REFERENCES task_attempt(attempt_id),
check_key TEXT NOT NULL, outcome TEXT NOT NULL CHECK(outcome IN ('PASS','FAIL','UNVERIFIED')),
infrastructure_state TEXT NOT NULL CHECK(infrastructure_state IN ('available','missing_prerequisite','broken','unknown')),
origin TEXT NOT NULL CHECK(origin IN ('authored','protocol')), suite_schema TEXT NOT NULL CHECK(suite_schema IN ('acceptance.v1','acceptance.v2')),
reason TEXT, evidence_id TEXT REFERENCES result_evidence(result_evidence_id), publication_id INTEGER NOT NULL REFERENCES publication(publication_id), UNIQUE(attempt_id,check_key)
) STRICT;

CREATE TABLE task_commit (
attempt_id TEXT NOT NULL REFERENCES task_attempt(attempt_id), ordinal INTEGER NOT NULL CHECK(ordinal>0),
commit_oid TEXT NOT NULL, parent_oid TEXT, role TEXT NOT NULL CHECK(role IN ('competitor','baseline_setup')),
PRIMARY KEY(attempt_id,ordinal)
) STRICT;

-- M12 allocates this immutable scope before dispatch; it is not a committed Review.
CREATE TABLE judge_assessment (
assessment_id TEXT PRIMARY KEY, assessment_digest TEXT NOT NULL UNIQUE, result_id TEXT NOT NULL REFERENCES retained_result(result_id),
judge_group_id TEXT NOT NULL REFERENCES judge_group(judge_group_id),
purpose TEXT NOT NULL CHECK(purpose IN ('original','additional')),
reserved_review_id TEXT NOT NULL UNIQUE, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;
CREATE UNIQUE INDEX judge_assessment_one_original ON judge_assessment(result_id) WHERE purpose='original';

CREATE TABLE inference_call (
call_id TEXT PRIMARY KEY, result_id TEXT NOT NULL REFERENCES retained_result(result_id),
attempt_id TEXT REFERENCES task_attempt(attempt_id), review_id TEXT REFERENCES review(review_id) DEFERRABLE INITIALLY DEFERRED,
role TEXT NOT NULL CHECK(role IN ('competitor','judge','observer','verification')),
judge_assessment_id TEXT REFERENCES judge_assessment(assessment_id),
native_request_id TEXT, invocation_id TEXT, decision_call_id TEXT, evaluation_id TEXT,
request_identity_basis TEXT CHECK(request_identity_basis IN ('reported','adapter_synthetic')),
session_id TEXT, agent_id TEXT, parent_request_id TEXT, started_at TEXT, finished_at TEXT, status TEXT NOT NULL,
source_id TEXT REFERENCES source_observation(source_id), publication_id INTEGER NOT NULL REFERENCES publication(publication_id),
CHECK((role='judge')=(judge_assessment_id IS NOT NULL))
) STRICT;

CREATE TABLE call_counter (
call_id TEXT NOT NULL REFERENCES inference_call(call_id), counter_key TEXT NOT NULL,
kind TEXT NOT NULL CHECK(kind IN ('input','output','cached_input','reasoning','tool','other')),
token_count TEXT CHECK (token_count IS NULL OR token_count = '0' OR (token_count GLOB '[1-9]*' AND token_count NOT GLOB '*[^0-9]*')), coverage TEXT NOT NULL CHECK(coverage IN ('complete','partial','unknown','unavailable')),
reason TEXT, parent_counter_key TEXT, authority TEXT NOT NULL CHECK(authority IN ('native','tokenizer','estimated')),
PRIMARY KEY(call_id,counter_key), FOREIGN KEY(call_id,parent_counter_key) REFERENCES call_counter(call_id,counter_key),
CHECK((coverage IN ('complete','partial') AND token_count IS NOT NULL)
OR (coverage IN ('unknown','unavailable') AND token_count IS NULL))
) STRICT;

CREATE TABLE generation_interval (
call_id TEXT PRIMARY KEY REFERENCES inference_call(call_id),
paired_output_tokens TEXT CHECK (paired_output_tokens IS NULL OR paired_output_tokens = '0' OR (paired_output_tokens GLOB '[1-9]*' AND paired_output_tokens NOT GLOB '*[^0-9]*')), generation_seconds TEXT REFERENCES exact_value(value_id),
coverage TEXT NOT NULL CHECK(coverage IN ('complete','partial','unknown','unavailable')),
timing_basis TEXT NOT NULL, source_id TEXT REFERENCES source_observation(source_id), reason TEXT,
CHECK((coverage IN ('complete','partial') AND paired_output_tokens IS NOT NULL AND generation_seconds IS NOT NULL)
OR (coverage IN ('unknown','unavailable') AND paired_output_tokens IS NULL AND generation_seconds IS NULL))
) STRICT;

CREATE TABLE trial_measurement (
result_id TEXT PRIMARY KEY REFERENCES retained_result(result_id),
elapsed_seconds TEXT REFERENCES exact_value(value_id), elapsed_coverage TEXT NOT NULL CHECK(elapsed_coverage IN ('complete','partial','unknown','unavailable')),
input_tokens TEXT CHECK (input_tokens IS NULL OR input_tokens = '0' OR (input_tokens GLOB '[1-9]*' AND input_tokens NOT GLOB '*[^0-9]*')), input_coverage TEXT NOT NULL CHECK(input_coverage IN ('complete','partial','unknown','unavailable')),
output_tokens TEXT CHECK (output_tokens IS NULL OR output_tokens = '0' OR (output_tokens GLOB '[1-9]*' AND output_tokens NOT GLOB '*[^0-9]*')), output_coverage TEXT NOT NULL CHECK(output_coverage IN ('complete','partial','unknown','unavailable')),
file_count TEXT CHECK (file_count IS NULL OR file_count = '0' OR (file_count GLOB '[1-9]*' AND file_count NOT GLOB '*[^0-9]*')), loc_count TEXT CHECK (loc_count IS NULL OR loc_count = '0' OR (loc_count GLOB '[1-9]*' AND loc_count NOT GLOB '*[^0-9]*')), source_coverage TEXT NOT NULL CHECK(source_coverage IN ('complete','partial','unknown','unavailable')),
file_coverage TEXT NOT NULL CHECK(file_coverage IN ('complete','partial','unknown','unavailable')),
loc_coverage TEXT NOT NULL CHECK(loc_coverage IN ('complete','partial','unknown','unavailable')),
source_snapshot_digest TEXT, source_policy_digest TEXT,
measurement_policy_version TEXT NOT NULL, reason TEXT, publication_id INTEGER NOT NULL REFERENCES publication(publication_id),
CHECK((elapsed_coverage IN ('complete','partial'))=(elapsed_seconds IS NOT NULL)),
CHECK((input_coverage IN ('complete','partial'))=(input_tokens IS NOT NULL)),
CHECK((output_coverage IN ('complete','partial'))=(output_tokens IS NOT NULL)),
CHECK((file_coverage IN ('complete','partial'))=(file_count IS NOT NULL)),
CHECK((loc_coverage IN ('complete','partial'))=(loc_count IS NOT NULL))
) STRICT;

CREATE TABLE billing_snapshot (
billing_snapshot_id TEXT PRIMARY KEY, billing_kind TEXT NOT NULL, basis TEXT NOT NULL CHECK(basis IN ('native','user_declared')),
source_id TEXT REFERENCES source_observation(source_id), snapshot_digest TEXT NOT NULL UNIQUE
) STRICT;

CREATE TABLE price_snapshot (
price_snapshot_id TEXT PRIMARY KEY, catalog_subject_ref TEXT NOT NULL,
price_digest TEXT NOT NULL UNIQUE, source_id TEXT NOT NULL REFERENCES source_observation(source_id)
) STRICT;

CREATE TABLE price_rate (
price_snapshot_id TEXT NOT NULL REFERENCES price_snapshot(price_snapshot_id), rate_key TEXT NOT NULL,
currency TEXT NOT NULL, amount TEXT NOT NULL REFERENCES exact_value(value_id), unit_quantity TEXT NOT NULL CHECK (unit_quantity GLOB '[1-9]*' AND unit_quantity NOT GLOB '*[^0-9]*'), unit_name TEXT NOT NULL,
PRIMARY KEY(price_snapshot_id,rate_key)
) STRICT;

CREATE TABLE currency_rate (
run_uid TEXT NOT NULL REFERENCES benchmark_run(run_uid), currency TEXT NOT NULL,
per_usd TEXT REFERENCES exact_value(value_id), state TEXT NOT NULL CHECK(state IN ('known','missing')),
source_id TEXT REFERENCES source_observation(source_id), reason TEXT,
PRIMARY KEY(run_uid,currency), CHECK((state='known')=(per_usd IS NOT NULL))
) STRICT;

CREATE TABLE cost_observation (
cost_id TEXT PRIMARY KEY, result_id TEXT NOT NULL REFERENCES retained_result(result_id),
call_id TEXT REFERENCES inference_call(call_id), review_id TEXT REFERENCES review(review_id) DEFERRABLE INITIALLY DEFERRED,
role TEXT NOT NULL CHECK(role IN ('competitor','judge','observer','verification','human_lifecycle')),
basis TEXT NOT NULL CHECK(basis IN ('native_charge','api_equivalent','energy_estimate','subscription','unmeasured','not_applicable')),
amount TEXT REFERENCES exact_value(value_id), currency TEXT, coverage TEXT NOT NULL CHECK(coverage IN ('complete','partial','unknown','unavailable','not_applicable')),
billing_snapshot_id TEXT REFERENCES billing_snapshot(billing_snapshot_id),
price_snapshot_id TEXT REFERENCES price_snapshot(price_snapshot_id),
measurement_scope TEXT NOT NULL, source_id TEXT REFERENCES source_observation(source_id), reason TEXT, publication_id INTEGER NOT NULL REFERENCES publication(publication_id),
CHECK((amount IS NULL)=(currency IS NULL)),
CHECK((coverage IN ('complete','partial'))=(amount IS NOT NULL))
) STRICT;

CREATE TABLE cost_component (
cost_id TEXT NOT NULL REFERENCES cost_observation(cost_id), component_key TEXT NOT NULL,
quantity TEXT NOT NULL REFERENCES exact_value(value_id), price_snapshot_id TEXT, rate_key TEXT, amount TEXT NOT NULL REFERENCES exact_value(value_id),
PRIMARY KEY(cost_id,component_key), FOREIGN KEY(price_snapshot_id,rate_key) REFERENCES price_rate(price_snapshot_id,rate_key)
) STRICT;

CREATE TABLE hardware_series (
series_id TEXT PRIMARY KEY, run_uid TEXT NOT NULL REFERENCES benchmark_run(run_uid),
result_id TEXT REFERENCES retained_result(result_id), scope TEXT NOT NULL CHECK(scope IN ('host','trial')),
metric TEXT NOT NULL CHECK(metric IN ('cpu_utilization','gpu_utilization','memory_bytes','vram_bytes','power_watts','energy_joules','temperature_c')),
unit TEXT NOT NULL, device_ref TEXT, attribution TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id),
CHECK((scope='trial')=(result_id IS NOT NULL))
) STRICT;

CREATE TABLE hardware_sample (
series_id TEXT NOT NULL REFERENCES hardware_series(series_id), sample_index TEXT NOT NULL CHECK (sample_index GLOB '[1-9]*' AND sample_index NOT GLOB '*[^0-9]*'),
observed_at TEXT NOT NULL, value TEXT REFERENCES exact_value(value_id), coverage TEXT NOT NULL CHECK(coverage IN ('complete','partial','unknown','unavailable')),
reason TEXT, PRIMARY KEY(series_id,sample_index),
CHECK((coverage IN ('complete','partial'))=(value IS NOT NULL))
) STRICT;

CREATE TABLE context_capture (
capture_id TEXT PRIMARY KEY, result_id TEXT NOT NULL REFERENCES retained_result(result_id),
call_id TEXT REFERENCES inference_call(call_id), task_id TEXT, invocation_id TEXT,
session_id TEXT, agent_id TEXT, parent_agent_id TEXT, window_id TEXT, request_id TEXT, phase TEXT,
identity_basis TEXT CHECK(identity_basis IN ('native','adapter_synthetic')), source_digest TEXT,
capture_policy_digest TEXT NOT NULL,
stream_artifact_id TEXT REFERENCES evidence_artifact(artifact_id), closure_receipt_digest TEXT,
coverage TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE context_segment (
capture_id TEXT NOT NULL REFERENCES context_capture(capture_id), segment_id TEXT NOT NULL,
source_role TEXT NOT NULL, native_label TEXT CHECK(native_label IN ('system_input','user_input','thinking','thinking_summary','tool_definition','tool_call','tool_result','assistant_output','context_summary','protocol','unclassified')),
native_label_source_id TEXT REFERENCES source_observation(source_id),
native_label_policy_version TEXT CHECK(native_label_policy_version='context-labels/1'),
content_artifact_id TEXT REFERENCES evidence_artifact(artifact_id),
source_pointer TEXT NOT NULL, visibility TEXT NOT NULL CHECK(visibility IN ('visible','hidden','unknown')),
PRIMARY KEY(capture_id,segment_id)
) STRICT;

CREATE TABLE context_snapshot (
capture_id TEXT NOT NULL REFERENCES context_capture(capture_id), snapshot_id TEXT NOT NULL,
sequence_index TEXT NOT NULL CHECK (sequence_index GLOB '[1-9]*' AND sequence_index NOT GLOB '*[^0-9]*'), observed_at TEXT NOT NULL,
native_occupancy_tokens TEXT CHECK (native_occupancy_tokens IS NULL OR native_occupancy_tokens = '0' OR (native_occupancy_tokens GLOB '[1-9]*' AND native_occupancy_tokens NOT GLOB '*[^0-9]*')), native_capacity_tokens TEXT CHECK (native_capacity_tokens IS NULL OR native_capacity_tokens = '0' OR (native_capacity_tokens GLOB '[1-9]*' AND native_capacity_tokens NOT GLOB '*[^0-9]*')),
count_coverage TEXT NOT NULL, membership_state TEXT NOT NULL,
PRIMARY KEY(capture_id,snapshot_id), UNIQUE(capture_id,sequence_index)
) STRICT;

CREATE TABLE context_membership (
capture_id TEXT NOT NULL, snapshot_id TEXT NOT NULL, segment_id TEXT NOT NULL,
membership TEXT NOT NULL CHECK(membership IN ('present','absent','unknown')),
basis TEXT NOT NULL CHECK(basis IN ('native','reconstructed','unknown')),
PRIMARY KEY(capture_id,snapshot_id,segment_id),
FOREIGN KEY(capture_id,snapshot_id) REFERENCES context_snapshot(capture_id,snapshot_id),
FOREIGN KEY(capture_id,segment_id) REFERENCES context_segment(capture_id,segment_id)
) STRICT;

CREATE TABLE context_count (
capture_id TEXT NOT NULL, segment_id TEXT NOT NULL, count_kind TEXT NOT NULL CHECK(count_kind IN ('native','tokenizer','estimate')),
token_count TEXT CHECK (token_count IS NULL OR token_count = '0' OR (token_count GLOB '[1-9]*' AND token_count NOT GLOB '*[^0-9]*')), coverage TEXT NOT NULL CHECK(coverage IN ('complete','partial','unknown','unavailable')),
tokenizer_ref TEXT, reason TEXT, PRIMARY KEY(capture_id,segment_id,count_kind),
FOREIGN KEY(capture_id,segment_id) REFERENCES context_segment(capture_id,segment_id),
CHECK((coverage IN ('complete','partial'))=(token_count IS NOT NULL))
) STRICT;

CREATE TABLE context_gap (
capture_id TEXT NOT NULL REFERENCES context_capture(capture_id), gap_id TEXT NOT NULL,
start_pointer TEXT, end_pointer TEXT, reason TEXT NOT NULL, PRIMARY KEY(capture_id,gap_id)
) STRICT;

CREATE TABLE context_analysis (
context_analysis_id TEXT PRIMARY KEY, capture_id TEXT NOT NULL REFERENCES context_capture(capture_id),
analysis_id TEXT NOT NULL, through_entry_id TEXT, ledger_digest TEXT NOT NULL,
status TEXT NOT NULL CHECK(status IN ('pending','partial','complete','failed','cancelled')),
selection_artifact_id TEXT REFERENCES evidence_artifact(artifact_id),
decision_engine_ref TEXT NOT NULL, pack_digest TEXT NOT NULL, input_digest TEXT NOT NULL,
analysis_digest TEXT NOT NULL UNIQUE, publication_id INTEGER NOT NULL REFERENCES publication(publication_id), UNIQUE(context_analysis_id,capture_id)
) STRICT;

CREATE TABLE context_classification (
context_analysis_id TEXT NOT NULL, capture_id TEXT NOT NULL, segment_id TEXT NOT NULL,
category TEXT NOT NULL CHECK(category IN ('system_input','user_input','thinking','thinking_summary','tool_definition','tool_call','tool_result','assistant_output','context_summary','protocol','unclassified')),
label_policy_version TEXT NOT NULL CHECK(label_policy_version='context-labels/1'),
basis TEXT NOT NULL CHECK(basis IN ('model_classified','native')), rationale TEXT, confidence_label TEXT,
PRIMARY KEY(context_analysis_id,segment_id),
FOREIGN KEY(context_analysis_id,capture_id) REFERENCES context_analysis(context_analysis_id,capture_id),
FOREIGN KEY(capture_id,segment_id) REFERENCES context_segment(capture_id,segment_id)
) STRICT;

CREATE TABLE review (
review_id TEXT PRIMARY KEY, result_id TEXT NOT NULL REFERENCES retained_result(result_id),
judge_group_id TEXT NOT NULL REFERENCES judge_group(judge_group_id),
judge_assessment_id TEXT UNIQUE REFERENCES judge_assessment(assessment_id),
purpose TEXT NOT NULL CHECK(purpose IN ('original','additional')),
outcome TEXT NOT NULL CHECK(outcome IN ('graded','ungraded')),
provenance TEXT NOT NULL CHECK(provenance IN ('model_authored','code_composed_from_decisions','human_authored')),
review_digest TEXT NOT NULL UNIQUE, artifact_digest TEXT NOT NULL, scope_digest TEXT NOT NULL,
assessed_at TEXT NOT NULL, ungraded_reason TEXT, raw_response_artifact_id TEXT REFERENCES evidence_artifact(artifact_id),
publication_id INTEGER NOT NULL REFERENCES publication(publication_id), CHECK((outcome='ungraded')=(ungraded_reason IS NOT NULL))
) STRICT;

CREATE UNIQUE INDEX review_one_original ON review(result_id) WHERE purpose='original';

CREATE TABLE review_grade (
review_id TEXT NOT NULL REFERENCES review(review_id), category_key TEXT NOT NULL,
grade_half_units INTEGER NOT NULL CHECK(grade_half_units BETWEEN 2 AND 10), rationale TEXT NOT NULL,
PRIMARY KEY(review_id,category_key)
) STRICT;

CREATE TABLE review_comment (
review_id TEXT NOT NULL REFERENCES review(review_id), comment_key TEXT NOT NULL
CHECK(comment_key IN ('code_quality','usability','developer_experience','specification')), comment TEXT NOT NULL,
PRIMARY KEY(review_id,comment_key)
) STRICT;

CREATE TABLE review_evidence (
review_id TEXT NOT NULL, category_key TEXT NOT NULL, result_evidence_id TEXT NOT NULL REFERENCES result_evidence(result_evidence_id),
PRIMARY KEY(review_id,category_key,result_evidence_id),
FOREIGN KEY(review_id,category_key) REFERENCES review_grade(review_id,category_key)
) STRICT;

CREATE TABLE review_deficiency (
review_id TEXT NOT NULL REFERENCES review(review_id), ordinal INTEGER NOT NULL CHECK(ordinal>0),
code TEXT NOT NULL, category_key TEXT, detail TEXT NOT NULL, PRIMARY KEY(review_id,ordinal)
) STRICT;

CREATE TABLE review_limitation (
review_id TEXT NOT NULL REFERENCES review(review_id), ordinal INTEGER NOT NULL CHECK(ordinal>0),
limitation TEXT NOT NULL, PRIMARY KEY(review_id,ordinal)
) STRICT;

CREATE TABLE review_finalization (
review_id TEXT PRIMARY KEY REFERENCES review(review_id), validation_version TEXT NOT NULL,
validated_digest TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE original_disposition (
disposition_id TEXT PRIMARY KEY, result_id TEXT NOT NULL REFERENCES retained_result(result_id),
state TEXT NOT NULL CHECK(state IN ('pending','graded','ungraded','failed','not_judged')),
review_id TEXT REFERENCES review(review_id), reason TEXT, publication_id INTEGER NOT NULL REFERENCES publication(publication_id),
CHECK((state IN ('graded','ungraded'))=(review_id IS NOT NULL)),
CHECK(state NOT IN ('ungraded','failed','not_judged') OR reason IS NOT NULL)
) STRICT;

CREATE UNIQUE INDEX original_disposition_one_terminal ON original_disposition(result_id) WHERE state<>'pending';

CREATE TABLE run_invalidation (
invalidation_id TEXT PRIMARY KEY, run_uid TEXT NOT NULL REFERENCES benchmark_run(run_uid),
reason TEXT NOT NULL, evidence_artifact_id TEXT REFERENCES evidence_artifact(artifact_id), detected_at TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE effective_variant_observation (
observation_id TEXT PRIMARY KEY, result_id TEXT NOT NULL REFERENCES retained_result(result_id),
call_id TEXT REFERENCES inference_call(call_id), observed_snapshot_id TEXT REFERENCES variant_snapshot(variant_snapshot_id),
status TEXT NOT NULL CHECK(status IN ('confirmed','reported','declared','unverified','mismatch')),
invocation_id TEXT, request_id TEXT, interval_start TEXT, interval_end TEXT,
record_kind TEXT NOT NULL CHECK(record_kind IN ('source_fact','annotation')),
proof_scope TEXT NOT NULL, proof_digest TEXT, source_id TEXT REFERENCES source_observation(source_id),
limitation TEXT, observed_at TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE variant_exclusion (
exclusion_id TEXT PRIMARY KEY, result_id TEXT NOT NULL REFERENCES retained_result(result_id),
observation_id TEXT NOT NULL REFERENCES effective_variant_observation(observation_id), reason TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE resource_revision (
resource_kind TEXT NOT NULL, resource_id TEXT NOT NULL, revision_digest TEXT NOT NULL,
publication_id INTEGER NOT NULL REFERENCES publication(publication_id), PRIMARY KEY(resource_kind,resource_id,publication_id)
) STRICT;

CREATE TABLE analysis_snapshot (
analysis_id TEXT PRIMARY KEY, analysis_digest TEXT NOT NULL UNIQUE,
request_digest TEXT NOT NULL, input_digest TEXT NOT NULL, input_publication_id INTEGER NOT NULL REFERENCES publication(publication_id),
template_sha256 TEXT NOT NULL REFERENCES template_revision(template_sha256),
judge_group_id TEXT REFERENCES judge_group(judge_group_id),
algorithm_version TEXT NOT NULL, scoring_policy_digest TEXT NOT NULL, population_digest TEXT NOT NULL,
selection_digest TEXT NOT NULL, metadata_view TEXT NOT NULL CHECK(metadata_view IN ('as_recorded','with_annotations')),
variant_comparison_mode TEXT NOT NULL CHECK(variant_comparison_mode IN ('none','quantization','fine_tune_weights','fine_tune_package','joint','exploratory')),
cost_policy_digest TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('complete','pending','ineligible','failed')),
reason TEXT, created_at TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id), UNIQUE(request_digest,input_digest)
) STRICT;

CREATE TABLE analysis_dependency (
analysis_id TEXT NOT NULL REFERENCES analysis_snapshot(analysis_id), resource_kind TEXT NOT NULL,
resource_id TEXT NOT NULL, publication_id INTEGER NOT NULL,
PRIMARY KEY(analysis_id,resource_kind,resource_id),
FOREIGN KEY(resource_kind,resource_id,publication_id) REFERENCES resource_revision(resource_kind,resource_id,publication_id)
) STRICT;

CREATE TABLE analysis_factor (
analysis_id TEXT NOT NULL REFERENCES analysis_snapshot(analysis_id), factor TEXT NOT NULL
CHECK(factor IN ('cost','time','quality','generation_rate','input_tokens','output_tokens','file_count','loc')),
weight TEXT NOT NULL REFERENCES exact_value(value_id), direction TEXT CHECK(direction IN ('lower','higher')),
PRIMARY KEY(analysis_id,factor)
) STRICT;

CREATE TABLE analysis_category_weight (
analysis_id TEXT NOT NULL REFERENCES analysis_snapshot(analysis_id), category_key TEXT NOT NULL,
weight TEXT NOT NULL REFERENCES exact_value(value_id), PRIMARY KEY(analysis_id,category_key)
) STRICT;

CREATE TABLE analysis_subject (
analysis_subject_id TEXT PRIMARY KEY, analysis_id TEXT NOT NULL REFERENCES analysis_snapshot(analysis_id),
run_uid TEXT NOT NULL, configuration_id TEXT NOT NULL,
status TEXT NOT NULL CHECK(status IN ('eligible','pending','ineligible','failed')),
reason TEXT, comparison_tier TEXT NOT NULL CHECK(comparison_tier IN ('matched','claimed','unverified','exploratory','not_applicable')),
selected_variant_snapshot_id TEXT REFERENCES variant_snapshot(variant_snapshot_id),
FOREIGN KEY(run_uid,configuration_id) REFERENCES run_configuration(run_uid,configuration_id),
UNIQUE(analysis_id,run_uid,configuration_id)
) STRICT;

CREATE TABLE analysis_trial (
analysis_subject_id TEXT NOT NULL REFERENCES analysis_subject(analysis_subject_id),
expected_trial_id TEXT NOT NULL REFERENCES expected_trial(expected_trial_id),
result_id TEXT REFERENCES retained_result(result_id), selected_review_id TEXT REFERENCES review(review_id),
state TEXT NOT NULL CHECK(state IN ('retained','not_retained','pending','excluded')),
reason TEXT, PRIMARY KEY(analysis_subject_id,expected_trial_id),
CHECK(state NOT IN ('retained','excluded') OR result_id IS NOT NULL),
CHECK(result_id IS NOT NULL OR selected_review_id IS NULL)
) STRICT;

CREATE TABLE analysis_score (
analysis_subject_id TEXT PRIMARY KEY REFERENCES analysis_subject(analysis_subject_id),
quality TEXT REFERENCES exact_value(value_id), combined TEXT REFERENCES exact_value(value_id),
CHECK(quality IS NOT NULL OR combined IS NOT NULL)
) STRICT;

CREATE TABLE analysis_component (
analysis_subject_id TEXT NOT NULL REFERENCES analysis_subject(analysis_subject_id), factor TEXT NOT NULL,
raw_value TEXT REFERENCES exact_value(value_id), normalized_value TEXT REFERENCES exact_value(value_id), weighted_contribution TEXT REFERENCES exact_value(value_id),
coverage TEXT NOT NULL CHECK(coverage IN ('complete','partial','unknown','unavailable','not_applicable')),
reason TEXT, PRIMARY KEY(analysis_subject_id,factor)
) STRICT;

CREATE TABLE analysis_cost_projection (
analysis_subject_id TEXT NOT NULL REFERENCES analysis_subject(analysis_subject_id), currency TEXT NOT NULL,
amount TEXT REFERENCES exact_value(value_id), basis TEXT NOT NULL, coverage TEXT NOT NULL,
PRIMARY KEY(analysis_subject_id,currency,basis)
) STRICT;

CREATE TABLE run_factor_weight (
run_uid TEXT NOT NULL REFERENCES benchmark_run(run_uid), factor TEXT NOT NULL
CHECK(factor IN ('cost','time','quality','generation_rate','input_tokens','output_tokens','file_count','loc')),
weight TEXT NOT NULL REFERENCES exact_value(value_id), direction TEXT CHECK(direction IN ('lower','higher')), PRIMARY KEY(run_uid,factor)
) STRICT;

CREATE TABLE run_category_weight (
run_uid TEXT NOT NULL REFERENCES benchmark_run(run_uid), category_key TEXT NOT NULL,
weight TEXT NOT NULL REFERENCES exact_value(value_id), PRIMARY KEY(run_uid,category_key)
) STRICT;

CREATE TABLE run_retention (
run_uid TEXT PRIMARY KEY REFERENCES benchmark_run(run_uid), terminal_cause TEXT NOT NULL,
roster_digest TEXT NOT NULL, settlement_digest TEXT NOT NULL, retention_digest TEXT NOT NULL,
observed_end_at TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE additional_disposition (
disposition_id TEXT PRIMARY KEY, result_id TEXT NOT NULL REFERENCES retained_result(result_id),
judge_group_id TEXT NOT NULL REFERENCES judge_group(judge_group_id), assessment_id TEXT NOT NULL UNIQUE,
state TEXT NOT NULL CHECK(state IN ('graded','ungraded','failed','not_judged')),
review_id TEXT REFERENCES review(review_id), reason TEXT, publication_id INTEGER NOT NULL REFERENCES publication(publication_id),
CHECK((state IN ('graded','ungraded'))=(review_id IS NOT NULL)),
CHECK(state='graded' OR reason IS NOT NULL)
) STRICT;

CREATE TABLE analysis_trial_score (
analysis_subject_id TEXT NOT NULL, expected_trial_id TEXT NOT NULL,
quality TEXT NOT NULL REFERENCES exact_value(value_id), PRIMARY KEY(analysis_subject_id,expected_trial_id),
FOREIGN KEY(analysis_subject_id,expected_trial_id) REFERENCES analysis_trial(analysis_subject_id,expected_trial_id)
) STRICT;

CREATE TABLE analysis_finalization (
analysis_id TEXT PRIMARY KEY REFERENCES analysis_snapshot(analysis_id),
validation_version TEXT NOT NULL, validated_digest TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE configuration_control (
run_uid TEXT NOT NULL, configuration_id TEXT NOT NULL,
control_key TEXT NOT NULL CHECK(control_key IN ('environment_mode','network_policy','tool_policy','serving_software','serving_version','serving_config_ref','tokenizer_digest','chat_template_digest','context_limit','max_output_tokens','temperature','top_p','top_k','seed','batch_size','compute_dtype','kv_cache_dtype','resource_allocation_ref','concurrency')),
state TEXT NOT NULL CHECK(state IN ('known','unknown','unavailable','not_applicable')),
text_value TEXT, numeric_value TEXT REFERENCES exact_value(value_id), source_id TEXT REFERENCES source_observation(source_id), reason TEXT,
PRIMARY KEY(run_uid,configuration_id,control_key),
FOREIGN KEY(run_uid,configuration_id) REFERENCES run_configuration(run_uid,configuration_id),
CHECK((state='known' AND ((text_value IS NULL)<>(numeric_value IS NULL)))
OR (state<>'known' AND text_value IS NULL AND numeric_value IS NULL AND reason IS NOT NULL))
) STRICT;

CREATE TABLE source_file_inventory (
result_id TEXT NOT NULL REFERENCES retained_result(result_id), relative_path TEXT NOT NULL,
entry_kind TEXT NOT NULL, content_digest TEXT, byte_count TEXT CHECK (byte_count IS NULL OR byte_count = '0' OR (byte_count GLOB '[1-9]*' AND byte_count NOT GLOB '*[^0-9]*')),
file_inclusion TEXT NOT NULL CHECK(file_inclusion IN ('included','excluded','unknown')),
text_classification TEXT NOT NULL CHECK(text_classification IN ('text','binary','unknown')),
encoding TEXT, physical_lines TEXT CHECK (physical_lines IS NULL OR physical_lines = '0' OR (physical_lines GLOB '[1-9]*' AND physical_lines NOT GLOB '*[^0-9]*')), reason TEXT,
PRIMARY KEY(result_id,relative_path)
) STRICT;

CREATE TABLE analysis_ranking (
analysis_subject_id TEXT NOT NULL REFERENCES analysis_subject(analysis_subject_id),
ranking_kind TEXT NOT NULL CHECK(ranking_kind IN ('combined','cost','time','quality','generation_rate','input_tokens','output_tokens','file_count','loc')),
official_rank TEXT NOT NULL CHECK (official_rank GLOB '[1-9]*' AND official_rank NOT GLOB '*[^0-9]*'), tie_key TEXT NOT NULL, PRIMARY KEY(analysis_subject_id,ranking_kind)
) STRICT;

CREATE TABLE analysis_exclusion (
analysis_subject_id TEXT NOT NULL REFERENCES analysis_subject(analysis_subject_id), ordinal INTEGER NOT NULL CHECK(ordinal>0),
code TEXT NOT NULL, factor TEXT, expected_trial_id TEXT REFERENCES expected_trial(expected_trial_id),
field_path TEXT, detail TEXT NOT NULL, PRIMARY KEY(analysis_subject_id,ordinal)
) STRICT;

-- R192-R193: sanitized immutable launch/access snapshots, never editable catalog state.
CREATE TABLE access_evidence_set (
evidence_set_id TEXT PRIMARY KEY, evidence_digest TEXT NOT NULL UNIQUE,
publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;
CREATE TABLE access_evidence_item (
evidence_set_id TEXT NOT NULL REFERENCES access_evidence_set(evidence_set_id), ordinal INTEGER NOT NULL CHECK(ordinal>0),
source_id TEXT REFERENCES source_observation(source_id), artifact_id TEXT REFERENCES evidence_artifact(artifact_id),
pointer TEXT, PRIMARY KEY(evidence_set_id,ordinal), CHECK(source_id IS NOT NULL OR artifact_id IS NOT NULL)
) STRICT;
CREATE TABLE access_evidence_seal (
evidence_set_id TEXT PRIMARY KEY REFERENCES access_evidence_set(evidence_set_id), validated_digest TEXT NOT NULL
) STRICT;
CREATE TABLE api_access_profile (
profile_snapshot_id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, version INTEGER NOT NULL CHECK(version>0),
profile_digest TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL,
kind TEXT NOT NULL CHECK(kind IN ('direct_provider','openrouter','litellm')),
public_account_ref TEXT, routing_policy_digest TEXT NOT NULL, gateway_version TEXT, gateway_config_digest TEXT,
gateway_locality TEXT NOT NULL CHECK(gateway_locality IN ('local','remote','mixed','unknown')),
inference_locality TEXT NOT NULL CHECK(inference_locality IN ('local','remote','mixed','unknown')),
locality_reason TEXT, evidence_set_id TEXT NOT NULL REFERENCES access_evidence_seal(evidence_set_id),
created_at TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id), UNIQUE(profile_id,version),
CHECK((gateway_locality<>'unknown' AND inference_locality<>'unknown') OR locality_reason IS NOT NULL)
) STRICT;
CREATE TABLE api_access_role (
profile_snapshot_id TEXT NOT NULL REFERENCES api_access_profile(profile_snapshot_id),
role TEXT NOT NULL CHECK(role IN ('competitor','planner','harness_judge')), PRIMARY KEY(profile_snapshot_id,role)
) STRICT;
CREATE TABLE api_route_hop (
profile_snapshot_id TEXT NOT NULL REFERENCES api_access_profile(profile_snapshot_id), ordinal INTEGER NOT NULL CHECK(ordinal>0),
kind TEXT NOT NULL CHECK(kind IN ('direct_provider','openrouter','litellm')), endpoint_origin TEXT NOT NULL, endpoint_path TEXT NOT NULL,
input_protocol TEXT NOT NULL, output_protocol TEXT NOT NULL, dialect_version TEXT,
provider_id TEXT, deployment_id TEXT, region TEXT, tier TEXT,
upstream_state TEXT NOT NULL CHECK(upstream_state IN ('confirmed','declared','unverified','unknown')), upstream_reason TEXT,
translation_version TEXT, config_digest TEXT, gateway_locality TEXT NOT NULL CHECK(gateway_locality IN ('local','remote','mixed','unknown')),
inference_locality TEXT NOT NULL CHECK(inference_locality IN ('local','remote','mixed','unknown')),
evidence_set_id TEXT NOT NULL REFERENCES access_evidence_seal(evidence_set_id), PRIMARY KEY(profile_snapshot_id,ordinal),
CHECK(upstream_state<>'unknown' OR upstream_reason IS NOT NULL)
) STRICT;
CREATE TABLE api_access_profile_seal (
profile_snapshot_id TEXT PRIMARY KEY REFERENCES api_access_profile(profile_snapshot_id), validated_digest TEXT NOT NULL
) STRICT;
CREATE TABLE access_model_binding (
model_binding_id TEXT PRIMARY KEY, binding_digest TEXT NOT NULL UNIQUE,
profile_snapshot_id TEXT NOT NULL REFERENCES api_access_profile_seal(profile_snapshot_id), harness_selectable_id TEXT NOT NULL,
gateway_alias TEXT, canonical_upstream_model_id TEXT, upstream_revision TEXT,
checkpoint_id TEXT REFERENCES model_checkpoint(checkpoint_id), variant_snapshot_id TEXT REFERENCES variant_snapshot(variant_snapshot_id),
provider_id TEXT, deployment_id TEXT, binding_status TEXT NOT NULL CHECK(binding_status IN ('confirmed','declared','unverified','mismatch')),
reason TEXT, observed_at TEXT NOT NULL, evidence_set_id TEXT NOT NULL REFERENCES access_evidence_seal(evidence_set_id),
publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;
CREATE TABLE effort_contract (
effort_contract_id TEXT PRIMARY KEY, contract_id TEXT NOT NULL, version INTEGER NOT NULL CHECK(version>0),
contract_digest TEXT NOT NULL UNIQUE, checkpoint_id TEXT NOT NULL REFERENCES model_checkpoint(checkpoint_id),
variant_snapshot_id TEXT REFERENCES variant_snapshot(variant_snapshot_id), semantic_owner TEXT NOT NULL, semantic_version TEXT NOT NULL,
kind TEXT NOT NULL CHECK(kind IN ('native_level','reasoning_budget','disabled')), native_level TEXT,
budget_tokens TEXT CHECK(budget_tokens GLOB '[1-9]*' AND budget_tokens NOT GLOB '*[^0-9]*'),
reasoning_mode TEXT NOT NULL, output_limit_tokens TEXT CHECK(output_limit_tokens GLOB '[1-9]*' AND output_limit_tokens NOT GLOB '*[^0-9]*'),
output_limit_state TEXT NOT NULL CHECK(output_limit_state IN ('known','unknown','not_applicable')), output_limit_reason TEXT,
evidence_set_id TEXT NOT NULL REFERENCES access_evidence_seal(evidence_set_id), publication_id INTEGER NOT NULL REFERENCES publication(publication_id),
UNIQUE(contract_id,version), CHECK((kind='native_level' AND native_level IS NOT NULL AND budget_tokens IS NULL)
OR (kind='reasoning_budget' AND native_level IS NULL AND budget_tokens IS NOT NULL)
OR (kind='disabled' AND native_level IS NULL AND budget_tokens IS NULL)),
CHECK((output_limit_state='known')=(output_limit_tokens IS NOT NULL)),
CHECK(output_limit_state='known' OR output_limit_reason IS NOT NULL)
) STRICT;
CREATE TABLE harness_effort_mapping (
effort_mapping_id TEXT PRIMARY KEY, mapping_digest TEXT NOT NULL UNIQUE,
harness_release_id TEXT NOT NULL REFERENCES harness_release(harness_release_id), distribution_id TEXT NOT NULL,
model_binding_id TEXT NOT NULL REFERENCES access_model_binding(model_binding_id),
effort_contract_id TEXT NOT NULL REFERENCES effort_contract(effort_contract_id),
translation_semantics TEXT NOT NULL, support_status TEXT NOT NULL CHECK(support_status IN ('exact','approximate','unsupported','unverified')),
evidence_set_id TEXT NOT NULL REFERENCES access_evidence_seal(evidence_set_id), publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;
CREATE TABLE harness_effort_setting (
effort_mapping_id TEXT NOT NULL REFERENCES harness_effort_mapping(effort_mapping_id), ordinal INTEGER NOT NULL CHECK(ordinal>0),
stage TEXT NOT NULL CHECK(stage IN ('launch','upstream')), setting_name TEXT NOT NULL,
text_value TEXT, numeric_value TEXT REFERENCES exact_value(value_id),
PRIMARY KEY(effort_mapping_id,ordinal), UNIQUE(effort_mapping_id,stage,setting_name),
CHECK((text_value IS NULL)<>(numeric_value IS NULL))
) STRICT;
CREATE TABLE harness_effort_mapping_seal (
effort_mapping_id TEXT PRIMARY KEY REFERENCES harness_effort_mapping(effort_mapping_id), validated_digest TEXT NOT NULL
) STRICT;
CREATE TABLE harness_route_capability (
capability_id TEXT PRIMARY KEY, capability_digest TEXT NOT NULL UNIQUE,
effort_mapping_id TEXT NOT NULL REFERENCES harness_effort_mapping_seal(effort_mapping_id), platform TEXT NOT NULL,
gateway_version TEXT, gateway_config_digest TEXT, protocol TEXT NOT NULL,
documented_support TEXT NOT NULL CHECK(documented_support IN ('supported','experimental','unsupported','unverified')),
installed_conformance TEXT NOT NULL CHECK(installed_conformance IN ('passed','failed','unverified')),
tool_state TEXT NOT NULL, stream_state TEXT NOT NULL, effort_state TEXT NOT NULL, route_state TEXT NOT NULL,
evidence_set_id TEXT NOT NULL REFERENCES access_evidence_seal(evidence_set_id), publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;
CREATE TABLE harness_capability_limitation (
capability_id TEXT NOT NULL REFERENCES harness_route_capability(capability_id), ordinal INTEGER NOT NULL CHECK(ordinal>0),
code TEXT NOT NULL, detail TEXT NOT NULL, PRIMARY KEY(capability_id,ordinal)
) STRICT;
CREATE TABLE harness_route_capability_seal (
capability_id TEXT PRIMARY KEY REFERENCES harness_route_capability(capability_id), validated_digest TEXT NOT NULL
) STRICT;
-- Qualification is an M03 diagnostic, not a manufactured benchmark result/call.
CREATE TABLE route_qualification (
qualification_id TEXT PRIMARY KEY, diagnostic_job_id TEXT NOT NULL UNIQUE, outcome_digest TEXT NOT NULL UNIQUE,
capability_id TEXT NOT NULL REFERENCES harness_route_capability_seal(capability_id), plan_digest TEXT NOT NULL,
fixture_ref TEXT NOT NULL, consent_ref TEXT NOT NULL,
model_request_budget TEXT NOT NULL CHECK(model_request_budget GLOB '[1-9]*' AND model_request_budget NOT GLOB '*[^0-9]*'),
upstream_attempt_budget TEXT CHECK(upstream_attempt_budget GLOB '[1-9]*' AND upstream_attempt_budget NOT GLOB '*[^0-9]*'),
output_token_budget TEXT NOT NULL CHECK(output_token_budget GLOB '[1-9]*' AND output_token_budget NOT GLOB '*[^0-9]*'),
time_budget_seconds TEXT NOT NULL REFERENCES exact_value(value_id), money_cap TEXT REFERENCES exact_value(value_id), currency TEXT,
execution_state TEXT NOT NULL CHECK(execution_state IN ('passed','failed','cancelled','unverified')),
tool_state TEXT NOT NULL, stream_state TEXT NOT NULL, model_state TEXT NOT NULL, effort_state TEXT NOT NULL, route_state TEXT NOT NULL,
attempt_coverage TEXT NOT NULL CHECK(attempt_coverage IN ('complete','partial','unknown')), coverage_reason TEXT,
verification_accounting_ref TEXT NOT NULL, settlement_receipt_digest TEXT NOT NULL,
evidence_set_id TEXT NOT NULL REFERENCES access_evidence_seal(evidence_set_id), completed_at TEXT NOT NULL,
publication_id INTEGER NOT NULL REFERENCES publication(publication_id), CHECK((money_cap IS NULL)=(currency IS NULL)),
CHECK(attempt_coverage='complete' OR coverage_reason IS NOT NULL)
) STRICT;
CREATE TABLE harness_registry_member (
registry_digest TEXT NOT NULL, harness_id TEXT NOT NULL, ordinal INTEGER NOT NULL,
PRIMARY KEY(registry_digest,harness_id), UNIQUE(registry_digest,ordinal),
CHECK((harness_id='claude_code' AND ordinal=1) OR (harness_id='codex' AND ordinal=2)
OR (harness_id='grok_cli' AND ordinal=3) OR (harness_id='pi' AND ordinal=4)
OR (harness_id='cursor_cli' AND ordinal=5) OR (harness_id='opencode' AND ordinal=6))
) STRICT;
CREATE TABLE harness_comparison (
comparison_id TEXT PRIMARY KEY, comparison_digest TEXT NOT NULL UNIQUE, run_uid TEXT NOT NULL UNIQUE REFERENCES benchmark_run(run_uid),
preview_digest TEXT NOT NULL, registry_digest TEXT NOT NULL, model_binding_id TEXT NOT NULL REFERENCES access_model_binding(model_binding_id),
effort_contract_id TEXT NOT NULL REFERENCES effort_contract(effort_contract_id),
mode TEXT NOT NULL CHECK(mode IN ('strict','exploratory')), inference_scope TEXT NOT NULL CHECK(inference_scope IN ('all_competitor_inference','primary_model_only')),
trials TEXT NOT NULL CHECK(trials GLOB '[1-9]*' AND trials NOT GLOB '*[^0-9]*'),
common_control_digest TEXT NOT NULL, policy_digest TEXT NOT NULL,
coverage TEXT NOT NULL CHECK(coverage IN ('all_registry','subset')), fail_closed_policy_ref TEXT NOT NULL,
publication_id INTEGER NOT NULL REFERENCES publication(publication_id), CHECK(mode='exploratory' OR inference_scope='all_competitor_inference')
) STRICT;
CREATE TABLE harness_comparison_control (
comparison_id TEXT NOT NULL REFERENCES harness_comparison(comparison_id),
control_key TEXT NOT NULL CHECK(control_key IN ('upstream_deployment','upstream_region','upstream_tier','route_policy','reasoning_mode','reasoning_budget_tokens','max_output_tokens','temperature','top_p','top_k','seed','context_limit','environment_policy','machine_snapshot','concurrency','resource_policy','timeout_seconds','verification_policy','grading_policy','weights_policy')),
state TEXT NOT NULL CHECK(state IN ('known','unknown','unavailable','not_applicable')), text_value TEXT,
numeric_value TEXT REFERENCES exact_value(value_id), reason TEXT, evidence_set_id TEXT REFERENCES access_evidence_seal(evidence_set_id),
PRIMARY KEY(comparison_id,control_key), CHECK((state='known' AND ((text_value IS NULL)<>(numeric_value IS NULL)))
OR (state<>'known' AND text_value IS NULL AND numeric_value IS NULL AND reason IS NOT NULL))
) STRICT;
CREATE TABLE configuration_access_binding (
access_binding_id TEXT PRIMARY KEY, run_uid TEXT, configuration_id TEXT,
judge_group_id TEXT UNIQUE REFERENCES judge_group(judge_group_id),
role TEXT NOT NULL CHECK(role IN ('competitor','harness_judge')),
capability_id TEXT NOT NULL REFERENCES harness_route_capability(capability_id),
qualification_id TEXT NOT NULL REFERENCES route_qualification(qualification_id), binding_digest TEXT NOT NULL UNIQUE,
FOREIGN KEY(run_uid,configuration_id) REFERENCES run_configuration(run_uid,configuration_id), UNIQUE(run_uid,configuration_id,role),
UNIQUE(access_binding_id,judge_group_id),
CHECK((role='competitor' AND run_uid IS NOT NULL AND configuration_id IS NOT NULL AND judge_group_id IS NULL)
OR (role='harness_judge' AND run_uid IS NULL AND configuration_id IS NULL AND judge_group_id IS NOT NULL))
) STRICT;
-- R194: portable existing-launcher snapshots; local executable/source/secret locators are absent.
CREATE TABLE existing_agent_profile_snapshot (
profile_snapshot_id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, version INTEGER NOT NULL CHECK(version>0),
profile_digest TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL,
harness_release_id TEXT NOT NULL REFERENCES harness_release(harness_release_id), distribution_id TEXT NOT NULL,
source_kind TEXT NOT NULL CHECK(source_kind IN ('shell_alias','structured_registration')),
sanitized_source_description TEXT NOT NULL, sanitized_source_digest TEXT NOT NULL,
executable_identity_digest TEXT NOT NULL, inspection_id TEXT NOT NULL, inspection_digest TEXT NOT NULL,
parser_version TEXT NOT NULL, control_registry_version INTEGER NOT NULL CHECK(control_registry_version=1),
settings_precedence_digest TEXT NOT NULL, evidence_set_id TEXT NOT NULL REFERENCES access_evidence_seal(evidence_set_id),
observed_at TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id), UNIQUE(profile_id,version)
) STRICT;
CREATE TABLE existing_agent_profile_role (
profile_snapshot_id TEXT NOT NULL REFERENCES existing_agent_profile_snapshot(profile_snapshot_id),
role TEXT NOT NULL CHECK(role IN ('competitor','planner','harness_judge')), PRIMARY KEY(profile_snapshot_id,role)
) STRICT;
CREATE TABLE existing_agent_profile_control (
control_id TEXT PRIMARY KEY, profile_snapshot_id TEXT NOT NULL REFERENCES existing_agent_profile_snapshot(profile_snapshot_id),
-- NULL binding is the source declaration; non-NULL is a reviewed per-configuration transformation.
binding_id TEXT, ordinal INTEGER NOT NULL CHECK(ordinal>0),
control_key TEXT NOT NULL CHECK(control_key IN ('endpoint','model','small_fast_model','default_haiku_model','native_effort','thinking_enabled','thinking_budget_tokens','output_limit_tokens','request_timeout_ms','context_limit_tokens','auto_compact_window','plugins_enabled','skip_permission_prompt','auth_token_presence','api_key_presence','system_prompt_suffix','permission_mode','settings_source')),
layer_kind TEXT NOT NULL CHECK(layer_kind IN ('argv','environment','settings','override')),
origin TEXT NOT NULL CHECK(origin IN ('declared','inherited','reviewed_override','benchmark_adaptation')),
value_state TEXT NOT NULL CHECK(value_state IN ('unset','empty','set','inherited')),
text_value TEXT, integer_value TEXT CHECK(integer_value IS NULL OR integer_value='0' OR (integer_value GLOB '[1-9]*' AND integer_value NOT GLOB '*[^0-9]*')),
boolean_value INTEGER CHECK(boolean_value IN (0,1)), reason TEXT,
support_state TEXT NOT NULL CHECK(support_state IN ('declared','qualified','unverified','ignored')),
effective_state TEXT NOT NULL CHECK(effective_state IN ('unknown','confirmed','mismatch')),
evidence_set_id TEXT NOT NULL REFERENCES access_evidence_seal(evidence_set_id),
FOREIGN KEY(binding_id,profile_snapshot_id) REFERENCES configuration_existing_agent_binding(binding_id,profile_snapshot_id) DEFERRABLE INITIALLY DEFERRED,
CHECK((binding_id IS NULL AND origin IN ('declared','inherited')) OR (binding_id IS NOT NULL AND origin IN ('reviewed_override','benchmark_adaptation'))),
CHECK((value_state='unset' AND text_value IS NULL AND integer_value IS NULL AND boolean_value IS NULL)
OR (value_state='empty' AND text_value='' AND integer_value IS NULL AND boolean_value IS NULL)
OR (value_state IN ('set','inherited') AND ((text_value IS NOT NULL)+(integer_value IS NOT NULL)+(boolean_value IS NOT NULL))=1)
OR (value_state='inherited' AND text_value IS NULL AND integer_value IS NULL AND boolean_value IS NULL AND reason IS NOT NULL)),
CHECK(control_key NOT IN ('auth_token_presence','api_key_presence') OR
(value_state='set' AND text_value IN ('present_resolution_unverified','present_resolution_verified','absent') AND integer_value IS NULL AND boolean_value IS NULL)),
CHECK(control_key NOT IN ('thinking_budget_tokens','output_limit_tokens','request_timeout_ms','context_limit_tokens','auto_compact_window') OR value_state IN ('unset','empty') OR integer_value IS NOT NULL OR (value_state='inherited' AND reason IS NOT NULL)),
CHECK(control_key NOT IN ('thinking_enabled','plugins_enabled','skip_permission_prompt') OR value_state IN ('unset','empty') OR boolean_value IS NOT NULL OR (value_state='inherited' AND reason IS NOT NULL))
) STRICT;
CREATE UNIQUE INDEX existing_profile_declared_control ON existing_agent_profile_control(profile_snapshot_id,ordinal) WHERE binding_id IS NULL;
CREATE UNIQUE INDEX existing_profile_override_control ON existing_agent_profile_control(binding_id,ordinal) WHERE binding_id IS NOT NULL;
CREATE INDEX existing_profile_control_facet ON existing_agent_profile_control(profile_snapshot_id,control_key);
CREATE TABLE existing_agent_profile_asset (
asset_id TEXT PRIMARY KEY, profile_snapshot_id TEXT NOT NULL REFERENCES existing_agent_profile_snapshot(profile_snapshot_id),
binding_id TEXT, relative_binding TEXT NOT NULL CHECK(length(relative_binding)>0 AND relative_binding NOT LIKE '/%' AND relative_binding NOT LIKE '%..%' AND instr(relative_binding,char(92))=0 AND instr(relative_binding,':')=0),
kind TEXT NOT NULL CHECK(kind IN ('configuration','instruction','plugin','hook','helper')),
content_digest TEXT NOT NULL, action TEXT NOT NULL CHECK(action IN ('preserve','remove','isolate')),
provenance_digest TEXT NOT NULL, capability_state TEXT NOT NULL CHECK(capability_state IN ('qualified','unverified','not_required')),
isolation_state TEXT NOT NULL CHECK(isolation_state IN ('qualified','unsupported','unverified')),
evidence_set_id TEXT NOT NULL REFERENCES access_evidence_seal(evidence_set_id),
FOREIGN KEY(binding_id,profile_snapshot_id) REFERENCES configuration_existing_agent_binding(binding_id,profile_snapshot_id) DEFERRABLE INITIALLY DEFERRED,
CHECK(binding_id IS NOT NULL OR action='preserve')
) STRICT;
CREATE UNIQUE INDEX existing_profile_declared_asset ON existing_agent_profile_asset(profile_snapshot_id,relative_binding) WHERE binding_id IS NULL;
CREATE UNIQUE INDEX existing_profile_override_asset ON existing_agent_profile_asset(binding_id,relative_binding) WHERE binding_id IS NOT NULL;
CREATE TABLE existing_agent_profile_seal (
profile_snapshot_id TEXT PRIMARY KEY REFERENCES existing_agent_profile_snapshot(profile_snapshot_id), validated_digest TEXT NOT NULL
) STRICT;
CREATE TABLE configuration_existing_agent_binding (
binding_id TEXT PRIMARY KEY, run_uid TEXT, configuration_id TEXT,
judge_group_id TEXT UNIQUE REFERENCES judge_group(judge_group_id),
role TEXT NOT NULL CHECK(role IN ('competitor','harness_judge')),
profile_snapshot_id TEXT NOT NULL REFERENCES existing_agent_profile_seal(profile_snapshot_id),
treatment TEXT NOT NULL CHECK(treatment IN ('existing','clean')), reproduction TEXT NOT NULL CHECK(reproduction IN ('captured_existing','transformed')),
override_set_digest TEXT, effective_control_digest TEXT NOT NULL, resolved_plan_digest TEXT NOT NULL UNIQUE,
qualification_digest TEXT NOT NULL, isolation_state TEXT NOT NULL CHECK(isolation_state='qualified'),
model_evidence_state TEXT NOT NULL CHECK(model_evidence_state IN ('declared','unverified','confirmed')),
effort_selection TEXT NOT NULL CHECK(effort_selection IN ('harness_default','contract')),
effort_contract_id TEXT REFERENCES effort_contract(effort_contract_id),
access_binding_id TEXT REFERENCES configuration_access_binding(access_binding_id),
evidence_set_id TEXT NOT NULL REFERENCES access_evidence_seal(evidence_set_id),
publication_id INTEGER NOT NULL REFERENCES publication(publication_id),
FOREIGN KEY(run_uid,configuration_id) REFERENCES run_configuration(run_uid,configuration_id),
FOREIGN KEY(profile_snapshot_id,role) REFERENCES existing_agent_profile_role(profile_snapshot_id,role),
UNIQUE(run_uid,configuration_id,role), UNIQUE(binding_id,profile_snapshot_id), UNIQUE(binding_id,judge_group_id),
CHECK((role='competitor' AND run_uid IS NOT NULL AND configuration_id IS NOT NULL AND judge_group_id IS NULL)
OR (role='harness_judge' AND run_uid IS NULL AND configuration_id IS NULL AND judge_group_id IS NOT NULL)),
CHECK((effort_selection='harness_default' AND effort_contract_id IS NULL) OR (effort_selection='contract' AND effort_contract_id IS NOT NULL)),
CHECK((reproduction='captured_existing' AND treatment='existing' AND override_set_digest IS NULL) OR (reproduction='transformed' AND override_set_digest IS NOT NULL))
) STRICT;
CREATE TRIGGER existing_profile_seal_scope BEFORE INSERT ON existing_agent_profile_seal
WHEN NOT EXISTS(SELECT 1 FROM existing_agent_profile_snapshot p WHERE p.profile_snapshot_id=NEW.profile_snapshot_id AND p.profile_digest=NEW.validated_digest)
OR NOT EXISTS(SELECT 1 FROM existing_agent_profile_role p WHERE p.profile_snapshot_id=NEW.profile_snapshot_id)
BEGIN SELECT RAISE(ABORT,'launcher seal requires matching digest and declared roles'); END;
CREATE TRIGGER existing_profile_binding_scope BEFORE INSERT ON configuration_existing_agent_binding
WHEN (NEW.role='competitor' AND NOT EXISTS(SELECT 1 FROM run_configuration c JOIN existing_agent_profile_snapshot p
ON p.harness_release_id=c.harness_release_id WHERE c.run_uid=NEW.run_uid AND c.configuration_id=NEW.configuration_id AND p.profile_snapshot_id=NEW.profile_snapshot_id))
OR (NEW.role='harness_judge' AND (NOT EXISTS(SELECT 1 FROM judge_group g JOIN existing_agent_profile_snapshot p ON p.harness_release_id=g.harness_release_id
WHERE g.judge_group_id=NEW.judge_group_id AND g.backend='harness_review' AND p.profile_snapshot_id=NEW.profile_snapshot_id
AND g.selected_existing_agent_binding_id=NEW.binding_id AND g.selected_access_binding_id IS NEW.access_binding_id
AND g.selected_effort_contract_id IS NEW.effort_contract_id)
OR EXISTS(SELECT 1 FROM judge_assessment a WHERE a.judge_group_id=NEW.judge_group_id)
OR EXISTS(SELECT 1 FROM review r WHERE r.judge_group_id=NEW.judge_group_id)
OR EXISTS(SELECT 1 FROM benchmark_run r WHERE r.original_judge_group_id=NEW.judge_group_id)
OR EXISTS(SELECT 1 FROM analysis_snapshot a WHERE a.judge_group_id=NEW.judge_group_id)))
OR (NEW.access_binding_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM configuration_access_binding a
JOIN harness_route_capability cap USING(capability_id) JOIN harness_effort_mapping m USING(effort_mapping_id)
JOIN existing_agent_profile_snapshot p ON p.profile_snapshot_id=NEW.profile_snapshot_id
WHERE a.access_binding_id=NEW.access_binding_id AND a.run_uid IS NEW.run_uid AND a.configuration_id IS NEW.configuration_id
AND a.judge_group_id IS NEW.judge_group_id AND a.role=NEW.role
AND m.harness_release_id=p.harness_release_id AND m.distribution_id=p.distribution_id
AND (NEW.effort_selection='harness_default' OR m.effort_contract_id=NEW.effort_contract_id)))
OR (NEW.reproduction='captured_existing' AND (EXISTS(SELECT 1 FROM existing_agent_profile_control c WHERE c.binding_id=NEW.binding_id AND c.origin='reviewed_override')
OR EXISTS(SELECT 1 FROM existing_agent_profile_asset a WHERE a.binding_id=NEW.binding_id AND a.action<>'preserve')))
OR EXISTS(SELECT 1 FROM harness_comparison h JOIN harness_comparison_freeze f USING(comparison_id) WHERE h.run_uid=NEW.run_uid)
OR EXISTS(SELECT 1 FROM retained_result r JOIN expected_trial t USING(expected_trial_id) WHERE t.run_uid=NEW.run_uid AND t.configuration_id=NEW.configuration_id)
OR EXISTS(SELECT 1 FROM analysis_subject s WHERE s.run_uid=NEW.run_uid AND s.configuration_id=NEW.configuration_id)
BEGIN SELECT RAISE(ABORT,'launcher binding scope, treatment or frozen launch mismatch'); END;
CREATE TRIGGER existing_profile_role_closed BEFORE INSERT ON existing_agent_profile_role
WHEN EXISTS(SELECT 1 FROM existing_agent_profile_seal s WHERE s.profile_snapshot_id=NEW.profile_snapshot_id)
BEGIN SELECT RAISE(ABORT,'sealed launcher role'); END;
CREATE TRIGGER existing_agent_profile_control_closed BEFORE INSERT ON existing_agent_profile_control
WHEN (NEW.binding_id IS NULL AND EXISTS(SELECT 1 FROM existing_agent_profile_seal s WHERE s.profile_snapshot_id=NEW.profile_snapshot_id))
OR (NEW.binding_id IS NOT NULL AND EXISTS(SELECT 1 FROM configuration_existing_agent_binding b WHERE b.binding_id=NEW.binding_id))
BEGIN SELECT RAISE(ABORT,'sealed launcher declarations or binding'); END;
CREATE TRIGGER existing_agent_profile_asset_closed BEFORE INSERT ON existing_agent_profile_asset
WHEN (NEW.binding_id IS NULL AND EXISTS(SELECT 1 FROM existing_agent_profile_seal s WHERE s.profile_snapshot_id=NEW.profile_snapshot_id))
OR (NEW.binding_id IS NOT NULL AND EXISTS(SELECT 1 FROM configuration_existing_agent_binding b WHERE b.binding_id=NEW.binding_id))
BEGIN SELECT RAISE(ABORT,'sealed launcher declarations or binding'); END;
CREATE TRIGGER existing_agent_profile_snapshot_immutable_update BEFORE UPDATE ON existing_agent_profile_snapshot
BEGIN SELECT RAISE(ABORT,'append-only existing_agent_profile_snapshot'); END;
CREATE TRIGGER existing_agent_profile_snapshot_immutable_delete BEFORE DELETE ON existing_agent_profile_snapshot
BEGIN SELECT RAISE(ABORT,'append-only existing_agent_profile_snapshot'); END;
CREATE TRIGGER existing_agent_profile_role_immutable_update BEFORE UPDATE ON existing_agent_profile_role
BEGIN SELECT RAISE(ABORT,'append-only existing_agent_profile_role'); END;
CREATE TRIGGER existing_agent_profile_role_immutable_delete BEFORE DELETE ON existing_agent_profile_role
BEGIN SELECT RAISE(ABORT,'append-only existing_agent_profile_role'); END;
CREATE TRIGGER existing_agent_profile_control_immutable_update BEFORE UPDATE ON existing_agent_profile_control
BEGIN SELECT RAISE(ABORT,'append-only existing_agent_profile_control'); END;
CREATE TRIGGER existing_agent_profile_control_immutable_delete BEFORE DELETE ON existing_agent_profile_control
BEGIN SELECT RAISE(ABORT,'append-only existing_agent_profile_control'); END;
CREATE TRIGGER existing_agent_profile_asset_immutable_update BEFORE UPDATE ON existing_agent_profile_asset
BEGIN SELECT RAISE(ABORT,'append-only existing_agent_profile_asset'); END;
CREATE TRIGGER existing_agent_profile_asset_immutable_delete BEFORE DELETE ON existing_agent_profile_asset
BEGIN SELECT RAISE(ABORT,'append-only existing_agent_profile_asset'); END;
CREATE TRIGGER existing_agent_profile_seal_immutable_update BEFORE UPDATE ON existing_agent_profile_seal
BEGIN SELECT RAISE(ABORT,'append-only existing_agent_profile_seal'); END;
CREATE TRIGGER existing_agent_profile_seal_immutable_delete BEFORE DELETE ON existing_agent_profile_seal
BEGIN SELECT RAISE(ABORT,'append-only existing_agent_profile_seal'); END;
CREATE TRIGGER configuration_existing_agent_binding_immutable_update BEFORE UPDATE ON configuration_existing_agent_binding
BEGIN SELECT RAISE(ABORT,'append-only configuration_existing_agent_binding'); END;
CREATE TRIGGER configuration_existing_agent_binding_immutable_delete BEFORE DELETE ON configuration_existing_agent_binding
BEGIN SELECT RAISE(ABORT,'append-only configuration_existing_agent_binding'); END;

CREATE TABLE harness_comparison_cell (
comparison_id TEXT NOT NULL REFERENCES harness_comparison(comparison_id), harness_id TEXT NOT NULL,
selected INTEGER NOT NULL CHECK(selected IN (0,1)), configuration_id TEXT,
access_binding_id TEXT UNIQUE REFERENCES configuration_access_binding(access_binding_id),
model_binding_id TEXT REFERENCES access_model_binding(model_binding_id), effort_mapping_id TEXT REFERENCES harness_effort_mapping(effort_mapping_id),
capability_id TEXT REFERENCES harness_route_capability(capability_id),
readiness TEXT NOT NULL CHECK(readiness IN ('ready','blocked','unverified','stale')), exclusion_reason TEXT,
PRIMARY KEY(comparison_id,harness_id), UNIQUE(comparison_id,configuration_id),
CHECK((selected=1 AND configuration_id IS NOT NULL AND access_binding_id IS NOT NULL AND model_binding_id IS NOT NULL
AND effort_mapping_id IS NOT NULL AND capability_id IS NOT NULL AND readiness='ready')
OR (selected=0 AND configuration_id IS NULL AND access_binding_id IS NULL AND exclusion_reason IS NOT NULL))
) STRICT;
CREATE TABLE harness_comparison_cell_issue (
comparison_id TEXT NOT NULL, harness_id TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>0),
kind TEXT NOT NULL CHECK(kind IN ('reason','limitation')), code TEXT NOT NULL, detail TEXT NOT NULL,
PRIMARY KEY(comparison_id,harness_id,ordinal), FOREIGN KEY(comparison_id,harness_id) REFERENCES harness_comparison_cell(comparison_id,harness_id)
) STRICT;
CREATE TABLE harness_comparison_freeze (
comparison_id TEXT PRIMARY KEY REFERENCES harness_comparison(comparison_id), validated_digest TEXT NOT NULL,
roster_digest TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;
CREATE TRIGGER existing_profile_analysis_dependency BEFORE INSERT ON analysis_finalization
WHEN EXISTS(SELECT 1 FROM analysis_subject s JOIN configuration_existing_agent_binding b
ON b.run_uid=s.run_uid AND b.configuration_id=s.configuration_id AND b.role='competitor'
WHERE s.analysis_id=NEW.analysis_id AND NOT EXISTS(SELECT 1 FROM analysis_dependency d
WHERE d.analysis_id=NEW.analysis_id AND d.resource_kind='existing_agent_binding' AND d.resource_id=b.binding_id))
OR EXISTS(SELECT 1 FROM analysis_snapshot a JOIN configuration_existing_agent_binding b
ON b.judge_group_id=a.judge_group_id AND b.role='harness_judge'
WHERE a.analysis_id=NEW.analysis_id AND NOT EXISTS(SELECT 1 FROM analysis_dependency d
WHERE d.analysis_id=NEW.analysis_id AND d.resource_kind='existing_agent_binding' AND d.resource_id=b.binding_id))
BEGIN SELECT RAISE(ABORT,'analysis requires each selected launcher treatment dependency'); END;

CREATE TRIGGER existing_profile_comparison_contract BEFORE INSERT ON harness_comparison_freeze
WHEN EXISTS(SELECT 1 FROM harness_comparison h JOIN harness_comparison_cell c USING(comparison_id)
JOIN configuration_existing_agent_binding b ON b.run_uid=h.run_uid AND b.configuration_id=c.configuration_id AND b.role='competitor'
WHERE h.comparison_id=NEW.comparison_id AND c.selected=1 AND h.mode='strict'
AND (b.effort_selection<>'contract' OR b.effort_contract_id<>h.effort_contract_id OR b.access_binding_id IS NOT c.access_binding_id))
BEGIN SELECT RAISE(ABORT,'strict matrix launcher requires same qualified access and effort contract'); END;

CREATE TABLE request_route_observation (
observation_id TEXT PRIMARY KEY, call_id TEXT NOT NULL REFERENCES inference_call(call_id),
access_binding_id TEXT NOT NULL REFERENCES configuration_access_binding(access_binding_id),
observation_digest TEXT NOT NULL UNIQUE, native_attempt_id TEXT,
record_kind TEXT NOT NULL CHECK(record_kind IN ('source_fact','annotation')), supersedes_observation_id TEXT REFERENCES request_route_observation(observation_id),
requested_model_binding_id TEXT NOT NULL REFERENCES access_model_binding(model_binding_id),
resolved_checkpoint_id TEXT REFERENCES model_checkpoint(checkpoint_id), resolved_variant_snapshot_id TEXT REFERENCES variant_snapshot(variant_snapshot_id),
effective_checkpoint_id TEXT REFERENCES model_checkpoint(checkpoint_id), effective_variant_snapshot_id TEXT REFERENCES variant_snapshot(variant_snapshot_id),
resolved_model_state TEXT NOT NULL CHECK(resolved_model_state IN ('confirmed','declared','unverified','unknown','mismatch')),
effective_model_state TEXT NOT NULL CHECK(effective_model_state IN ('confirmed','declared','unverified','unknown','mismatch')),
status TEXT NOT NULL CHECK(status IN ('confirmed','declared','unverified','mismatch')),
coverage TEXT NOT NULL CHECK(coverage IN ('complete','partial','unknown')), reason TEXT,
evidence_set_id TEXT NOT NULL REFERENCES access_evidence_seal(evidence_set_id), observed_at TEXT NOT NULL,
publication_id INTEGER NOT NULL REFERENCES publication(publication_id),
CHECK(record_kind='annotation' OR supersedes_observation_id IS NULL),
CHECK((record_kind='source_fact' AND coverage='complete') OR reason IS NOT NULL),
CHECK(resolved_model_state<>'unknown' OR (resolved_checkpoint_id IS NULL AND resolved_variant_snapshot_id IS NULL)),
CHECK(effective_model_state<>'unknown' OR (effective_checkpoint_id IS NULL AND effective_variant_snapshot_id IS NULL))
) STRICT;
CREATE TABLE request_effort_observation (
observation_id TEXT NOT NULL REFERENCES request_route_observation(observation_id), stage TEXT NOT NULL CHECK(stage IN ('requested','emitted','effective')),
effort_contract_id TEXT REFERENCES effort_contract(effort_contract_id),
kind TEXT NOT NULL CHECK(kind IN ('native_level','reasoning_budget','disabled','unknown')), native_level TEXT,
budget_tokens TEXT CHECK(budget_tokens GLOB '[1-9]*' AND budget_tokens NOT GLOB '*[^0-9]*'),
semantic_owner TEXT, semantic_version TEXT, state TEXT NOT NULL CHECK(state IN ('confirmed','declared','unverified','unknown','mismatch')),
reason TEXT, evidence_set_id TEXT NOT NULL REFERENCES access_evidence_seal(evidence_set_id), PRIMARY KEY(observation_id,stage),
CHECK((kind='native_level' AND native_level IS NOT NULL AND budget_tokens IS NULL)
OR (kind='reasoning_budget' AND native_level IS NULL AND budget_tokens IS NOT NULL)
OR (kind IN ('disabled','unknown') AND native_level IS NULL AND budget_tokens IS NULL)),
CHECK(kind='unknown' OR (semantic_owner IS NOT NULL AND semantic_version IS NOT NULL)),
CHECK((state='unknown')=(kind='unknown')), CHECK(state<>'unknown' OR (effort_contract_id IS NULL AND reason IS NOT NULL))
) STRICT;
CREATE TABLE request_route_hop_observation (
observation_id TEXT NOT NULL REFERENCES request_route_observation(observation_id), ordinal INTEGER NOT NULL CHECK(ordinal>0),
kind TEXT NOT NULL CHECK(kind IN ('direct_provider','openrouter','litellm')), endpoint_origin TEXT, endpoint_path TEXT,
input_protocol TEXT, output_protocol TEXT, provider_id TEXT, deployment_id TEXT, region TEXT, tier TEXT,
translation_version TEXT, config_digest TEXT, gateway_locality TEXT NOT NULL CHECK(gateway_locality IN ('local','remote','mixed','unknown')),
inference_locality TEXT NOT NULL CHECK(inference_locality IN ('local','remote','mixed','unknown')),
status TEXT NOT NULL CHECK(status IN ('confirmed','declared','unverified','unknown','mismatch')), reason TEXT,
evidence_set_id TEXT NOT NULL REFERENCES access_evidence_seal(evidence_set_id), PRIMARY KEY(observation_id,ordinal),
CHECK(status<>'unknown' OR reason IS NOT NULL)
) STRICT;
CREATE TABLE request_route_finalization (
observation_id TEXT PRIMARY KEY REFERENCES request_route_observation(observation_id), validated_digest TEXT NOT NULL
) STRICT;
CREATE TABLE request_route_exclusion (
exclusion_id TEXT PRIMARY KEY, observation_id TEXT NOT NULL REFERENCES request_route_finalization(observation_id),
code TEXT NOT NULL, reason TEXT NOT NULL, policy_ref TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;
CREATE TABLE comparison_analysis_link (
analysis_id TEXT NOT NULL REFERENCES analysis_snapshot(analysis_id), comparison_id TEXT NOT NULL REFERENCES harness_comparison_freeze(comparison_id),
comparison_axis TEXT NOT NULL CHECK(comparison_axis='harness'), policy_digest TEXT NOT NULL,
input_evidence_digest TEXT NOT NULL, evidence_publication_id INTEGER NOT NULL REFERENCES publication(publication_id),
outcome_digest TEXT NOT NULL,
classification TEXT NOT NULL CHECK(classification IN ('confirmed_same_model_effort','unverified_same_model_effort','exploratory','mismatch')),
PRIMARY KEY(analysis_id,comparison_id)
) STRICT;
CREATE TABLE comparison_analysis_cell (
analysis_id TEXT NOT NULL, comparison_id TEXT NOT NULL, harness_id TEXT NOT NULL,
analysis_subject_id TEXT REFERENCES analysis_subject(analysis_subject_id),
classification TEXT NOT NULL CHECK(classification IN ('confirmed_same_model_effort','unverified_same_model_effort','exploratory','mismatch','unavailable')),
reason TEXT, PRIMARY KEY(analysis_id,comparison_id,harness_id), UNIQUE(analysis_id,comparison_id,analysis_subject_id),
FOREIGN KEY(analysis_id,comparison_id) REFERENCES comparison_analysis_link(analysis_id,comparison_id),
FOREIGN KEY(comparison_id,harness_id) REFERENCES harness_comparison_cell(comparison_id,harness_id)
) STRICT;

CREATE INDEX model_binding_profile ON access_model_binding(profile_snapshot_id,checkpoint_id);
CREATE INDEX effort_mapping_binding ON harness_effort_mapping(model_binding_id,effort_contract_id,harness_release_id);
CREATE INDEX capability_mapping ON harness_route_capability(effort_mapping_id);
CREATE INDEX route_observation_call ON request_route_observation(call_id,publication_id);
CREATE INDEX route_observation_binding ON request_route_observation(access_binding_id,publication_id);
CREATE INDEX comparison_cell_configuration ON harness_comparison_cell(configuration_id,comparison_id);
CREATE INDEX comparison_analysis_comparison ON comparison_analysis_link(comparison_id,analysis_id);

CREATE TRIGGER mapping_settings_complete BEFORE INSERT ON harness_effort_mapping_seal
WHEN NOT EXISTS(SELECT 1 FROM harness_effort_setting WHERE effort_mapping_id=NEW.effort_mapping_id AND stage='launch')
OR NOT EXISTS(SELECT 1 FROM harness_effort_setting WHERE effort_mapping_id=NEW.effort_mapping_id AND stage='upstream')
BEGIN SELECT RAISE(ABORT,'mapping needs launch and upstream settings'); END;
CREATE TRIGGER effort_settings_closed BEFORE INSERT ON harness_effort_setting
WHEN EXISTS(SELECT 1 FROM harness_effort_mapping_seal WHERE effort_mapping_id=NEW.effort_mapping_id)
BEGIN SELECT RAISE(ABORT,'sealed effort mapping'); END;
CREATE TRIGGER capability_limitations_closed BEFORE INSERT ON harness_capability_limitation
WHEN EXISTS(SELECT 1 FROM harness_route_capability_seal WHERE capability_id=NEW.capability_id)
BEGIN SELECT RAISE(ABORT,'sealed route capability'); END;
CREATE TRIGGER comparison_common_effort_scope BEFORE INSERT ON harness_comparison
WHEN EXISTS(SELECT 1 FROM access_model_binding b JOIN effort_contract e ON e.effort_contract_id=NEW.effort_contract_id
WHERE b.model_binding_id=NEW.model_binding_id AND ((b.checkpoint_id IS NOT NULL AND b.checkpoint_id<>e.checkpoint_id)
OR (b.variant_snapshot_id IS NOT NULL AND b.variant_snapshot_id IS NOT e.variant_snapshot_id)))
BEGIN SELECT RAISE(ABORT,'comparison effort outside common model identity'); END;
CREATE TRIGGER harness_effort_setting_immutable_update BEFORE UPDATE ON harness_effort_setting
BEGIN SELECT RAISE(ABORT,'append-only harness_effort_setting'); END;
CREATE TRIGGER harness_effort_setting_immutable_delete BEFORE DELETE ON harness_effort_setting
BEGIN SELECT RAISE(ABORT,'append-only harness_effort_setting'); END;
CREATE TRIGGER harness_effort_mapping_seal_immutable_update BEFORE UPDATE ON harness_effort_mapping_seal
BEGIN SELECT RAISE(ABORT,'append-only harness_effort_mapping_seal'); END;
CREATE TRIGGER harness_effort_mapping_seal_immutable_delete BEFORE DELETE ON harness_effort_mapping_seal
BEGIN SELECT RAISE(ABORT,'append-only harness_effort_mapping_seal'); END;
CREATE TRIGGER harness_route_capability_seal_immutable_update BEFORE UPDATE ON harness_route_capability_seal
BEGIN SELECT RAISE(ABORT,'append-only harness_route_capability_seal'); END;
CREATE TRIGGER harness_route_capability_seal_immutable_delete BEFORE DELETE ON harness_route_capability_seal
BEGIN SELECT RAISE(ABORT,'append-only harness_route_capability_seal'); END;

CREATE TRIGGER access_evidence_closed BEFORE INSERT ON access_evidence_item
WHEN EXISTS(SELECT 1 FROM access_evidence_seal WHERE evidence_set_id=NEW.evidence_set_id)
BEGIN SELECT RAISE(ABORT,'sealed access evidence'); END;
CREATE TRIGGER profile_seal_complete BEFORE INSERT ON api_access_profile_seal
WHEN NOT EXISTS(SELECT 1 FROM api_access_role WHERE profile_snapshot_id=NEW.profile_snapshot_id)
OR NOT EXISTS(SELECT 1 FROM api_route_hop WHERE profile_snapshot_id=NEW.profile_snapshot_id)
BEGIN SELECT RAISE(ABORT,'profile needs roles and ordered hops'); END;
CREATE TRIGGER mapping_model_scope BEFORE INSERT ON harness_effort_mapping
WHEN EXISTS(SELECT 1 FROM access_model_binding b JOIN effort_contract e ON e.effort_contract_id=NEW.effort_contract_id
WHERE b.model_binding_id=NEW.model_binding_id AND
((b.checkpoint_id IS NOT NULL AND b.checkpoint_id<>e.checkpoint_id)
OR (b.variant_snapshot_id IS NOT NULL AND b.variant_snapshot_id IS NOT e.variant_snapshot_id)))
BEGIN SELECT RAISE(ABORT,'effort contract outside model binding'); END;
CREATE TRIGGER judge_selected_effort_scope BEFORE INSERT ON judge_group
WHEN NEW.selected_effort_contract_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM effort_contract e
WHERE e.effort_contract_id=NEW.selected_effort_contract_id AND e.checkpoint_id IS NEW.model_checkpoint_id
AND e.variant_snapshot_id IS NEW.variant_snapshot_id)
BEGIN SELECT RAISE(ABORT,'judge effort outside selected model identity'); END;
CREATE TRIGGER configuration_access_scope BEFORE INSERT ON configuration_access_binding
WHEN NOT EXISTS(SELECT 1 FROM harness_route_capability cap
JOIN harness_effort_mapping m USING(effort_mapping_id) JOIN access_model_binding b USING(model_binding_id)
JOIN api_access_role role ON role.profile_snapshot_id=b.profile_snapshot_id AND role.role=NEW.role
JOIN route_qualification q ON q.qualification_id=NEW.qualification_id AND q.capability_id=cap.capability_id
WHERE cap.capability_id=NEW.capability_id AND q.execution_state='passed' AND (
(NEW.role='competitor' AND EXISTS(SELECT 1 FROM run_configuration c
WHERE c.run_uid=NEW.run_uid AND c.configuration_id=NEW.configuration_id AND c.harness_release_id=m.harness_release_id))
OR (NEW.role='harness_judge' AND EXISTS(SELECT 1 FROM judge_group g
WHERE g.judge_group_id=NEW.judge_group_id AND g.backend='harness_review' AND g.harness_release_id=m.harness_release_id
AND g.selected_access_binding_id=NEW.access_binding_id AND g.selected_effort_contract_id=m.effort_contract_id
AND g.model_checkpoint_id IS b.checkpoint_id AND g.variant_snapshot_id IS b.variant_snapshot_id))))
OR (NEW.role='harness_judge' AND (EXISTS(SELECT 1 FROM judge_assessment a WHERE a.judge_group_id=NEW.judge_group_id)
OR EXISTS(SELECT 1 FROM review r WHERE r.judge_group_id=NEW.judge_group_id)
OR EXISTS(SELECT 1 FROM benchmark_run r WHERE r.original_judge_group_id=NEW.judge_group_id)
OR EXISTS(SELECT 1 FROM analysis_snapshot a WHERE a.judge_group_id=NEW.judge_group_id)))
OR EXISTS(SELECT 1 FROM retained_result r JOIN expected_trial t USING(expected_trial_id)
WHERE t.run_uid=NEW.run_uid AND t.configuration_id=NEW.configuration_id)
OR EXISTS(SELECT 1 FROM analysis_subject s WHERE s.run_uid=NEW.run_uid AND s.configuration_id=NEW.configuration_id)
OR EXISTS(SELECT 1 FROM harness_comparison h JOIN harness_comparison_freeze f USING(comparison_id) WHERE h.run_uid=NEW.run_uid)
BEGIN SELECT RAISE(ABORT,'access binding scope, qualification or frozen owner mismatch'); END;
CREATE TRIGGER comparison_cell_scope BEFORE INSERT ON harness_comparison_cell
WHEN NOT EXISTS(SELECT 1 FROM harness_comparison h JOIN harness_registry_member r USING(registry_digest)
WHERE h.comparison_id=NEW.comparison_id AND r.harness_id=NEW.harness_id)
OR (NEW.effort_mapping_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM harness_effort_mapping m
JOIN harness_release r USING(harness_release_id) JOIN harness_comparison h ON h.comparison_id=NEW.comparison_id
WHERE m.effort_mapping_id=NEW.effort_mapping_id AND m.model_binding_id=NEW.model_binding_id
AND r.harness_id=NEW.harness_id AND m.effort_contract_id=h.effort_contract_id))
OR (NEW.capability_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM harness_route_capability c
WHERE c.capability_id=NEW.capability_id AND c.effort_mapping_id=NEW.effort_mapping_id))
OR (NEW.selected=1 AND NOT EXISTS(SELECT 1 FROM configuration_access_binding b
JOIN harness_comparison h ON h.comparison_id=NEW.comparison_id
JOIN run_configuration c ON c.run_uid=b.run_uid AND c.configuration_id=b.configuration_id
JOIN harness_effort_mapping m ON m.effort_mapping_id=NEW.effort_mapping_id
WHERE b.access_binding_id=NEW.access_binding_id AND b.run_uid=h.run_uid AND b.configuration_id=NEW.configuration_id
AND b.role='competitor' AND b.capability_id=NEW.capability_id AND c.expected_trial_count=h.trials
AND (h.mode='exploratory' OR m.support_status='exact')))
BEGIN SELECT RAISE(ABORT,'comparison cell registry/configuration/model/effort scope mismatch'); END;
CREATE TRIGGER comparison_freeze_complete BEFORE INSERT ON harness_comparison_freeze
WHEN EXISTS(SELECT 1 FROM harness_comparison h WHERE h.comparison_id=NEW.comparison_id AND (
(SELECT count(*) FROM harness_registry_member r WHERE r.registry_digest=h.registry_digest)<>6
OR (SELECT count(*) FROM harness_comparison_cell c WHERE c.comparison_id=h.comparison_id)<>6
OR (SELECT count(*) FROM harness_comparison_cell c WHERE c.comparison_id=h.comparison_id AND c.selected=1)=0
OR ((h.coverage='all_registry') <> ((SELECT count(*) FROM harness_comparison_cell c WHERE c.comparison_id=h.comparison_id AND c.selected=1)=6))
OR EXISTS(SELECT 1 FROM run_configuration c WHERE c.run_uid=h.run_uid AND NOT EXISTS(
SELECT 1 FROM harness_comparison_cell cell WHERE cell.comparison_id=h.comparison_id AND cell.configuration_id=c.configuration_id))
OR EXISTS(SELECT 1 FROM run_configuration c WHERE c.run_uid=h.run_uid AND (
CAST((SELECT count(*) FROM expected_trial t WHERE t.run_uid=c.run_uid AND t.configuration_id=c.configuration_id) AS TEXT)<>h.trials))))
BEGIN SELECT RAISE(ABORT,'comparison freeze requires six cells and complete selected trial roster'); END;
CREATE TRIGGER comparison_expected_trial_frozen BEFORE INSERT ON expected_trial
WHEN EXISTS(SELECT 1 FROM harness_comparison h JOIN harness_comparison_freeze f USING(comparison_id) WHERE h.run_uid=NEW.run_uid)
BEGIN SELECT RAISE(ABORT,'frozen comparison trial roster'); END;
CREATE TRIGGER comparison_configuration_frozen BEFORE INSERT ON run_configuration
WHEN EXISTS(SELECT 1 FROM harness_comparison h JOIN harness_comparison_freeze f USING(comparison_id) WHERE h.run_uid=NEW.run_uid)
BEGIN SELECT RAISE(ABORT,'frozen comparison configurations'); END;
CREATE TRIGGER request_route_scope BEFORE INSERT ON request_route_observation
WHEN NOT EXISTS(SELECT 1 FROM inference_call call JOIN retained_result r USING(result_id)
JOIN expected_trial t USING(expected_trial_id) JOIN configuration_access_binding b ON b.access_binding_id=NEW.access_binding_id
JOIN harness_route_capability cap USING(capability_id) JOIN harness_effort_mapping m USING(effort_mapping_id)
WHERE call.call_id=NEW.call_id AND m.model_binding_id=NEW.requested_model_binding_id
AND ((call.role='competitor' AND b.role='competitor' AND b.run_uid=t.run_uid AND b.configuration_id=t.configuration_id)
OR (call.role='judge' AND b.role='harness_judge' AND EXISTS(SELECT 1 FROM judge_assessment v JOIN judge_group g USING(judge_group_id)
WHERE v.assessment_id=call.judge_assessment_id AND v.result_id=call.result_id AND v.judge_group_id=b.judge_group_id
AND g.backend='harness_review' AND g.selected_access_binding_id=b.access_binding_id))))
OR (NEW.supersedes_observation_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM request_route_observation o
WHERE o.observation_id=NEW.supersedes_observation_id AND o.call_id=NEW.call_id AND o.access_binding_id=NEW.access_binding_id))
BEGIN SELECT RAISE(ABORT,'request route outside call/owner/model scope'); END;
CREATE TRIGGER request_route_seal_boundary BEFORE INSERT ON request_route_observation
WHEN (NEW.record_kind='source_fact' AND EXISTS(SELECT 1 FROM inference_call c JOIN result_seal s USING(result_id)
WHERE c.call_id=NEW.call_id AND c.role='competitor'))
OR (NEW.record_kind='source_fact' AND EXISTS(SELECT 1 FROM inference_call c JOIN judge_assessment a ON a.assessment_id=c.judge_assessment_id
WHERE c.call_id=NEW.call_id AND (EXISTS(SELECT 1 FROM review r JOIN review_finalization f USING(review_id) WHERE r.judge_assessment_id=a.assessment_id)
OR EXISTS(SELECT 1 FROM additional_disposition d WHERE d.assessment_id=a.assessment_id)
OR (a.purpose='original' AND EXISTS(SELECT 1 FROM original_disposition d WHERE d.result_id=a.result_id AND d.state<>'pending')))))
OR (NEW.record_kind='annotation' AND NOT EXISTS(SELECT 1 FROM inference_call c JOIN result_seal s USING(result_id) WHERE c.call_id=NEW.call_id))
BEGIN SELECT RAISE(ABORT,'route evidence violates execution seal/annotation boundary'); END;
CREATE TRIGGER request_effort_scope BEFORE INSERT ON request_effort_observation
WHEN NEW.stage='requested' AND NOT EXISTS(SELECT 1 FROM request_route_observation o
JOIN configuration_access_binding b USING(access_binding_id) JOIN harness_route_capability cap USING(capability_id)
JOIN harness_effort_mapping m USING(effort_mapping_id) JOIN effort_contract e USING(effort_contract_id)
WHERE o.observation_id=NEW.observation_id AND e.effort_contract_id=NEW.effort_contract_id
AND e.kind=NEW.kind AND e.native_level IS NEW.native_level AND e.budget_tokens IS NEW.budget_tokens
AND e.semantic_owner=NEW.semantic_owner AND e.semantic_version=NEW.semantic_version)
BEGIN SELECT RAISE(ABORT,'requested effort differs from frozen contract'); END;
CREATE TRIGGER request_route_complete BEFORE INSERT ON request_route_finalization
WHEN NOT EXISTS(SELECT 1 FROM request_route_observation o WHERE o.observation_id=NEW.observation_id AND o.observation_digest=NEW.validated_digest)
OR (SELECT count(*) FROM request_effort_observation WHERE observation_id=NEW.observation_id)<>3
OR EXISTS(SELECT 1 FROM request_route_observation o WHERE o.observation_id=NEW.observation_id AND o.coverage='complete'
AND NOT EXISTS(SELECT 1 FROM request_route_hop_observation h WHERE h.observation_id=o.observation_id))
BEGIN SELECT RAISE(ABORT,'route observation needs three effort stages and explicit hop coverage'); END;
CREATE TRIGGER route_source_closure_at_seal BEFORE INSERT ON result_seal
WHEN EXISTS(SELECT 1 FROM inference_call c JOIN request_route_observation o USING(call_id)
WHERE c.result_id=NEW.result_id AND c.role='competitor' AND o.record_kind='source_fact'
AND NOT EXISTS(SELECT 1 FROM request_route_finalization f WHERE f.observation_id=o.observation_id))
BEGIN SELECT RAISE(ABORT,'unclosed request route evidence'); END;
CREATE TRIGGER judge_route_closure_at_review BEFORE INSERT ON review_finalization
WHEN EXISTS(SELECT 1 FROM inference_call c JOIN request_route_observation o USING(call_id)
WHERE c.judge_assessment_id=(SELECT judge_assessment_id FROM review WHERE review_id=NEW.review_id)
AND NOT EXISTS(SELECT 1 FROM request_route_finalization f WHERE f.observation_id=o.observation_id))
BEGIN SELECT RAISE(ABORT,'review has unclosed judge route evidence'); END;
CREATE TRIGGER judge_route_analysis_dependency BEFORE INSERT ON analysis_finalization
WHEN EXISTS(SELECT 1 FROM analysis_snapshot a JOIN judge_group g USING(judge_group_id)
WHERE a.analysis_id=NEW.analysis_id AND g.selected_access_binding_id IS NOT NULL AND (
NOT EXISTS(SELECT 1 FROM analysis_dependency d WHERE d.analysis_id=a.analysis_id AND d.resource_kind='judge_group' AND d.resource_id=g.judge_group_id AND d.publication_id<=a.input_publication_id)
OR NOT EXISTS(SELECT 1 FROM analysis_dependency d WHERE d.analysis_id=a.analysis_id AND d.resource_kind='judge_request_routes' AND d.resource_id=g.judge_group_id AND d.publication_id<=a.input_publication_id)))
BEGIN SELECT RAISE(ABORT,'analysis requires selected judge identity and route evidence dependencies'); END;
CREATE TRIGGER route_exclusion_mismatch BEFORE INSERT ON request_route_exclusion
WHEN NOT EXISTS(SELECT 1 FROM request_route_observation WHERE observation_id=NEW.observation_id AND status='mismatch')
BEGIN SELECT RAISE(ABORT,'route exclusion requires mismatch evidence'); END;
CREATE TRIGGER comparison_analysis_scope BEFORE INSERT ON comparison_analysis_link
WHEN NOT EXISTS(SELECT 1 FROM analysis_snapshot a JOIN benchmark_run r USING(template_sha256)
JOIN harness_comparison c USING(run_uid)
WHERE a.analysis_id=NEW.analysis_id AND c.comparison_id=NEW.comparison_id
AND NEW.evidence_publication_id<=a.input_publication_id
AND (NEW.classification='exploratory' OR a.variant_comparison_mode='none'))
BEGIN SELECT RAISE(ABORT,'analysis comparison template/axis/evidence scope mismatch'); END;
CREATE TRIGGER comparison_analysis_cell_scope BEFORE INSERT ON comparison_analysis_cell
WHEN NOT EXISTS(SELECT 1 FROM harness_comparison h JOIN harness_comparison_cell c USING(comparison_id)
WHERE c.comparison_id=NEW.comparison_id AND c.harness_id=NEW.harness_id AND (
(c.selected=0 AND NEW.analysis_subject_id IS NULL AND NEW.classification='unavailable')
OR (c.selected=1 AND NEW.classification<>'unavailable' AND EXISTS(SELECT 1 FROM analysis_subject s
WHERE s.analysis_subject_id=NEW.analysis_subject_id AND s.analysis_id=NEW.analysis_id
AND s.run_uid=h.run_uid AND s.configuration_id=c.configuration_id
AND (NEW.classification<>'mismatch' OR s.status<>'eligible')
AND (NEW.classification NOT IN ('confirmed_same_model_effort','unverified_same_model_effort') OR s.comparison_tier='not_applicable')))))
BEGIN SELECT RAISE(ABORT,'analysis cell subject/axis scope mismatch'); END;
CREATE TRIGGER comparison_analysis_complete BEFORE INSERT ON analysis_finalization
WHEN EXISTS(SELECT 1 FROM comparison_analysis_link l WHERE l.analysis_id=NEW.analysis_id AND (
(SELECT count(*) FROM comparison_analysis_cell c WHERE c.analysis_id=l.analysis_id AND c.comparison_id=l.comparison_id)<>6
OR NOT EXISTS(SELECT 1 FROM analysis_dependency d WHERE d.analysis_id=l.analysis_id AND d.resource_kind='harness_comparison' AND d.resource_id=l.comparison_id)
OR NOT EXISTS(SELECT 1 FROM analysis_dependency d WHERE d.analysis_id=l.analysis_id AND d.resource_kind='request_routes' AND d.resource_id=l.comparison_id)
OR EXISTS(SELECT 1 FROM comparison_analysis_cell c JOIN analysis_subject s USING(analysis_subject_id)
WHERE c.analysis_id=l.analysis_id AND c.comparison_id=l.comparison_id
AND (SELECT count(*) FROM analysis_trial t WHERE t.analysis_subject_id=s.analysis_subject_id)
<>(SELECT count(*) FROM expected_trial t WHERE t.run_uid=s.run_uid AND t.configuration_id=s.configuration_id))
OR EXISTS(SELECT 1 FROM analysis_subject s WHERE s.analysis_id=l.analysis_id AND NOT EXISTS(
SELECT 1 FROM comparison_analysis_cell c WHERE c.analysis_id=l.analysis_id AND c.comparison_id=l.comparison_id AND c.analysis_subject_id=s.analysis_subject_id))
))
BEGIN SELECT RAISE(ABORT,'analysis comparison needs six cells, dependencies and full trial rosters'); END;

CREATE TRIGGER access_evidence_set_immutable_update BEFORE UPDATE ON access_evidence_set
BEGIN SELECT RAISE(ABORT,'append-only access_evidence_set'); END;

CREATE TRIGGER access_evidence_set_immutable_delete BEFORE DELETE ON access_evidence_set
BEGIN SELECT RAISE(ABORT,'append-only access_evidence_set'); END;

CREATE TRIGGER access_evidence_item_immutable_update BEFORE UPDATE ON access_evidence_item
BEGIN SELECT RAISE(ABORT,'append-only access_evidence_item'); END;

CREATE TRIGGER access_evidence_item_immutable_delete BEFORE DELETE ON access_evidence_item
BEGIN SELECT RAISE(ABORT,'append-only access_evidence_item'); END;

CREATE TRIGGER access_evidence_seal_immutable_update BEFORE UPDATE ON access_evidence_seal
BEGIN SELECT RAISE(ABORT,'append-only access_evidence_seal'); END;

CREATE TRIGGER access_evidence_seal_immutable_delete BEFORE DELETE ON access_evidence_seal
BEGIN SELECT RAISE(ABORT,'append-only access_evidence_seal'); END;

CREATE TRIGGER api_access_profile_immutable_update BEFORE UPDATE ON api_access_profile
BEGIN SELECT RAISE(ABORT,'append-only api_access_profile'); END;

CREATE TRIGGER api_access_profile_immutable_delete BEFORE DELETE ON api_access_profile
BEGIN SELECT RAISE(ABORT,'append-only api_access_profile'); END;

CREATE TRIGGER api_access_role_immutable_update BEFORE UPDATE ON api_access_role
BEGIN SELECT RAISE(ABORT,'append-only api_access_role'); END;

CREATE TRIGGER api_access_role_immutable_delete BEFORE DELETE ON api_access_role
BEGIN SELECT RAISE(ABORT,'append-only api_access_role'); END;

CREATE TRIGGER api_route_hop_immutable_update BEFORE UPDATE ON api_route_hop
BEGIN SELECT RAISE(ABORT,'append-only api_route_hop'); END;

CREATE TRIGGER api_route_hop_immutable_delete BEFORE DELETE ON api_route_hop
BEGIN SELECT RAISE(ABORT,'append-only api_route_hop'); END;

CREATE TRIGGER api_access_profile_seal_immutable_update BEFORE UPDATE ON api_access_profile_seal
BEGIN SELECT RAISE(ABORT,'append-only api_access_profile_seal'); END;

CREATE TRIGGER api_access_profile_seal_immutable_delete BEFORE DELETE ON api_access_profile_seal
BEGIN SELECT RAISE(ABORT,'append-only api_access_profile_seal'); END;

CREATE TRIGGER access_model_binding_immutable_update BEFORE UPDATE ON access_model_binding
BEGIN SELECT RAISE(ABORT,'append-only access_model_binding'); END;

CREATE TRIGGER access_model_binding_immutable_delete BEFORE DELETE ON access_model_binding
BEGIN SELECT RAISE(ABORT,'append-only access_model_binding'); END;

CREATE TRIGGER effort_contract_immutable_update BEFORE UPDATE ON effort_contract
BEGIN SELECT RAISE(ABORT,'append-only effort_contract'); END;

CREATE TRIGGER effort_contract_immutable_delete BEFORE DELETE ON effort_contract
BEGIN SELECT RAISE(ABORT,'append-only effort_contract'); END;

CREATE TRIGGER harness_effort_mapping_immutable_update BEFORE UPDATE ON harness_effort_mapping
BEGIN SELECT RAISE(ABORT,'append-only harness_effort_mapping'); END;

CREATE TRIGGER harness_effort_mapping_immutable_delete BEFORE DELETE ON harness_effort_mapping
BEGIN SELECT RAISE(ABORT,'append-only harness_effort_mapping'); END;

CREATE TRIGGER harness_route_capability_immutable_update BEFORE UPDATE ON harness_route_capability
BEGIN SELECT RAISE(ABORT,'append-only harness_route_capability'); END;

CREATE TRIGGER harness_route_capability_immutable_delete BEFORE DELETE ON harness_route_capability
BEGIN SELECT RAISE(ABORT,'append-only harness_route_capability'); END;

CREATE TRIGGER harness_capability_limitation_immutable_update BEFORE UPDATE ON harness_capability_limitation
BEGIN SELECT RAISE(ABORT,'append-only harness_capability_limitation'); END;

CREATE TRIGGER harness_capability_limitation_immutable_delete BEFORE DELETE ON harness_capability_limitation
BEGIN SELECT RAISE(ABORT,'append-only harness_capability_limitation'); END;

CREATE TRIGGER route_qualification_immutable_update BEFORE UPDATE ON route_qualification
BEGIN SELECT RAISE(ABORT,'append-only route_qualification'); END;

CREATE TRIGGER route_qualification_immutable_delete BEFORE DELETE ON route_qualification
BEGIN SELECT RAISE(ABORT,'append-only route_qualification'); END;

CREATE TRIGGER harness_registry_member_immutable_update BEFORE UPDATE ON harness_registry_member
BEGIN SELECT RAISE(ABORT,'append-only harness_registry_member'); END;

CREATE TRIGGER harness_registry_member_immutable_delete BEFORE DELETE ON harness_registry_member
BEGIN SELECT RAISE(ABORT,'append-only harness_registry_member'); END;

CREATE TRIGGER harness_comparison_immutable_update BEFORE UPDATE ON harness_comparison
BEGIN SELECT RAISE(ABORT,'append-only harness_comparison'); END;

CREATE TRIGGER harness_comparison_immutable_delete BEFORE DELETE ON harness_comparison
BEGIN SELECT RAISE(ABORT,'append-only harness_comparison'); END;

CREATE TRIGGER harness_comparison_control_immutable_update BEFORE UPDATE ON harness_comparison_control
BEGIN SELECT RAISE(ABORT,'append-only harness_comparison_control'); END;

CREATE TRIGGER harness_comparison_control_immutable_delete BEFORE DELETE ON harness_comparison_control
BEGIN SELECT RAISE(ABORT,'append-only harness_comparison_control'); END;

CREATE TRIGGER configuration_access_binding_immutable_update BEFORE UPDATE ON configuration_access_binding
BEGIN SELECT RAISE(ABORT,'append-only configuration_access_binding'); END;

CREATE TRIGGER configuration_access_binding_immutable_delete BEFORE DELETE ON configuration_access_binding
BEGIN SELECT RAISE(ABORT,'append-only configuration_access_binding'); END;

CREATE TRIGGER harness_comparison_cell_immutable_update BEFORE UPDATE ON harness_comparison_cell
BEGIN SELECT RAISE(ABORT,'append-only harness_comparison_cell'); END;

CREATE TRIGGER harness_comparison_cell_immutable_delete BEFORE DELETE ON harness_comparison_cell
BEGIN SELECT RAISE(ABORT,'append-only harness_comparison_cell'); END;

CREATE TRIGGER harness_comparison_cell_issue_immutable_update BEFORE UPDATE ON harness_comparison_cell_issue
BEGIN SELECT RAISE(ABORT,'append-only harness_comparison_cell_issue'); END;

CREATE TRIGGER harness_comparison_cell_issue_immutable_delete BEFORE DELETE ON harness_comparison_cell_issue
BEGIN SELECT RAISE(ABORT,'append-only harness_comparison_cell_issue'); END;

CREATE TRIGGER harness_comparison_freeze_immutable_update BEFORE UPDATE ON harness_comparison_freeze
BEGIN SELECT RAISE(ABORT,'append-only harness_comparison_freeze'); END;

CREATE TRIGGER harness_comparison_freeze_immutable_delete BEFORE DELETE ON harness_comparison_freeze
BEGIN SELECT RAISE(ABORT,'append-only harness_comparison_freeze'); END;

CREATE TRIGGER request_route_observation_immutable_update BEFORE UPDATE ON request_route_observation
BEGIN SELECT RAISE(ABORT,'append-only request_route_observation'); END;

CREATE TRIGGER request_route_observation_immutable_delete BEFORE DELETE ON request_route_observation
BEGIN SELECT RAISE(ABORT,'append-only request_route_observation'); END;

CREATE TRIGGER request_effort_observation_immutable_update BEFORE UPDATE ON request_effort_observation
BEGIN SELECT RAISE(ABORT,'append-only request_effort_observation'); END;

CREATE TRIGGER request_effort_observation_immutable_delete BEFORE DELETE ON request_effort_observation
BEGIN SELECT RAISE(ABORT,'append-only request_effort_observation'); END;

CREATE TRIGGER request_route_hop_observation_immutable_update BEFORE UPDATE ON request_route_hop_observation
BEGIN SELECT RAISE(ABORT,'append-only request_route_hop_observation'); END;

CREATE TRIGGER request_route_hop_observation_immutable_delete BEFORE DELETE ON request_route_hop_observation
BEGIN SELECT RAISE(ABORT,'append-only request_route_hop_observation'); END;

CREATE TRIGGER request_route_finalization_immutable_update BEFORE UPDATE ON request_route_finalization
BEGIN SELECT RAISE(ABORT,'append-only request_route_finalization'); END;

CREATE TRIGGER request_route_finalization_immutable_delete BEFORE DELETE ON request_route_finalization
BEGIN SELECT RAISE(ABORT,'append-only request_route_finalization'); END;

CREATE TRIGGER request_route_exclusion_immutable_update BEFORE UPDATE ON request_route_exclusion
BEGIN SELECT RAISE(ABORT,'append-only request_route_exclusion'); END;

CREATE TRIGGER request_route_exclusion_immutable_delete BEFORE DELETE ON request_route_exclusion
BEGIN SELECT RAISE(ABORT,'append-only request_route_exclusion'); END;

CREATE TRIGGER comparison_analysis_link_immutable_update BEFORE UPDATE ON comparison_analysis_link
BEGIN SELECT RAISE(ABORT,'append-only comparison_analysis_link'); END;

CREATE TRIGGER comparison_analysis_link_immutable_delete BEFORE DELETE ON comparison_analysis_link
BEGIN SELECT RAISE(ABORT,'append-only comparison_analysis_link'); END;

CREATE TRIGGER comparison_analysis_cell_immutable_update BEFORE UPDATE ON comparison_analysis_cell
BEGIN SELECT RAISE(ABORT,'append-only comparison_analysis_cell'); END;

CREATE TRIGGER comparison_analysis_cell_immutable_delete BEFORE DELETE ON comparison_analysis_cell
BEGIN SELECT RAISE(ABORT,'append-only comparison_analysis_cell'); END;

CREATE TRIGGER api_access_role_closed BEFORE INSERT ON api_access_role
WHEN EXISTS(SELECT 1 FROM api_access_profile_seal WHERE profile_snapshot_id=NEW.profile_snapshot_id)
BEGIN SELECT RAISE(ABORT,'sealed access profile'); END;

CREATE TRIGGER api_route_hop_closed BEFORE INSERT ON api_route_hop
WHEN EXISTS(SELECT 1 FROM api_access_profile_seal WHERE profile_snapshot_id=NEW.profile_snapshot_id)
BEGIN SELECT RAISE(ABORT,'sealed access profile'); END;

CREATE TRIGGER harness_comparison_cell_closed BEFORE INSERT ON harness_comparison_cell
WHEN EXISTS(SELECT 1 FROM harness_comparison_freeze WHERE comparison_id=NEW.comparison_id)
BEGIN SELECT RAISE(ABORT,'frozen comparison'); END;

CREATE TRIGGER harness_comparison_control_closed BEFORE INSERT ON harness_comparison_control
WHEN EXISTS(SELECT 1 FROM harness_comparison_freeze WHERE comparison_id=NEW.comparison_id)
BEGIN SELECT RAISE(ABORT,'frozen comparison'); END;

CREATE TRIGGER harness_comparison_cell_issue_closed BEFORE INSERT ON harness_comparison_cell_issue
WHEN EXISTS(SELECT 1 FROM harness_comparison_freeze WHERE comparison_id=NEW.comparison_id)
BEGIN SELECT RAISE(ABORT,'frozen comparison'); END;

CREATE TRIGGER request_effort_observation_closed BEFORE INSERT ON request_effort_observation
WHEN EXISTS(SELECT 1 FROM request_route_finalization WHERE observation_id=NEW.observation_id)
BEGIN SELECT RAISE(ABORT,'finalized route observation'); END;

CREATE TRIGGER request_route_hop_observation_closed BEFORE INSERT ON request_route_hop_observation
WHEN EXISTS(SELECT 1 FROM request_route_finalization WHERE observation_id=NEW.observation_id)
BEGIN SELECT RAISE(ABORT,'finalized route observation'); END;

CREATE TRIGGER comparison_analysis_link_closed BEFORE INSERT ON comparison_analysis_link
WHEN EXISTS(SELECT 1 FROM analysis_finalization WHERE analysis_id=NEW.analysis_id)
BEGIN SELECT RAISE(ABORT,'finalized analysis'); END;

CREATE TRIGGER comparison_analysis_cell_closed BEFORE INSERT ON comparison_analysis_cell
WHEN EXISTS(SELECT 1 FROM analysis_finalization WHERE analysis_id=NEW.analysis_id)
BEGIN SELECT RAISE(ABORT,'finalized analysis'); END;

-- Cover natural lookup/join paths; multivalued provenance is queried separately/with EXISTS.
CREATE INDEX result_trial_lookup ON retained_result(expected_trial_id);
CREATE INDEX run_template_date ON benchmark_run(template_sha256,launched_at);
CREATE INDEX configuration_variant ON run_configuration(requested_variant_snapshot_id,run_uid,configuration_id);
CREATE INDEX expected_trial_configuration ON expected_trial(run_uid,configuration_id);
CREATE INDEX task_attempt_result ON task_attempt(result_id,task_id);
CREATE INDEX review_result_group ON review(result_id,judge_group_id,purpose);
CREATE INDEX review_group_rubric ON judge_group(rubric_ref,backend);
CREATE INDEX evidence_result ON result_evidence(result_id);
CREATE INDEX inference_call_result_role ON inference_call(result_id,role);
CREATE INDEX inference_call_judge_assessment ON inference_call(judge_assessment_id);
CREATE INDEX judge_assessment_group_result ON judge_assessment(judge_group_id,result_id);
CREATE INDEX cost_result_role ON cost_observation(result_id,role);
CREATE INDEX analysis_template_group_date ON analysis_snapshot(template_sha256,judge_group_id,created_at);
CREATE INDEX analysis_subject_configuration ON analysis_subject(run_uid,configuration_id,analysis_id);
CREATE INDEX analysis_trial_result ON analysis_trial(result_id,selected_review_id);
CREATE INDEX resource_revision_latest ON resource_revision(resource_kind,resource_id,publication_id DESC);
CREATE INDEX creator_claim_role ON creator_claim(role,variant_snapshot_id,node_id);
CREATE INDEX creator_claim_value_creator ON creator_claim_value(creator_id,creator_claim_id);
CREATE INDEX date_claim_value_date ON date_claim_value(normalized_value,precision,date_claim_id);
CREATE INDEX lineage_parent ON lineage_edge(variant_snapshot_id,parent_node_id);
CREATE INDEX context_capture_result ON context_capture(result_id);
CREATE INDEX hardware_series_run_scope ON hardware_series(run_uid,scope,result_id);
CREATE INDEX invalidation_run ON run_invalidation(run_uid);
CREATE INDEX variant_exclusion_result ON variant_exclusion(result_id);

CREATE TRIGGER lineage_no_cycles BEFORE INSERT ON lineage_edge
WHEN NEW.parent_node_id IS NOT NULL AND EXISTS (
WITH RECURSIVE ancestor(node_id) AS (
 SELECT NEW.parent_node_id UNION
 SELECT e.parent_node_id FROM lineage_edge e JOIN ancestor a ON e.child_node_id=a.node_id
 WHERE e.variant_snapshot_id=NEW.variant_snapshot_id AND e.parent_node_id IS NOT NULL
) SELECT 1 FROM ancestor WHERE node_id=NEW.child_node_id)
BEGIN SELECT RAISE(ABORT, 'lineage cycle'); END;

CREATE TRIGGER task_in_template BEFORE INSERT ON task_attempt
WHEN NOT EXISTS (
SELECT 1 FROM retained_result r JOIN expected_trial t USING(expected_trial_id)
JOIN benchmark_run b USING(run_uid) JOIN template_task k ON k.template_sha256=b.template_sha256
WHERE r.result_id=NEW.result_id AND k.task_id=NEW.task_id)
BEGIN SELECT RAISE(ABORT, 'task outside result template'); END;

CREATE TRIGGER call_attempt_scope BEFORE INSERT ON inference_call
WHEN NEW.attempt_id IS NOT NULL AND NOT EXISTS
(SELECT 1 FROM task_attempt WHERE attempt_id=NEW.attempt_id AND result_id=NEW.result_id)
BEGIN SELECT RAISE(ABORT, 'call attempt outside result'); END;

-- Retain calls before a review exists, including failed assessments with no Review row.
CREATE TRIGGER judge_assessment_scope BEFORE INSERT ON judge_assessment
WHEN NOT EXISTS(SELECT 1 FROM judge_group g JOIN retained_result r ON r.result_id=NEW.result_id
JOIN result_seal seal USING(result_id) JOIN expected_trial t USING(expected_trial_id) JOIN benchmark_run b USING(run_uid)
JOIN template_revision d ON d.template_sha256=b.template_sha256
WHERE g.judge_group_id=NEW.judge_group_id AND g.backend IN ('harness_review','decision_rubric') AND g.rubric_ref=d.rubric_ref
AND (NEW.purpose='additional' OR b.original_judge_group_id=g.judge_group_id))
OR EXISTS(SELECT 1 FROM review r WHERE r.review_id=NEW.reserved_review_id)
OR (NEW.purpose='original' AND EXISTS(SELECT 1 FROM original_disposition d WHERE d.result_id=NEW.result_id AND d.state<>'pending'))
BEGIN SELECT RAISE(ABORT,'assessment outside sealed result/automated JudgeGroup'); END;
CREATE TRIGGER judge_assessment_immutable_update BEFORE UPDATE ON judge_assessment
BEGIN SELECT RAISE(ABORT,'append-only judge_assessment'); END;
CREATE TRIGGER judge_assessment_immutable_delete BEFORE DELETE ON judge_assessment
BEGIN SELECT RAISE(ABORT,'append-only judge_assessment'); END;
CREATE TRIGGER call_review_scope BEFORE INSERT ON inference_call
WHEN (NEW.role='judge' AND NOT EXISTS(SELECT 1 FROM judge_assessment a
WHERE a.assessment_id=NEW.judge_assessment_id AND a.result_id=NEW.result_id
AND NOT EXISTS(SELECT 1 FROM review r JOIN review_finalization f USING(review_id) WHERE r.judge_assessment_id=a.assessment_id)
AND NOT EXISTS(SELECT 1 FROM additional_disposition d WHERE d.assessment_id=a.assessment_id)
AND NOT (a.purpose='original' AND EXISTS(SELECT 1 FROM original_disposition d WHERE d.result_id=a.result_id AND d.state<>'pending'))))
OR (NEW.review_id IS NOT NULL AND (NEW.role<>'judge' OR NOT EXISTS(SELECT 1 FROM review r
WHERE r.review_id=NEW.review_id AND r.result_id=NEW.result_id AND r.judge_assessment_id=NEW.judge_assessment_id)))
BEGIN SELECT RAISE(ABORT,'call outside open automated assessment/review'); END;
CREATE TRIGGER review_assessment_scope BEFORE INSERT ON review
WHEN EXISTS(SELECT 1 FROM judge_assessment a WHERE a.reserved_review_id=NEW.review_id AND a.assessment_id IS NOT NEW.judge_assessment_id)
OR ((SELECT backend FROM judge_group WHERE judge_group_id=NEW.judge_group_id)='human_review' AND NEW.judge_assessment_id IS NOT NULL)
OR ((SELECT backend FROM judge_group WHERE judge_group_id=NEW.judge_group_id)<>'human_review' AND NOT EXISTS(
SELECT 1 FROM judge_assessment a WHERE a.assessment_id=NEW.judge_assessment_id AND a.result_id=NEW.result_id
AND a.judge_group_id=NEW.judge_group_id AND a.purpose=NEW.purpose AND a.reserved_review_id=NEW.review_id
AND NOT EXISTS(SELECT 1 FROM additional_disposition d WHERE d.assessment_id=a.assessment_id)
AND NOT (a.purpose='original' AND EXISTS(SELECT 1 FROM original_disposition d WHERE d.result_id=a.result_id AND d.state<>'pending'))))
BEGIN SELECT RAISE(ABORT,'review outside actual assessment identity'); END;
CREATE TRIGGER additional_judge_assessment_scope BEFORE INSERT ON additional_disposition
WHEN EXISTS(SELECT 1 FROM judge_group g WHERE g.judge_group_id=NEW.judge_group_id AND g.backend<>'human_review')
AND (NOT EXISTS(SELECT 1 FROM judge_assessment a WHERE a.assessment_id=NEW.assessment_id AND a.result_id=NEW.result_id
AND a.judge_group_id=NEW.judge_group_id AND a.purpose='additional'
AND (NEW.review_id IS NULL OR EXISTS(SELECT 1 FROM review r WHERE r.review_id=NEW.review_id AND r.judge_assessment_id=a.assessment_id)))
OR (NEW.state IN ('failed','not_judged') AND EXISTS(SELECT 1 FROM review r WHERE r.judge_assessment_id=NEW.assessment_id))
OR EXISTS(SELECT 1 FROM inference_call c JOIN request_route_observation o USING(call_id)
WHERE c.judge_assessment_id=NEW.assessment_id AND NOT EXISTS(SELECT 1 FROM request_route_finalization f WHERE f.observation_id=o.observation_id)))
BEGIN SELECT RAISE(ABORT,'additional outcome outside closed assessment evidence'); END;
CREATE TRIGGER original_judge_route_closure BEFORE INSERT ON original_disposition
WHEN NEW.state<>'pending' AND EXISTS(SELECT 1 FROM judge_assessment a JOIN inference_call c ON c.judge_assessment_id=a.assessment_id
JOIN request_route_observation o USING(call_id) WHERE a.result_id=NEW.result_id AND a.purpose='original'
AND NOT EXISTS(SELECT 1 FROM request_route_finalization f WHERE f.observation_id=o.observation_id))
BEGIN SELECT RAISE(ABORT,'original outcome has unclosed judge route evidence'); END;
CREATE TRIGGER judge_cost_call_scope BEFORE INSERT ON cost_observation
WHEN NEW.role='judge' AND NEW.call_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM inference_call c
WHERE c.call_id=NEW.call_id AND c.result_id=NEW.result_id AND c.role='judge'
AND (NEW.review_id IS NULL OR EXISTS(SELECT 1 FROM review r WHERE r.review_id=NEW.review_id AND r.judge_assessment_id=c.judge_assessment_id)))
BEGIN SELECT RAISE(ABORT,'judge cost outside actual call/assessment'); END;
CREATE TRIGGER original_review_group_scope BEFORE INSERT ON review
WHEN NEW.purpose='original' AND NOT EXISTS(SELECT 1 FROM retained_result r JOIN expected_trial t USING(expected_trial_id)
JOIN benchmark_run b USING(run_uid) WHERE r.result_id=NEW.result_id AND b.original_judge_group_id=NEW.judge_group_id)
BEGIN SELECT RAISE(ABORT,'original review must use launch JudgeGroup'); END;

CREATE TRIGGER grade_category_scope BEFORE INSERT ON review_grade
WHEN NOT EXISTS (
SELECT 1 FROM review r JOIN judge_group g USING(judge_group_id)
JOIN rubric_category c USING(rubric_ref) WHERE r.review_id=NEW.review_id AND c.category_key=NEW.category_key)
BEGIN SELECT RAISE(ABORT, 'grade outside frozen rubric'); END;

CREATE TRIGGER review_evidence_scope BEFORE INSERT ON review_evidence
WHEN NOT EXISTS (
SELECT 1 FROM review r JOIN result_evidence e ON e.result_id=r.result_id
WHERE r.review_id=NEW.review_id AND e.result_evidence_id=NEW.result_evidence_id)
BEGIN SELECT RAISE(ABORT, 'review evidence outside result'); END;

CREATE TRIGGER disposition_review_scope BEFORE INSERT ON original_disposition
WHEN NEW.review_id IS NOT NULL AND NOT EXISTS (
SELECT 1 FROM review r JOIN review_finalization f USING(review_id)
WHERE r.review_id=NEW.review_id AND r.result_id=NEW.result_id AND r.purpose='original' AND r.outcome=NEW.state)
BEGIN SELECT RAISE(ABORT, 'invalid original disposition review'); END;

CREATE TRIGGER pending_after_terminal BEFORE INSERT ON original_disposition
WHEN EXISTS (SELECT 1 FROM original_disposition
WHERE result_id=NEW.result_id AND state<>'pending')
BEGIN SELECT RAISE(ABORT, 'original disposition already terminal'); END;

CREATE TRIGGER human_review_provenance BEFORE INSERT ON review
WHEN (NEW.provenance='human_authored') <>
(SELECT backend='human_review' FROM judge_group WHERE judge_group_id=NEW.judge_group_id)
BEGIN SELECT RAISE(ABORT, 'judge provenance mismatch'); END;

CREATE TRIGGER review_requires_seal BEFORE INSERT ON review
WHEN NOT EXISTS(SELECT 1 FROM result_seal WHERE result_id=NEW.result_id)
BEGIN SELECT RAISE(ABORT, 'review requires sealed result'); END;

CREATE TRIGGER review_finalize_categories BEFORE INSERT ON review_finalization
WHEN EXISTS (
SELECT 1 FROM review r JOIN judge_group g USING(judge_group_id)
WHERE r.review_id=NEW.review_id AND r.outcome='graded' AND (
(SELECT count(*) FROM review_grade WHERE review_id=NEW.review_id)<>6 OR
(SELECT count(*) FROM rubric_category WHERE rubric_ref=g.rubric_ref)<>6 OR
(SELECT count(*) FROM review_comment WHERE review_id=NEW.review_id)<>3))
BEGIN SELECT RAISE(ABORT, 'graded review needs six grades and three comments'); END;

CREATE TRIGGER analysis_subject_template BEFORE INSERT ON analysis_subject
WHEN NOT EXISTS (
SELECT 1 FROM analysis_snapshot a JOIN benchmark_run b ON b.template_sha256=a.template_sha256
WHERE a.analysis_id=NEW.analysis_id AND b.run_uid=NEW.run_uid)
BEGIN SELECT RAISE(ABORT, 'analysis subject template mismatch'); END;

CREATE TRIGGER analysis_trial_scope BEFORE INSERT ON analysis_trial
WHEN NOT EXISTS (
SELECT 1 FROM analysis_subject s JOIN expected_trial t
ON t.run_uid=s.run_uid AND t.configuration_id=s.configuration_id
WHERE s.analysis_subject_id=NEW.analysis_subject_id AND t.expected_trial_id=NEW.expected_trial_id)
OR (NEW.result_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM retained_result r
WHERE r.result_id=NEW.result_id AND r.expected_trial_id=NEW.expected_trial_id))
OR (NEW.selected_review_id IS NOT NULL AND NOT EXISTS (
SELECT 1 FROM review r JOIN review_finalization f USING(review_id)
JOIN analysis_subject s ON s.analysis_subject_id=NEW.analysis_subject_id
JOIN analysis_snapshot a USING(analysis_id)
WHERE r.review_id=NEW.selected_review_id AND r.result_id=NEW.result_id AND r.judge_group_id=a.judge_group_id))
BEGIN SELECT RAISE(ABORT, 'analysis trial or review scope mismatch'); END;

CREATE TRIGGER analysis_category_scope BEFORE INSERT ON analysis_category_weight
WHEN NOT EXISTS (
SELECT 1 FROM analysis_snapshot a JOIN template_revision t USING(template_sha256)
JOIN rubric_category c USING(rubric_ref)
WHERE a.analysis_id=NEW.analysis_id AND c.category_key=NEW.category_key)
BEGIN SELECT RAISE(ABORT, 'analysis category outside rubric'); END;

CREATE TRIGGER analysis_component_factor BEFORE INSERT ON analysis_component
WHEN NOT EXISTS (
SELECT 1 FROM analysis_subject s JOIN analysis_factor f USING(analysis_id)
WHERE s.analysis_subject_id=NEW.analysis_subject_id AND f.factor=NEW.factor)
BEGIN SELECT RAISE(ABORT, 'component outside analysis factors'); END;

CREATE TRIGGER analysis_score_eligible BEFORE INSERT ON analysis_score
WHEN NEW.combined IS NOT NULL AND NOT EXISTS (
SELECT 1 FROM analysis_subject s JOIN analysis_snapshot a USING(analysis_id)
WHERE s.analysis_subject_id=NEW.analysis_subject_id AND s.status='eligible' AND a.status='complete')
BEGIN SELECT RAISE(ABORT, 'rank requires complete eligible analysis'); END;

CREATE TRIGGER analysis_trial_quality_graded BEFORE INSERT ON analysis_trial_score
WHEN NOT EXISTS (
SELECT 1 FROM analysis_trial t JOIN review r ON r.review_id=t.selected_review_id
JOIN review_finalization f USING(review_id)
WHERE t.analysis_subject_id=NEW.analysis_subject_id AND t.expected_trial_id=NEW.expected_trial_id AND r.outcome='graded')
BEGIN SELECT RAISE(ABORT, 'trial quality requires selected graded review'); END;

CREATE TRIGGER cost_sealed BEFORE INSERT ON cost_observation
WHEN NEW.role IN ('competitor','verification') AND EXISTS(SELECT 1 FROM result_seal WHERE result_id=NEW.result_id)
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER analysis_dependency_finalized BEFORE INSERT ON analysis_dependency
WHEN EXISTS(SELECT 1 FROM analysis_finalization WHERE analysis_id=NEW.analysis_id)
BEGIN SELECT RAISE(ABORT, 'finalized analysis'); END;

CREATE TRIGGER analysis_factor_finalized BEFORE INSERT ON analysis_factor
WHEN EXISTS(SELECT 1 FROM analysis_finalization WHERE analysis_id=NEW.analysis_id)
BEGIN SELECT RAISE(ABORT, 'finalized analysis'); END;

CREATE TRIGGER analysis_category_weight_finalized BEFORE INSERT ON analysis_category_weight
WHEN EXISTS(SELECT 1 FROM analysis_finalization WHERE analysis_id=NEW.analysis_id)
BEGIN SELECT RAISE(ABORT, 'finalized analysis'); END;

CREATE TRIGGER analysis_subject_finalized BEFORE INSERT ON analysis_subject
WHEN EXISTS(SELECT 1 FROM analysis_finalization WHERE analysis_id=NEW.analysis_id)
BEGIN SELECT RAISE(ABORT, 'finalized analysis'); END;

CREATE TRIGGER analysis_trial_finalized BEFORE INSERT ON analysis_trial
WHEN EXISTS(SELECT 1 FROM analysis_subject s JOIN analysis_finalization f USING(analysis_id)
WHERE s.analysis_subject_id=NEW.analysis_subject_id)
BEGIN SELECT RAISE(ABORT, 'finalized analysis'); END;

CREATE TRIGGER analysis_score_finalized BEFORE INSERT ON analysis_score
WHEN EXISTS(SELECT 1 FROM analysis_subject s JOIN analysis_finalization f USING(analysis_id)
WHERE s.analysis_subject_id=NEW.analysis_subject_id)
BEGIN SELECT RAISE(ABORT, 'finalized analysis'); END;

CREATE TRIGGER analysis_component_finalized BEFORE INSERT ON analysis_component
WHEN EXISTS(SELECT 1 FROM analysis_subject s JOIN analysis_finalization f USING(analysis_id)
WHERE s.analysis_subject_id=NEW.analysis_subject_id)
BEGIN SELECT RAISE(ABORT, 'finalized analysis'); END;

CREATE TRIGGER analysis_cost_projection_finalized BEFORE INSERT ON analysis_cost_projection
WHEN EXISTS(SELECT 1 FROM analysis_subject s JOIN analysis_finalization f USING(analysis_id)
WHERE s.analysis_subject_id=NEW.analysis_subject_id)
BEGIN SELECT RAISE(ABORT, 'finalized analysis'); END;

CREATE TRIGGER analysis_trial_score_finalized BEFORE INSERT ON analysis_trial_score
WHEN EXISTS(SELECT 1 FROM analysis_subject s JOIN analysis_finalization f USING(analysis_id)
WHERE s.analysis_subject_id=NEW.analysis_subject_id)
BEGIN SELECT RAISE(ABORT, 'finalized analysis'); END;

CREATE TRIGGER analysis_ranking_finalized BEFORE INSERT ON analysis_ranking
WHEN EXISTS(SELECT 1 FROM analysis_subject s JOIN analysis_finalization f USING(analysis_id)
WHERE s.analysis_subject_id=NEW.analysis_subject_id)
BEGIN SELECT RAISE(ABORT, 'finalized analysis'); END;

CREATE TRIGGER analysis_exclusion_finalized BEFORE INSERT ON analysis_exclusion
WHEN EXISTS(SELECT 1 FROM analysis_subject s JOIN analysis_finalization f USING(analysis_id)
WHERE s.analysis_subject_id=NEW.analysis_subject_id)
BEGIN SELECT RAISE(ABORT, 'finalized analysis'); END;

CREATE TRIGGER cost_component_sealed BEFORE INSERT ON cost_component
WHEN EXISTS(SELECT 1 FROM cost_observation c JOIN result_seal s USING(result_id)
WHERE c.cost_id=NEW.cost_id AND c.role IN ('competitor','verification'))
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER sample_sealed BEFORE INSERT ON hardware_sample
WHEN EXISTS(SELECT 1 FROM hardware_series h JOIN result_seal s USING(result_id)
WHERE h.series_id=NEW.series_id)
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER check_evidence_scope BEFORE INSERT ON check_result
WHEN NEW.evidence_id IS NOT NULL AND NOT EXISTS (
SELECT 1 FROM task_attempt t JOIN result_evidence e USING(result_id)
WHERE t.attempt_id=NEW.attempt_id AND e.result_evidence_id=NEW.evidence_id)
BEGIN SELECT RAISE(ABORT, 'check evidence outside result'); END;

CREATE TRIGGER exclusion_trial_scope BEFORE INSERT ON analysis_exclusion
WHEN NEW.expected_trial_id IS NOT NULL AND NOT EXISTS (
SELECT 1 FROM analysis_subject s JOIN expected_trial t USING(run_uid,configuration_id)
WHERE s.analysis_subject_id=NEW.analysis_subject_id AND t.expected_trial_id=NEW.expected_trial_id)
BEGIN SELECT RAISE(ABORT, 'exclusion trial outside subject'); END;

CREATE TRIGGER additional_review_scope BEFORE INSERT ON additional_disposition
WHEN NEW.review_id IS NOT NULL AND NOT EXISTS (
SELECT 1 FROM review r JOIN review_finalization f USING(review_id)
WHERE r.review_id=NEW.review_id AND r.result_id=NEW.result_id AND r.judge_group_id=NEW.judge_group_id
AND r.purpose='additional' AND r.outcome=NEW.state)
BEGIN SELECT RAISE(ABORT, 'invalid additional disposition review'); END;

CREATE TRIGGER publication_immutable_update BEFORE UPDATE ON publication
BEGIN SELECT RAISE(ABORT, 'append-only publication'); END;

CREATE TRIGGER publication_immutable_delete BEFORE DELETE ON publication
BEGIN SELECT RAISE(ABORT, 'append-only publication'); END;

CREATE TRIGGER operation_receipt_immutable_update BEFORE UPDATE ON operation_receipt
BEGIN SELECT RAISE(ABORT, 'append-only operation_receipt'); END;

CREATE TRIGGER operation_receipt_immutable_delete BEFORE DELETE ON operation_receipt
BEGIN SELECT RAISE(ABORT, 'append-only operation_receipt'); END;

CREATE TRIGGER outbox_event_immutable_update BEFORE UPDATE ON outbox_event
BEGIN SELECT RAISE(ABORT, 'append-only outbox_event'); END;

CREATE TRIGGER outbox_event_immutable_delete BEFORE DELETE ON outbox_event
BEGIN SELECT RAISE(ABORT, 'append-only outbox_event'); END;

CREATE TRIGGER exact_value_immutable_update BEFORE UPDATE ON exact_value
BEGIN SELECT RAISE(ABORT, 'append-only exact_value'); END;

CREATE TRIGGER exact_value_immutable_delete BEFORE DELETE ON exact_value
BEGIN SELECT RAISE(ABORT, 'append-only exact_value'); END;

CREATE TRIGGER source_observation_immutable_update BEFORE UPDATE ON source_observation
BEGIN SELECT RAISE(ABORT, 'append-only source_observation'); END;

CREATE TRIGGER source_observation_immutable_delete BEFORE DELETE ON source_observation
BEGIN SELECT RAISE(ABORT, 'append-only source_observation'); END;

CREATE TRIGGER evidence_artifact_immutable_update BEFORE UPDATE ON evidence_artifact
BEGIN SELECT RAISE(ABORT, 'append-only evidence_artifact'); END;

CREATE TRIGGER evidence_artifact_immutable_delete BEFORE DELETE ON evidence_artifact
BEGIN SELECT RAISE(ABORT, 'append-only evidence_artifact'); END;

CREATE TRIGGER rubric_version_immutable_update BEFORE UPDATE ON rubric_version
BEGIN SELECT RAISE(ABORT, 'append-only rubric_version'); END;

CREATE TRIGGER rubric_version_immutable_delete BEFORE DELETE ON rubric_version
BEGIN SELECT RAISE(ABORT, 'append-only rubric_version'); END;

CREATE TRIGGER rubric_category_immutable_update BEFORE UPDATE ON rubric_category
BEGIN SELECT RAISE(ABORT, 'append-only rubric_category'); END;

CREATE TRIGGER rubric_category_immutable_delete BEFORE DELETE ON rubric_category
BEGIN SELECT RAISE(ABORT, 'append-only rubric_category'); END;

CREATE TRIGGER rubric_criterion_immutable_update BEFORE UPDATE ON rubric_criterion
BEGIN SELECT RAISE(ABORT, 'append-only rubric_criterion'); END;

CREATE TRIGGER rubric_criterion_immutable_delete BEFORE DELETE ON rubric_criterion
BEGIN SELECT RAISE(ABORT, 'append-only rubric_criterion'); END;

CREATE TRIGGER rubric_anchor_immutable_update BEFORE UPDATE ON rubric_anchor
BEGIN SELECT RAISE(ABORT, 'append-only rubric_anchor'); END;

CREATE TRIGGER rubric_anchor_immutable_delete BEFORE DELETE ON rubric_anchor
BEGIN SELECT RAISE(ABORT, 'append-only rubric_anchor'); END;

CREATE TRIGGER template_revision_immutable_update BEFORE UPDATE ON template_revision
BEGIN SELECT RAISE(ABORT, 'append-only template_revision'); END;

CREATE TRIGGER template_revision_immutable_delete BEFORE DELETE ON template_revision
BEGIN SELECT RAISE(ABORT, 'append-only template_revision'); END;

CREATE TRIGGER template_task_immutable_update BEFORE UPDATE ON template_task
BEGIN SELECT RAISE(ABORT, 'append-only template_task'); END;

CREATE TRIGGER template_task_immutable_delete BEFORE DELETE ON template_task
BEGIN SELECT RAISE(ABORT, 'append-only template_task'); END;

CREATE TRIGGER machine_snapshot_immutable_update BEFORE UPDATE ON machine_snapshot
BEGIN SELECT RAISE(ABORT, 'append-only machine_snapshot'); END;

CREATE TRIGGER machine_snapshot_immutable_delete BEFORE DELETE ON machine_snapshot
BEGIN SELECT RAISE(ABORT, 'append-only machine_snapshot'); END;

CREATE TRIGGER machine_component_immutable_update BEFORE UPDATE ON machine_component
BEGIN SELECT RAISE(ABORT, 'append-only machine_component'); END;

CREATE TRIGGER machine_component_immutable_delete BEFORE DELETE ON machine_component
BEGIN SELECT RAISE(ABORT, 'append-only machine_component'); END;

CREATE TRIGGER harness_release_immutable_update BEFORE UPDATE ON harness_release
BEGIN SELECT RAISE(ABORT, 'append-only harness_release'); END;

CREATE TRIGGER harness_release_immutable_delete BEFORE DELETE ON harness_release
BEGIN SELECT RAISE(ABORT, 'append-only harness_release'); END;

CREATE TRIGGER model_checkpoint_immutable_update BEFORE UPDATE ON model_checkpoint
BEGIN SELECT RAISE(ABORT, 'append-only model_checkpoint'); END;

CREATE TRIGGER model_checkpoint_immutable_delete BEFORE DELETE ON model_checkpoint
BEGIN SELECT RAISE(ABORT, 'append-only model_checkpoint'); END;

CREATE TRIGGER artifact_manifest_immutable_update BEFORE UPDATE ON artifact_manifest
BEGIN SELECT RAISE(ABORT, 'append-only artifact_manifest'); END;

CREATE TRIGGER artifact_manifest_immutable_delete BEFORE DELETE ON artifact_manifest
BEGIN SELECT RAISE(ABORT, 'append-only artifact_manifest'); END;

CREATE TRIGGER model_artifact_file_immutable_update BEFORE UPDATE ON model_artifact_file
BEGIN SELECT RAISE(ABORT, 'append-only model_artifact_file'); END;

CREATE TRIGGER model_artifact_file_immutable_delete BEFORE DELETE ON model_artifact_file
BEGIN SELECT RAISE(ABORT, 'append-only model_artifact_file'); END;

CREATE TRIGGER variant_snapshot_immutable_update BEFORE UPDATE ON variant_snapshot
BEGIN SELECT RAISE(ABORT, 'append-only variant_snapshot'); END;

CREATE TRIGGER variant_snapshot_immutable_delete BEFORE DELETE ON variant_snapshot
BEGIN SELECT RAISE(ABORT, 'append-only variant_snapshot'); END;

CREATE TRIGGER lineage_node_immutable_update BEFORE UPDATE ON lineage_node
BEGIN SELECT RAISE(ABORT, 'append-only lineage_node'); END;

CREATE TRIGGER lineage_node_immutable_delete BEFORE DELETE ON lineage_node
BEGIN SELECT RAISE(ABORT, 'append-only lineage_node'); END;

CREATE TRIGGER lineage_edge_immutable_update BEFORE UPDATE ON lineage_edge
BEGIN SELECT RAISE(ABORT, 'append-only lineage_edge'); END;

CREATE TRIGGER lineage_edge_immutable_delete BEFORE DELETE ON lineage_edge
BEGIN SELECT RAISE(ABORT, 'append-only lineage_edge'); END;

CREATE TRIGGER variant_root_immutable_update BEFORE UPDATE ON variant_root
BEGIN SELECT RAISE(ABORT, 'append-only variant_root'); END;

CREATE TRIGGER variant_root_immutable_delete BEFORE DELETE ON variant_root
BEGIN SELECT RAISE(ABORT, 'append-only variant_root'); END;

CREATE TRIGGER variant_adapter_immutable_update BEFORE UPDATE ON variant_adapter
BEGIN SELECT RAISE(ABORT, 'append-only variant_adapter'); END;

CREATE TRIGGER variant_adapter_immutable_delete BEFORE DELETE ON variant_adapter
BEGIN SELECT RAISE(ABORT, 'append-only variant_adapter'); END;

CREATE TRIGGER quantization_claim_immutable_update BEFORE UPDATE ON quantization_claim
BEGIN SELECT RAISE(ABORT, 'append-only quantization_claim'); END;

CREATE TRIGGER quantization_claim_immutable_delete BEFORE DELETE ON quantization_claim
BEGIN SELECT RAISE(ABORT, 'append-only quantization_claim'); END;

CREATE TRIGGER precision_claim_immutable_update BEFORE UPDATE ON precision_claim
BEGIN SELECT RAISE(ABORT, 'append-only precision_claim'); END;

CREATE TRIGGER precision_claim_immutable_delete BEFORE DELETE ON precision_claim
BEGIN SELECT RAISE(ABORT, 'append-only precision_claim'); END;

CREATE TRIGGER creator_immutable_update BEFORE UPDATE ON creator
BEGIN SELECT RAISE(ABORT, 'append-only creator'); END;

CREATE TRIGGER creator_immutable_delete BEFORE DELETE ON creator
BEGIN SELECT RAISE(ABORT, 'append-only creator'); END;

CREATE TRIGGER creator_claim_immutable_update BEFORE UPDATE ON creator_claim
BEGIN SELECT RAISE(ABORT, 'append-only creator_claim'); END;

CREATE TRIGGER creator_claim_immutable_delete BEFORE DELETE ON creator_claim
BEGIN SELECT RAISE(ABORT, 'append-only creator_claim'); END;

CREATE TRIGGER creator_claim_value_immutable_update BEFORE UPDATE ON creator_claim_value
BEGIN SELECT RAISE(ABORT, 'append-only creator_claim_value'); END;

CREATE TRIGGER creator_claim_value_immutable_delete BEFORE DELETE ON creator_claim_value
BEGIN SELECT RAISE(ABORT, 'append-only creator_claim_value'); END;

CREATE TRIGGER date_claim_immutable_update BEFORE UPDATE ON date_claim
BEGIN SELECT RAISE(ABORT, 'append-only date_claim'); END;

CREATE TRIGGER date_claim_immutable_delete BEFORE DELETE ON date_claim
BEGIN SELECT RAISE(ABORT, 'append-only date_claim'); END;

CREATE TRIGGER date_claim_value_immutable_update BEFORE UPDATE ON date_claim_value
BEGIN SELECT RAISE(ABORT, 'append-only date_claim_value'); END;

CREATE TRIGGER date_claim_value_immutable_delete BEFORE DELETE ON date_claim_value
BEGIN SELECT RAISE(ABORT, 'append-only date_claim_value'); END;

CREATE TRIGGER variant_annotation_immutable_update BEFORE UPDATE ON variant_annotation
BEGIN SELECT RAISE(ABORT, 'append-only variant_annotation'); END;

CREATE TRIGGER variant_annotation_immutable_delete BEFORE DELETE ON variant_annotation
BEGIN SELECT RAISE(ABORT, 'append-only variant_annotation'); END;

CREATE TRIGGER judge_group_immutable_update BEFORE UPDATE ON judge_group
BEGIN SELECT RAISE(ABORT, 'append-only judge_group'); END;

CREATE TRIGGER judge_group_immutable_delete BEFORE DELETE ON judge_group
BEGIN SELECT RAISE(ABORT, 'append-only judge_group'); END;

CREATE TRIGGER benchmark_run_immutable_update BEFORE UPDATE ON benchmark_run
BEGIN SELECT RAISE(ABORT, 'append-only benchmark_run'); END;

CREATE TRIGGER benchmark_run_immutable_delete BEFORE DELETE ON benchmark_run
BEGIN SELECT RAISE(ABORT, 'append-only benchmark_run'); END;

CREATE TRIGGER run_configuration_immutable_update BEFORE UPDATE ON run_configuration
BEGIN SELECT RAISE(ABORT, 'append-only run_configuration'); END;

CREATE TRIGGER run_configuration_immutable_delete BEFORE DELETE ON run_configuration
BEGIN SELECT RAISE(ABORT, 'append-only run_configuration'); END;

CREATE TRIGGER expected_trial_immutable_update BEFORE UPDATE ON expected_trial
BEGIN SELECT RAISE(ABORT, 'append-only expected_trial'); END;

CREATE TRIGGER expected_trial_immutable_delete BEFORE DELETE ON expected_trial
BEGIN SELECT RAISE(ABORT, 'append-only expected_trial'); END;

CREATE TRIGGER retained_result_immutable_update BEFORE UPDATE ON retained_result
BEGIN SELECT RAISE(ABORT, 'append-only retained_result'); END;

CREATE TRIGGER retained_result_immutable_delete BEFORE DELETE ON retained_result
BEGIN SELECT RAISE(ABORT, 'append-only retained_result'); END;

CREATE TRIGGER result_seal_immutable_update BEFORE UPDATE ON result_seal
BEGIN SELECT RAISE(ABORT, 'append-only result_seal'); END;

CREATE TRIGGER result_seal_immutable_delete BEFORE DELETE ON result_seal
BEGIN SELECT RAISE(ABORT, 'append-only result_seal'); END;

CREATE TRIGGER result_evidence_immutable_update BEFORE UPDATE ON result_evidence
BEGIN SELECT RAISE(ABORT, 'append-only result_evidence'); END;

CREATE TRIGGER result_evidence_immutable_delete BEFORE DELETE ON result_evidence
BEGIN SELECT RAISE(ABORT, 'append-only result_evidence'); END;

CREATE TRIGGER task_attempt_immutable_update BEFORE UPDATE ON task_attempt
BEGIN SELECT RAISE(ABORT, 'append-only task_attempt'); END;

CREATE TRIGGER task_attempt_immutable_delete BEFORE DELETE ON task_attempt
BEGIN SELECT RAISE(ABORT, 'append-only task_attempt'); END;

CREATE TRIGGER check_result_immutable_update BEFORE UPDATE ON check_result
BEGIN SELECT RAISE(ABORT, 'append-only check_result'); END;

CREATE TRIGGER check_result_immutable_delete BEFORE DELETE ON check_result
BEGIN SELECT RAISE(ABORT, 'append-only check_result'); END;

CREATE TRIGGER task_commit_immutable_update BEFORE UPDATE ON task_commit
BEGIN SELECT RAISE(ABORT, 'append-only task_commit'); END;

CREATE TRIGGER task_commit_immutable_delete BEFORE DELETE ON task_commit
BEGIN SELECT RAISE(ABORT, 'append-only task_commit'); END;

CREATE TRIGGER inference_call_immutable_update BEFORE UPDATE ON inference_call
BEGIN SELECT RAISE(ABORT, 'append-only inference_call'); END;

CREATE TRIGGER inference_call_immutable_delete BEFORE DELETE ON inference_call
BEGIN SELECT RAISE(ABORT, 'append-only inference_call'); END;

CREATE TRIGGER call_counter_immutable_update BEFORE UPDATE ON call_counter
BEGIN SELECT RAISE(ABORT, 'append-only call_counter'); END;

CREATE TRIGGER call_counter_immutable_delete BEFORE DELETE ON call_counter
BEGIN SELECT RAISE(ABORT, 'append-only call_counter'); END;

CREATE TRIGGER generation_interval_immutable_update BEFORE UPDATE ON generation_interval
BEGIN SELECT RAISE(ABORT, 'append-only generation_interval'); END;

CREATE TRIGGER generation_interval_immutable_delete BEFORE DELETE ON generation_interval
BEGIN SELECT RAISE(ABORT, 'append-only generation_interval'); END;

CREATE TRIGGER trial_measurement_immutable_update BEFORE UPDATE ON trial_measurement
BEGIN SELECT RAISE(ABORT, 'append-only trial_measurement'); END;

CREATE TRIGGER trial_measurement_immutable_delete BEFORE DELETE ON trial_measurement
BEGIN SELECT RAISE(ABORT, 'append-only trial_measurement'); END;

CREATE TRIGGER billing_snapshot_immutable_update BEFORE UPDATE ON billing_snapshot
BEGIN SELECT RAISE(ABORT, 'append-only billing_snapshot'); END;

CREATE TRIGGER billing_snapshot_immutable_delete BEFORE DELETE ON billing_snapshot
BEGIN SELECT RAISE(ABORT, 'append-only billing_snapshot'); END;

CREATE TRIGGER price_snapshot_immutable_update BEFORE UPDATE ON price_snapshot
BEGIN SELECT RAISE(ABORT, 'append-only price_snapshot'); END;

CREATE TRIGGER price_snapshot_immutable_delete BEFORE DELETE ON price_snapshot
BEGIN SELECT RAISE(ABORT, 'append-only price_snapshot'); END;

CREATE TRIGGER price_rate_immutable_update BEFORE UPDATE ON price_rate
BEGIN SELECT RAISE(ABORT, 'append-only price_rate'); END;

CREATE TRIGGER price_rate_immutable_delete BEFORE DELETE ON price_rate
BEGIN SELECT RAISE(ABORT, 'append-only price_rate'); END;

CREATE TRIGGER currency_rate_immutable_update BEFORE UPDATE ON currency_rate
BEGIN SELECT RAISE(ABORT, 'append-only currency_rate'); END;

CREATE TRIGGER currency_rate_immutable_delete BEFORE DELETE ON currency_rate
BEGIN SELECT RAISE(ABORT, 'append-only currency_rate'); END;

CREATE TRIGGER cost_observation_immutable_update BEFORE UPDATE ON cost_observation
BEGIN SELECT RAISE(ABORT, 'append-only cost_observation'); END;

CREATE TRIGGER cost_observation_immutable_delete BEFORE DELETE ON cost_observation
BEGIN SELECT RAISE(ABORT, 'append-only cost_observation'); END;

CREATE TRIGGER cost_component_immutable_update BEFORE UPDATE ON cost_component
BEGIN SELECT RAISE(ABORT, 'append-only cost_component'); END;

CREATE TRIGGER cost_component_immutable_delete BEFORE DELETE ON cost_component
BEGIN SELECT RAISE(ABORT, 'append-only cost_component'); END;

CREATE TRIGGER hardware_series_immutable_update BEFORE UPDATE ON hardware_series
BEGIN SELECT RAISE(ABORT, 'append-only hardware_series'); END;

CREATE TRIGGER hardware_series_immutable_delete BEFORE DELETE ON hardware_series
BEGIN SELECT RAISE(ABORT, 'append-only hardware_series'); END;

CREATE TRIGGER hardware_sample_immutable_update BEFORE UPDATE ON hardware_sample
BEGIN SELECT RAISE(ABORT, 'append-only hardware_sample'); END;

CREATE TRIGGER hardware_sample_immutable_delete BEFORE DELETE ON hardware_sample
BEGIN SELECT RAISE(ABORT, 'append-only hardware_sample'); END;

CREATE TRIGGER context_capture_immutable_update BEFORE UPDATE ON context_capture
BEGIN SELECT RAISE(ABORT, 'append-only context_capture'); END;

CREATE TRIGGER context_capture_immutable_delete BEFORE DELETE ON context_capture
BEGIN SELECT RAISE(ABORT, 'append-only context_capture'); END;

CREATE TRIGGER context_segment_immutable_update BEFORE UPDATE ON context_segment
BEGIN SELECT RAISE(ABORT, 'append-only context_segment'); END;

CREATE TRIGGER context_segment_immutable_delete BEFORE DELETE ON context_segment
BEGIN SELECT RAISE(ABORT, 'append-only context_segment'); END;

CREATE TRIGGER context_snapshot_immutable_update BEFORE UPDATE ON context_snapshot
BEGIN SELECT RAISE(ABORT, 'append-only context_snapshot'); END;

CREATE TRIGGER context_snapshot_immutable_delete BEFORE DELETE ON context_snapshot
BEGIN SELECT RAISE(ABORT, 'append-only context_snapshot'); END;

CREATE TRIGGER context_membership_immutable_update BEFORE UPDATE ON context_membership
BEGIN SELECT RAISE(ABORT, 'append-only context_membership'); END;

CREATE TRIGGER context_membership_immutable_delete BEFORE DELETE ON context_membership
BEGIN SELECT RAISE(ABORT, 'append-only context_membership'); END;

CREATE TRIGGER context_count_immutable_update BEFORE UPDATE ON context_count
BEGIN SELECT RAISE(ABORT, 'append-only context_count'); END;

CREATE TRIGGER context_count_immutable_delete BEFORE DELETE ON context_count
BEGIN SELECT RAISE(ABORT, 'append-only context_count'); END;

CREATE TRIGGER context_gap_immutable_update BEFORE UPDATE ON context_gap
BEGIN SELECT RAISE(ABORT, 'append-only context_gap'); END;

CREATE TRIGGER context_gap_immutable_delete BEFORE DELETE ON context_gap
BEGIN SELECT RAISE(ABORT, 'append-only context_gap'); END;

CREATE TRIGGER context_analysis_immutable_update BEFORE UPDATE ON context_analysis
BEGIN SELECT RAISE(ABORT, 'append-only context_analysis'); END;

CREATE TRIGGER context_analysis_immutable_delete BEFORE DELETE ON context_analysis
BEGIN SELECT RAISE(ABORT, 'append-only context_analysis'); END;

CREATE TRIGGER context_classification_immutable_update BEFORE UPDATE ON context_classification
BEGIN SELECT RAISE(ABORT, 'append-only context_classification'); END;

CREATE TRIGGER context_classification_immutable_delete BEFORE DELETE ON context_classification
BEGIN SELECT RAISE(ABORT, 'append-only context_classification'); END;

CREATE TRIGGER review_immutable_update BEFORE UPDATE ON review
BEGIN SELECT RAISE(ABORT, 'append-only review'); END;

CREATE TRIGGER review_immutable_delete BEFORE DELETE ON review
BEGIN SELECT RAISE(ABORT, 'append-only review'); END;

CREATE TRIGGER review_grade_immutable_update BEFORE UPDATE ON review_grade
BEGIN SELECT RAISE(ABORT, 'append-only review_grade'); END;

CREATE TRIGGER review_grade_immutable_delete BEFORE DELETE ON review_grade
BEGIN SELECT RAISE(ABORT, 'append-only review_grade'); END;

CREATE TRIGGER review_comment_immutable_update BEFORE UPDATE ON review_comment
BEGIN SELECT RAISE(ABORT, 'append-only review_comment'); END;

CREATE TRIGGER review_comment_immutable_delete BEFORE DELETE ON review_comment
BEGIN SELECT RAISE(ABORT, 'append-only review_comment'); END;

CREATE TRIGGER review_evidence_immutable_update BEFORE UPDATE ON review_evidence
BEGIN SELECT RAISE(ABORT, 'append-only review_evidence'); END;

CREATE TRIGGER review_evidence_immutable_delete BEFORE DELETE ON review_evidence
BEGIN SELECT RAISE(ABORT, 'append-only review_evidence'); END;

CREATE TRIGGER review_deficiency_immutable_update BEFORE UPDATE ON review_deficiency
BEGIN SELECT RAISE(ABORT, 'append-only review_deficiency'); END;

CREATE TRIGGER review_deficiency_immutable_delete BEFORE DELETE ON review_deficiency
BEGIN SELECT RAISE(ABORT, 'append-only review_deficiency'); END;

CREATE TRIGGER review_limitation_immutable_update BEFORE UPDATE ON review_limitation
BEGIN SELECT RAISE(ABORT, 'append-only review_limitation'); END;

CREATE TRIGGER review_limitation_immutable_delete BEFORE DELETE ON review_limitation
BEGIN SELECT RAISE(ABORT, 'append-only review_limitation'); END;

CREATE TRIGGER review_finalization_immutable_update BEFORE UPDATE ON review_finalization
BEGIN SELECT RAISE(ABORT, 'append-only review_finalization'); END;

CREATE TRIGGER review_finalization_immutable_delete BEFORE DELETE ON review_finalization
BEGIN SELECT RAISE(ABORT, 'append-only review_finalization'); END;

CREATE TRIGGER original_disposition_immutable_update BEFORE UPDATE ON original_disposition
BEGIN SELECT RAISE(ABORT, 'append-only original_disposition'); END;

CREATE TRIGGER original_disposition_immutable_delete BEFORE DELETE ON original_disposition
BEGIN SELECT RAISE(ABORT, 'append-only original_disposition'); END;

CREATE TRIGGER run_invalidation_immutable_update BEFORE UPDATE ON run_invalidation
BEGIN SELECT RAISE(ABORT, 'append-only run_invalidation'); END;

CREATE TRIGGER run_invalidation_immutable_delete BEFORE DELETE ON run_invalidation
BEGIN SELECT RAISE(ABORT, 'append-only run_invalidation'); END;

CREATE TRIGGER effective_variant_observation_immutable_update BEFORE UPDATE ON effective_variant_observation
BEGIN SELECT RAISE(ABORT, 'append-only effective_variant_observation'); END;

CREATE TRIGGER effective_variant_observation_immutable_delete BEFORE DELETE ON effective_variant_observation
BEGIN SELECT RAISE(ABORT, 'append-only effective_variant_observation'); END;

CREATE TRIGGER variant_exclusion_immutable_update BEFORE UPDATE ON variant_exclusion
BEGIN SELECT RAISE(ABORT, 'append-only variant_exclusion'); END;

CREATE TRIGGER variant_exclusion_immutable_delete BEFORE DELETE ON variant_exclusion
BEGIN SELECT RAISE(ABORT, 'append-only variant_exclusion'); END;

CREATE TRIGGER resource_revision_immutable_update BEFORE UPDATE ON resource_revision
BEGIN SELECT RAISE(ABORT, 'append-only resource_revision'); END;

CREATE TRIGGER resource_revision_immutable_delete BEFORE DELETE ON resource_revision
BEGIN SELECT RAISE(ABORT, 'append-only resource_revision'); END;

CREATE TRIGGER analysis_snapshot_immutable_update BEFORE UPDATE ON analysis_snapshot
BEGIN SELECT RAISE(ABORT, 'append-only analysis_snapshot'); END;

CREATE TRIGGER analysis_snapshot_immutable_delete BEFORE DELETE ON analysis_snapshot
BEGIN SELECT RAISE(ABORT, 'append-only analysis_snapshot'); END;

CREATE TRIGGER analysis_dependency_immutable_update BEFORE UPDATE ON analysis_dependency
BEGIN SELECT RAISE(ABORT, 'append-only analysis_dependency'); END;

CREATE TRIGGER analysis_dependency_immutable_delete BEFORE DELETE ON analysis_dependency
BEGIN SELECT RAISE(ABORT, 'append-only analysis_dependency'); END;

CREATE TRIGGER analysis_factor_immutable_update BEFORE UPDATE ON analysis_factor
BEGIN SELECT RAISE(ABORT, 'append-only analysis_factor'); END;

CREATE TRIGGER analysis_factor_immutable_delete BEFORE DELETE ON analysis_factor
BEGIN SELECT RAISE(ABORT, 'append-only analysis_factor'); END;

CREATE TRIGGER analysis_category_weight_immutable_update BEFORE UPDATE ON analysis_category_weight
BEGIN SELECT RAISE(ABORT, 'append-only analysis_category_weight'); END;

CREATE TRIGGER analysis_category_weight_immutable_delete BEFORE DELETE ON analysis_category_weight
BEGIN SELECT RAISE(ABORT, 'append-only analysis_category_weight'); END;

CREATE TRIGGER analysis_subject_immutable_update BEFORE UPDATE ON analysis_subject
BEGIN SELECT RAISE(ABORT, 'append-only analysis_subject'); END;

CREATE TRIGGER analysis_subject_immutable_delete BEFORE DELETE ON analysis_subject
BEGIN SELECT RAISE(ABORT, 'append-only analysis_subject'); END;

CREATE TRIGGER analysis_trial_immutable_update BEFORE UPDATE ON analysis_trial
BEGIN SELECT RAISE(ABORT, 'append-only analysis_trial'); END;

CREATE TRIGGER analysis_trial_immutable_delete BEFORE DELETE ON analysis_trial
BEGIN SELECT RAISE(ABORT, 'append-only analysis_trial'); END;

CREATE TRIGGER analysis_score_immutable_update BEFORE UPDATE ON analysis_score
BEGIN SELECT RAISE(ABORT, 'append-only analysis_score'); END;

CREATE TRIGGER analysis_score_immutable_delete BEFORE DELETE ON analysis_score
BEGIN SELECT RAISE(ABORT, 'append-only analysis_score'); END;

CREATE TRIGGER analysis_component_immutable_update BEFORE UPDATE ON analysis_component
BEGIN SELECT RAISE(ABORT, 'append-only analysis_component'); END;

CREATE TRIGGER analysis_component_immutable_delete BEFORE DELETE ON analysis_component
BEGIN SELECT RAISE(ABORT, 'append-only analysis_component'); END;

CREATE TRIGGER analysis_cost_projection_immutable_update BEFORE UPDATE ON analysis_cost_projection
BEGIN SELECT RAISE(ABORT, 'append-only analysis_cost_projection'); END;

CREATE TRIGGER analysis_cost_projection_immutable_delete BEFORE DELETE ON analysis_cost_projection
BEGIN SELECT RAISE(ABORT, 'append-only analysis_cost_projection'); END;

CREATE TRIGGER run_factor_weight_immutable_update BEFORE UPDATE ON run_factor_weight
BEGIN SELECT RAISE(ABORT, 'append-only run_factor_weight'); END;

CREATE TRIGGER run_factor_weight_immutable_delete BEFORE DELETE ON run_factor_weight
BEGIN SELECT RAISE(ABORT, 'append-only run_factor_weight'); END;

CREATE TRIGGER run_category_weight_immutable_update BEFORE UPDATE ON run_category_weight
BEGIN SELECT RAISE(ABORT, 'append-only run_category_weight'); END;

CREATE TRIGGER run_category_weight_immutable_delete BEFORE DELETE ON run_category_weight
BEGIN SELECT RAISE(ABORT, 'append-only run_category_weight'); END;

CREATE TRIGGER run_retention_immutable_update BEFORE UPDATE ON run_retention
BEGIN SELECT RAISE(ABORT, 'append-only run_retention'); END;

CREATE TRIGGER run_retention_immutable_delete BEFORE DELETE ON run_retention
BEGIN SELECT RAISE(ABORT, 'append-only run_retention'); END;

CREATE TRIGGER additional_disposition_immutable_update BEFORE UPDATE ON additional_disposition
BEGIN SELECT RAISE(ABORT, 'append-only additional_disposition'); END;

CREATE TRIGGER additional_disposition_immutable_delete BEFORE DELETE ON additional_disposition
BEGIN SELECT RAISE(ABORT, 'append-only additional_disposition'); END;

CREATE TRIGGER analysis_trial_score_immutable_update BEFORE UPDATE ON analysis_trial_score
BEGIN SELECT RAISE(ABORT, 'append-only analysis_trial_score'); END;

CREATE TRIGGER analysis_trial_score_immutable_delete BEFORE DELETE ON analysis_trial_score
BEGIN SELECT RAISE(ABORT, 'append-only analysis_trial_score'); END;

CREATE TRIGGER analysis_finalization_immutable_update BEFORE UPDATE ON analysis_finalization
BEGIN SELECT RAISE(ABORT, 'append-only analysis_finalization'); END;

CREATE TRIGGER analysis_finalization_immutable_delete BEFORE DELETE ON analysis_finalization
BEGIN SELECT RAISE(ABORT, 'append-only analysis_finalization'); END;

CREATE TRIGGER configuration_control_immutable_update BEFORE UPDATE ON configuration_control
BEGIN SELECT RAISE(ABORT, 'append-only configuration_control'); END;

CREATE TRIGGER configuration_control_immutable_delete BEFORE DELETE ON configuration_control
BEGIN SELECT RAISE(ABORT, 'append-only configuration_control'); END;

CREATE TRIGGER source_file_inventory_immutable_update BEFORE UPDATE ON source_file_inventory
BEGIN SELECT RAISE(ABORT, 'append-only source_file_inventory'); END;

CREATE TRIGGER source_file_inventory_immutable_delete BEFORE DELETE ON source_file_inventory
BEGIN SELECT RAISE(ABORT, 'append-only source_file_inventory'); END;

CREATE TRIGGER analysis_ranking_immutable_update BEFORE UPDATE ON analysis_ranking
BEGIN SELECT RAISE(ABORT, 'append-only analysis_ranking'); END;

CREATE TRIGGER analysis_ranking_immutable_delete BEFORE DELETE ON analysis_ranking
BEGIN SELECT RAISE(ABORT, 'append-only analysis_ranking'); END;

CREATE TRIGGER analysis_exclusion_immutable_update BEFORE UPDATE ON analysis_exclusion
BEGIN SELECT RAISE(ABORT, 'append-only analysis_exclusion'); END;

CREATE TRIGGER analysis_exclusion_immutable_delete BEFORE DELETE ON analysis_exclusion
BEGIN SELECT RAISE(ABORT, 'append-only analysis_exclusion'); END;

CREATE TRIGGER result_evidence_sealed BEFORE INSERT ON result_evidence
WHEN EXISTS(SELECT 1 FROM result_seal WHERE result_id=NEW.result_id)
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER task_attempt_sealed BEFORE INSERT ON task_attempt
WHEN EXISTS(SELECT 1 FROM result_seal WHERE result_id=NEW.result_id)
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER trial_measurement_sealed BEFORE INSERT ON trial_measurement
WHEN EXISTS(SELECT 1 FROM result_seal WHERE result_id=NEW.result_id)
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER context_capture_sealed BEFORE INSERT ON context_capture
WHEN EXISTS(SELECT 1 FROM result_seal WHERE result_id=NEW.result_id)
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER source_file_inventory_sealed BEFORE INSERT ON source_file_inventory
WHEN EXISTS(SELECT 1 FROM result_seal WHERE result_id=NEW.result_id)
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER check_result_sealed BEFORE INSERT ON check_result
WHEN EXISTS(SELECT 1 FROM task_attempt t JOIN result_seal s USING(result_id)
WHERE t.attempt_id=NEW.attempt_id)
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER task_commit_sealed BEFORE INSERT ON task_commit
WHEN EXISTS(SELECT 1 FROM task_attempt t JOIN result_seal s USING(result_id)
WHERE t.attempt_id=NEW.attempt_id)
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER call_sealed BEFORE INSERT ON inference_call
WHEN NEW.role IN ('competitor','verification') AND EXISTS(SELECT 1 FROM result_seal WHERE result_id=NEW.result_id)
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER call_counter_sealed BEFORE INSERT ON call_counter
WHEN EXISTS(SELECT 1 FROM inference_call c JOIN result_seal s USING(result_id)
WHERE c.call_id=NEW.call_id AND c.role IN ('competitor','verification'))
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER generation_interval_sealed BEFORE INSERT ON generation_interval
WHEN EXISTS(SELECT 1 FROM inference_call c JOIN result_seal s USING(result_id)
WHERE c.call_id=NEW.call_id AND c.role IN ('competitor','verification'))
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER context_segment_sealed BEFORE INSERT ON context_segment
WHEN EXISTS(SELECT 1 FROM context_capture c JOIN result_seal s USING(result_id)
WHERE c.capture_id=NEW.capture_id)
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER context_snapshot_sealed BEFORE INSERT ON context_snapshot
WHEN EXISTS(SELECT 1 FROM context_capture c JOIN result_seal s USING(result_id)
WHERE c.capture_id=NEW.capture_id)
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER context_membership_sealed BEFORE INSERT ON context_membership
WHEN EXISTS(SELECT 1 FROM context_capture c JOIN result_seal s USING(result_id)
WHERE c.capture_id=NEW.capture_id)
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER context_count_sealed BEFORE INSERT ON context_count
WHEN EXISTS(SELECT 1 FROM context_capture c JOIN result_seal s USING(result_id)
WHERE c.capture_id=NEW.capture_id)
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER context_gap_sealed BEFORE INSERT ON context_gap
WHEN EXISTS(SELECT 1 FROM context_capture c JOIN result_seal s USING(result_id)
WHERE c.capture_id=NEW.capture_id)
BEGIN SELECT RAISE(ABORT, 'sealed execution facts'); END;

CREATE TRIGGER review_grade_finalized BEFORE INSERT ON review_grade
WHEN EXISTS(SELECT 1 FROM review_finalization WHERE review_id=NEW.review_id)
BEGIN SELECT RAISE(ABORT, 'finalized review'); END;

CREATE TRIGGER review_comment_finalized BEFORE INSERT ON review_comment
WHEN EXISTS(SELECT 1 FROM review_finalization WHERE review_id=NEW.review_id)
BEGIN SELECT RAISE(ABORT, 'finalized review'); END;

CREATE TRIGGER review_evidence_finalized BEFORE INSERT ON review_evidence
WHEN EXISTS(SELECT 1 FROM review_finalization WHERE review_id=NEW.review_id)
BEGIN SELECT RAISE(ABORT, 'finalized review'); END;

CREATE TRIGGER review_deficiency_finalized BEFORE INSERT ON review_deficiency
WHEN EXISTS(SELECT 1 FROM review_finalization WHERE review_id=NEW.review_id)
BEGIN SELECT RAISE(ABORT, 'finalized review'); END;

CREATE TRIGGER review_limitation_finalized BEFORE INSERT ON review_limitation
WHEN EXISTS(SELECT 1 FROM review_finalization WHERE review_id=NEW.review_id)
BEGIN SELECT RAISE(ABORT, 'finalized review'); END;

-- Public view contract v1. *_approx is plotting-only; exact pairs remain available.
-- 300-digit guard avoids infinity and denominator underflow in plain SQLite.
-- Large/small values beyond this conservative projection return NULL, never zero.
CREATE VIEW analytics_exact_value_v1 AS
SELECT value_id,numerator,denominator,
 CASE WHEN numerator='0' THEN 0.0
      WHEN length(numerator)<=300 AND length(denominator)<=300
      THEN CAST(numerator AS REAL)/CAST(denominator AS REAL) END AS value_approx,
 CASE WHEN numerator='0' OR (length(numerator)<=300 AND length(denominator)<=300)
      THEN 'available_approximate' ELSE 'outside_projection_range' END AS projection_state
FROM exact_value;

CREATE VIEW analytics_trial_v1 AS
SELECT b.template_sha256,b.run_uid,b.run_label,b.machine_snapshot_id,b.launched_at,
 c.configuration_id,c.display_label AS configuration_label,c.harness_release_id,
 c.requested_variant_snapshot_id,c.resolved_variant_snapshot_id,c.expected_trial_count,
 t.expected_trial_id,t.trial_index,r.result_id,s.facts_digest,s.terminal_status,s.sealed_at,
 CASE WHEN r.result_id IS NULL THEN 'not_retained' WHEN s.result_id IS NULL THEN 'unsealed' ELSE 'sealed' END AS retention_state,
 CASE WHEN EXISTS(SELECT 1 FROM run_invalidation i WHERE i.run_uid=b.run_uid) THEN 1 ELSE 0 END AS run_invalidated,
 CASE WHEN EXISTS(SELECT 1 FROM variant_exclusion x WHERE x.result_id=r.result_id) THEN 1 ELSE 0 END AS variant_excluded,
 m.input_tokens,m.input_coverage,m.output_tokens,m.output_coverage,m.file_count,m.loc_count,m.source_coverage,m.file_coverage,m.loc_coverage,
 e.numerator AS elapsed_seconds_num,e.denominator AS elapsed_seconds_den,e.value_approx AS elapsed_seconds_approx,m.elapsed_coverage,
 CASE WHEN length(m.input_tokens)<=300 THEN CAST(m.input_tokens AS REAL) END AS input_tokens_approx,
 CASE WHEN length(m.output_tokens)<=300 THEN CAST(m.output_tokens AS REAL) END AS output_tokens_approx,
 CASE WHEN length(m.file_count)<=300 THEN CAST(m.file_count AS REAL) END AS file_count_approx,
 CASE WHEN length(m.loc_count)<=300 THEN CAST(m.loc_count AS REAL) END AS loc_count_approx,
 (SELECT d.state FROM original_disposition d WHERE d.result_id=r.result_id ORDER BY d.publication_id DESC,d.disposition_id DESC LIMIT 1) AS original_disposition
FROM expected_trial t JOIN run_configuration c USING(run_uid,configuration_id)
JOIN benchmark_run b USING(run_uid)
LEFT JOIN retained_result r USING(expected_trial_id) LEFT JOIN result_seal s USING(result_id)
LEFT JOIN trial_measurement m USING(result_id) LEFT JOIN analytics_exact_value_v1 e ON e.value_id=m.elapsed_seconds;

CREATE VIEW analytics_review_category_v1 AS
SELECT r.review_id,r.result_id,r.judge_group_id,g.backend,g.rubric_ref,r.purpose,r.outcome,r.provenance,r.assessed_at,
 c.category_key,c.label,c.ordinal,x.grade_half_units,x.grade_half_units/2.0 AS grade_approx,x.rationale
FROM review r JOIN review_finalization f USING(review_id) JOIN judge_group g USING(judge_group_id)
JOIN review_grade x USING(review_id) JOIN rubric_category c ON c.rubric_ref=g.rubric_ref AND c.category_key=x.category_key;

CREATE VIEW analytics_analysis_status_v1 AS
SELECT a.*,
 CASE WHEN NOT EXISTS(SELECT 1 FROM analysis_dependency d WHERE d.analysis_id=a.analysis_id) THEN 'unverified_dependencies'
 WHEN EXISTS (SELECT 1 FROM analysis_dependency d JOIN resource_revision frozen
 ON frozen.resource_kind=d.resource_kind AND frozen.resource_id=d.resource_id AND frozen.publication_id=d.publication_id
 WHERE d.analysis_id=a.analysis_id AND EXISTS (
 SELECT 1 FROM resource_revision newer WHERE newer.resource_kind=d.resource_kind AND newer.resource_id=d.resource_id
 AND newer.publication_id>d.publication_id AND newer.revision_digest<>frozen.revision_digest))
 THEN 'stale' ELSE 'current' END AS freshness
FROM analysis_snapshot a JOIN analysis_finalization f USING(analysis_id);

CREATE VIEW analytics_score_v1 AS
SELECT a.analysis_id,a.analysis_digest,a.template_sha256,a.judge_group_id,a.algorithm_version,a.metadata_view,
 a.variant_comparison_mode,a.status AS analysis_status,a.freshness,a.created_at,
 s.analysis_subject_id,s.run_uid,s.configuration_id,s.status AS subject_status,s.reason,s.comparison_tier,
 s.selected_variant_snapshot_id,b.machine_snapshot_id,b.launched_at,c.harness_release_id,c.expected_trial_count,
 ranked.official_rank,ranked.tie_key,q.numerator AS quality_num,q.denominator AS quality_den,q.value_approx AS quality_approx,
 k.numerator AS combined_num,k.denominator AS combined_den,k.value_approx AS combined_approx,
 (SELECT count(*) FROM analysis_trial t WHERE t.analysis_subject_id=s.analysis_subject_id) AS roster_rows,
 (SELECT count(*) FROM analysis_trial t WHERE t.analysis_subject_id=s.analysis_subject_id AND t.result_id IS NOT NULL) AS retained_rows,
 ep.profile_snapshot_id AS existing_agent_profile_snapshot_id,ep.profile_id AS existing_agent_profile_id,
 ep.version AS existing_agent_profile_version,ep.profile_digest AS existing_agent_profile_digest,ep.display_name AS existing_agent_profile_name,
 eb.treatment AS existing_agent_treatment,eb.reproduction AS existing_agent_reproduction,eb.effective_control_digest AS existing_agent_control_digest
FROM analytics_analysis_status_v1 a JOIN analysis_subject s USING(analysis_id)
JOIN benchmark_run b USING(run_uid) JOIN run_configuration c USING(run_uid,configuration_id)
LEFT JOIN analysis_score z USING(analysis_subject_id)
LEFT JOIN analysis_ranking ranked ON ranked.analysis_subject_id=s.analysis_subject_id AND ranked.ranking_kind='combined'
LEFT JOIN analytics_exact_value_v1 q ON q.value_id=z.quality
LEFT JOIN analytics_exact_value_v1 k ON k.value_id=z.combined
LEFT JOIN configuration_existing_agent_binding eb ON eb.run_uid=s.run_uid AND eb.configuration_id=s.configuration_id AND eb.role='competitor'
LEFT JOIN existing_agent_profile_snapshot ep ON ep.profile_snapshot_id=eb.profile_snapshot_id;

CREATE VIEW analytics_current_score_v1 AS
SELECT * FROM analytics_score_v1 WHERE freshness='current';

CREATE VIEW analytics_component_v1 AS
SELECT s.analysis_id,s.analysis_subject_id,s.run_uid,s.configuration_id,c.factor,c.coverage,c.reason,
 r.numerator AS raw_num,r.denominator AS raw_den,r.value_approx AS raw_approx,
 n.numerator AS normalized_num,n.denominator AS normalized_den,n.value_approx AS normalized_approx,
 w.numerator AS contribution_num,w.denominator AS contribution_den,w.value_approx AS contribution_approx
FROM analysis_component c JOIN analysis_subject s USING(analysis_subject_id)
LEFT JOIN analytics_exact_value_v1 r ON r.value_id=c.raw_value
LEFT JOIN analytics_exact_value_v1 n ON n.value_id=c.normalized_value
LEFT JOIN analytics_exact_value_v1 w ON w.value_id=c.weighted_contribution;

CREATE VIEW analytics_generation_pair_v1 AS
SELECT c.call_id,c.result_id,c.role,g.paired_output_tokens,g.coverage,g.timing_basis,
 v.numerator AS generation_seconds_num,v.denominator AS generation_seconds_den,v.value_approx AS generation_seconds_approx,
 CASE WHEN length(g.paired_output_tokens)<=300 THEN CAST(g.paired_output_tokens AS REAL) END AS paired_output_tokens_approx
FROM generation_interval g JOIN inference_call c USING(call_id)
LEFT JOIN analytics_exact_value_v1 v ON v.value_id=g.generation_seconds;

CREATE VIEW analytics_variant_creator_v1 AS
SELECT c.variant_snapshot_id,c.node_id,c.role,c.state,v.value_ordinal,p.creator_id,p.namespace,p.public_handle,
 v.basis,v.source_id,c.reason FROM creator_claim c
LEFT JOIN creator_claim_value v USING(creator_claim_id) LEFT JOIN creator p USING(creator_id);

CREATE VIEW analytics_variant_date_v1 AS
SELECT c.variant_snapshot_id,c.node_id,c.kind,c.state,v.value_ordinal,v.raw_value,v.normalized_value,
 v.precision,v.supplied_timezone,v.basis,v.source_id,c.reason FROM date_claim c LEFT JOIN date_claim_value v USING(date_claim_id);

CREATE VIEW analytics_context_v1 AS
SELECT a.context_analysis_id,k.capture_id,k.result_id,s.snapshot_id,s.observed_at,
 s.native_occupancy_tokens,s.native_capacity_tokens,s.count_coverage,s.membership_state,
 m.segment_id,m.membership,m.basis AS membership_basis,coalesce(seg.native_label,c.category) AS category,
 CASE WHEN seg.native_label IS NOT NULL THEN 'native' ELSE c.basis END AS classification_basis,
 n.count_kind,n.token_count,n.coverage AS token_coverage,n.tokenizer_ref,
 k.task_id,k.invocation_id,k.session_id,k.agent_id,k.parent_agent_id,k.window_id,k.request_id,k.phase,k.identity_basis,k.source_digest,coalesce(seg.native_label_policy_version,c.label_policy_version) AS label_policy_version,
 seg.native_label,seg.native_label_source_id,c.category AS classified_label,a.analysis_id,a.through_entry_id,a.ledger_digest,a.status AS analysis_status
FROM context_capture k LEFT JOIN context_analysis a USING(capture_id)
JOIN context_snapshot s ON s.capture_id=k.capture_id JOIN context_membership m ON m.capture_id=s.capture_id AND m.snapshot_id=s.snapshot_id
JOIN context_segment seg ON seg.capture_id=m.capture_id AND seg.segment_id=m.segment_id
LEFT JOIN context_classification c ON c.context_analysis_id=a.context_analysis_id AND c.capture_id=m.capture_id AND c.segment_id=m.segment_id
LEFT JOIN context_count n ON n.capture_id=m.capture_id AND n.segment_id=m.segment_id;

CREATE VIEW analytics_trial_score_v1 AS
SELECT s.analysis_id,s.analysis_subject_id,s.run_uid,s.configuration_id,t.expected_trial_id,t.result_id,t.selected_review_id,
 v.numerator AS quality_num,v.denominator AS quality_den,v.value_approx AS quality_approx
FROM analysis_trial_score q JOIN analysis_subject s USING(analysis_subject_id)
JOIN analysis_finalization f USING(analysis_id)
JOIN analysis_trial t USING(analysis_subject_id,expected_trial_id)
JOIN analytics_exact_value_v1 v ON v.value_id=q.quality;

-- Additional public grains. Hops, reasons and evidence are separate child relations.
CREATE VIEW analytics_harness_comparison_v1 AS
SELECT h.comparison_id,h.comparison_digest,h.run_uid,b.template_sha256,h.preview_digest,h.common_control_digest,
 h.policy_digest,h.mode,h.inference_scope,h.coverage,h.trials,h.registry_digest,r.ordinal,c.harness_id,
 c.selected,c.readiness,CASE WHEN c.selected=0 THEN 'not_selected' ELSE c.readiness END AS cell_state,
 c.exclusion_reason,c.configuration_id,c.access_binding_id,c.model_binding_id,
 c.effort_mapping_id,c.capability_id,h.effort_contract_id,m.profile_snapshot_id,m.canonical_upstream_model_id,
 m.upstream_revision,m.checkpoint_id,m.variant_snapshot_id,e.semantic_owner,e.semantic_version,e.kind AS effort_kind,
 e.native_level,e.budget_tokens,p.kind AS access_kind,p.gateway_locality,p.inference_locality,
 (SELECT count(*) FROM harness_comparison_cell x WHERE x.comparison_id=h.comparison_id AND x.selected=1) AS selected_harnesses,
 (SELECT count(*) FROM expected_trial t WHERE t.run_uid=h.run_uid AND t.configuration_id=c.configuration_id) AS expected_trial_rows,
 ep.profile_snapshot_id AS existing_agent_profile_snapshot_id,ep.profile_id AS existing_agent_profile_id,
 ep.version AS existing_agent_profile_version,ep.profile_digest AS existing_agent_profile_digest,ep.display_name AS existing_agent_profile_name,
 eb.treatment AS existing_agent_treatment,eb.reproduction AS existing_agent_reproduction,eb.effective_control_digest AS existing_agent_control_digest
FROM harness_comparison h JOIN harness_comparison_freeze f USING(comparison_id)
JOIN benchmark_run b USING(run_uid) JOIN harness_comparison_cell c USING(comparison_id)
JOIN harness_registry_member r ON r.registry_digest=h.registry_digest AND r.harness_id=c.harness_id
JOIN effort_contract e ON e.effort_contract_id=h.effort_contract_id
LEFT JOIN access_model_binding m ON m.model_binding_id=c.model_binding_id
LEFT JOIN api_access_profile p USING(profile_snapshot_id)
LEFT JOIN configuration_existing_agent_binding eb ON eb.run_uid=h.run_uid AND eb.configuration_id=c.configuration_id AND eb.role='competitor'
LEFT JOIN existing_agent_profile_snapshot ep ON ep.profile_snapshot_id=eb.profile_snapshot_id;

CREATE VIEW analytics_harness_comparison_score_v1 AS
SELECT s.*,l.comparison_id,l.comparison_axis,l.policy_digest AS comparison_policy_digest,
 l.input_evidence_digest,l.evidence_publication_id,l.outcome_digest,l.classification AS comparison_classification,
 c.classification AS harness_classification,c.reason AS comparison_reason,
 h.harness_id,h.ordinal,h.coverage AS harness_coverage,h.selected_harnesses,h.mode AS comparison_mode,h.inference_scope,
 h.comparison_digest,h.common_control_digest,h.access_binding_id,h.model_binding_id,h.effort_mapping_id,
 h.capability_id,h.effort_contract_id,h.profile_snapshot_id,h.canonical_upstream_model_id,h.upstream_revision,
 h.effort_kind,h.native_level,h.budget_tokens,h.gateway_locality,h.inference_locality
FROM comparison_analysis_link l JOIN comparison_analysis_cell c USING(analysis_id,comparison_id)
JOIN analytics_harness_comparison_v1 h USING(comparison_id,harness_id)
JOIN analytics_score_v1 s ON s.analysis_subject_id=c.analysis_subject_id AND s.analysis_id=l.analysis_id;

CREATE VIEW analytics_request_route_v1 AS
SELECT o.*,call.result_id,call.role,call.native_request_id,b.run_uid,b.configuration_id,
 b.judge_group_id,call.judge_assessment_id,assessment.purpose AS assessment_purpose,
 assessment.reserved_review_id,review.review_id,g.group_digest AS judge_group_digest,g.backend AS judge_backend,
 m.harness_release_id AS route_harness_release_id,
 m.profile_snapshot_id,m.effort_contract_id,
 requested.kind AS requested_effort_kind,requested.native_level AS requested_native_level,requested.budget_tokens AS requested_budget_tokens,
 emitted.kind AS emitted_effort_kind,emitted.native_level AS emitted_native_level,emitted.budget_tokens AS emitted_budget_tokens,emitted.state AS emitted_effort_state,
 effective.kind AS effective_effort_kind,effective.native_level AS effective_native_level,effective.budget_tokens AS effective_budget_tokens,effective.state AS effective_effort_state,
 (SELECT count(*) FROM request_route_hop_observation h WHERE h.observation_id=o.observation_id) AS observed_hops,
 EXISTS(SELECT 1 FROM request_route_exclusion x WHERE x.observation_id=o.observation_id) AS has_exclusion
FROM request_route_observation o JOIN request_route_finalization f USING(observation_id)
JOIN inference_call call USING(call_id) JOIN configuration_access_binding b USING(access_binding_id)
LEFT JOIN judge_group g ON g.judge_group_id=b.judge_group_id
LEFT JOIN judge_assessment assessment ON assessment.assessment_id=call.judge_assessment_id
LEFT JOIN review ON review.judge_assessment_id=assessment.assessment_id
JOIN harness_route_capability cap USING(capability_id)
JOIN (SELECT m.*,binding.profile_snapshot_id FROM harness_effort_mapping m JOIN access_model_binding binding USING(model_binding_id)) m USING(effort_mapping_id)
JOIN request_effort_observation requested ON requested.observation_id=o.observation_id AND requested.stage='requested'
JOIN request_effort_observation emitted ON emitted.observation_id=o.observation_id AND emitted.stage='emitted'
JOIN request_effort_observation effective ON effective.observation_id=o.observation_id AND effective.stage='effective';

CREATE VIEW analytics_judge_configuration_v1 AS
SELECT g.*,a.binding_digest AS access_binding_digest,m.model_binding_id,m.effort_mapping_id,
 m.profile_snapshot_id AS access_profile_snapshot_id,p.profile_id AS access_profile_id,p.version AS access_profile_version,
 p.profile_digest AS access_profile_digest,p.gateway_locality,p.inference_locality,a.capability_id,a.qualification_id,
 eb.profile_snapshot_id AS existing_agent_profile_snapshot_id,ep.profile_id AS existing_agent_profile_id,
 ep.version AS existing_agent_profile_version,ep.profile_digest AS existing_agent_profile_digest,
 eb.treatment,eb.reproduction,eb.override_set_digest,eb.effective_control_digest,eb.resolved_plan_digest
FROM judge_group g LEFT JOIN configuration_access_binding a ON a.access_binding_id=g.selected_access_binding_id
LEFT JOIN harness_route_capability cap USING(capability_id)
LEFT JOIN (SELECT m.*,b.profile_snapshot_id FROM harness_effort_mapping m JOIN access_model_binding b USING(model_binding_id)) m USING(effort_mapping_id)
LEFT JOIN api_access_profile p ON p.profile_snapshot_id=m.profile_snapshot_id
LEFT JOIN configuration_existing_agent_binding eb ON eb.binding_id=g.selected_existing_agent_binding_id
LEFT JOIN existing_agent_profile_snapshot ep ON ep.profile_snapshot_id=eb.profile_snapshot_id;

CREATE TABLE domain_evidence_plan (
plan_id TEXT PRIMARY KEY, plan_version TEXT NOT NULL, plan_digest TEXT NOT NULL UNIQUE,
template_sha256 TEXT NOT NULL REFERENCES template_revision(template_sha256),
rubric_ref TEXT NOT NULL REFERENCES rubric_version(rubric_ref),
suite_schema TEXT NOT NULL CHECK(suite_schema IN ('acceptance.v1','acceptance.v2')),
policy_artifact_id TEXT NOT NULL REFERENCES evidence_artifact(artifact_id),
publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE domain_evidence_binding (
plan_id TEXT NOT NULL REFERENCES domain_evidence_plan(plan_id), ordinal INTEGER NOT NULL CHECK(ordinal>0),
requirement_id TEXT NOT NULL, category_key TEXT, criterion_key TEXT, check_key TEXT,
target_ref TEXT, case_ref TEXT, modality TEXT NOT NULL, source_role TEXT NOT NULL,
coverage_requirement TEXT NOT NULL, observation_mode TEXT, selector TEXT,
PRIMARY KEY(plan_id,ordinal)
) STRICT;

CREATE TABLE delivered_snapshot (
result_id TEXT PRIMARY KEY REFERENCES retained_result(result_id), snapshot_ref TEXT NOT NULL UNIQUE,
manifest_digest TEXT NOT NULL, template_sha256 TEXT NOT NULL REFERENCES template_revision(template_sha256),
baseline_digest TEXT NOT NULL, delivered_scope_digest TEXT NOT NULL,
coverage TEXT NOT NULL CHECK(coverage IN ('complete','partial','unavailable')),
manifest_artifact_id TEXT NOT NULL REFERENCES evidence_artifact(artifact_id),
limitation TEXT, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE delivered_snapshot_entry (
result_id TEXT NOT NULL REFERENCES delivered_snapshot(result_id), relative_path TEXT NOT NULL,
kind TEXT NOT NULL CHECK(kind IN ('regular','directory','link','unavailable')),
byte_count TEXT CHECK(byte_count='0' OR (byte_count GLOB '[1-9]*' AND byte_count NOT GLOB '*[^0-9]*')),
content_digest TEXT, artifact_id TEXT REFERENCES evidence_artifact(artifact_id), limitation TEXT,
PRIMARY KEY(result_id,relative_path),
CHECK(relative_path NOT LIKE '/%' AND relative_path NOT LIKE '%..%' AND relative_path NOT LIKE '%\%'),
CHECK(artifact_id IS NULL OR kind='regular')
) STRICT;

CREATE TABLE evidence_observation (
result_evidence_id TEXT PRIMARY KEY REFERENCES result_evidence(result_evidence_id),
plan_id TEXT NOT NULL REFERENCES domain_evidence_plan(plan_id),
report_schema TEXT NOT NULL CHECK(report_schema IN ('observation.v1','observation.v2')),
context_kind TEXT NOT NULL CHECK(context_kind IN ('web','backend','native_mobile','devops','agentic','specification')),
final_snapshot_digest TEXT NOT NULL, target_ref TEXT, build_ref TEXT, case_ref TEXT,
observation_mode TEXT, source_role TEXT NOT NULL, required_modality TEXT, coverage TEXT NOT NULL,
context_artifact_id TEXT NOT NULL REFERENCES evidence_artifact(artifact_id)
) STRICT;

CREATE TABLE variant_observed_control (
observation_id TEXT NOT NULL REFERENCES effective_variant_observation(observation_id), control_key TEXT NOT NULL,
state TEXT NOT NULL CHECK(state IN ('known','unknown','unavailable','conflicting')),
text_value TEXT, numeric_value TEXT REFERENCES exact_value(value_id), unit TEXT,
source_id TEXT REFERENCES source_observation(source_id), reason TEXT,
PRIMARY KEY(observation_id,control_key),
CHECK((state='known' AND ((text_value IS NULL)<>(numeric_value IS NULL)))
OR (state<>'known' AND text_value IS NULL AND numeric_value IS NULL AND reason IS NOT NULL))
) STRICT;

CREATE INDEX domain_plan_template_idx ON domain_evidence_plan(template_sha256,rubric_ref);
CREATE INDEX observation_plan_idx ON evidence_observation(plan_id,context_kind,observation_mode);
CREATE INDEX variant_annotation_subject_idx ON variant_annotation(result_id,kind,publication_id);
CREATE INDEX context_capture_scope_idx ON context_capture(result_id,invocation_id,window_id,request_id);

CREATE TRIGGER domain_plan_scope BEFORE INSERT ON domain_evidence_plan
WHEN NOT EXISTS(SELECT 1 FROM template_revision t WHERE t.template_sha256=NEW.template_sha256 AND t.rubric_ref=NEW.rubric_ref)
BEGIN SELECT RAISE(ABORT,'domain plan rubric/template scope'); END;
CREATE TRIGGER domain_binding_scope BEFORE INSERT ON domain_evidence_binding
WHEN (NEW.category_key IS NULL)<>(NEW.criterion_key IS NULL) OR (NEW.criterion_key IS NOT NULL AND NOT EXISTS(
SELECT 1 FROM domain_evidence_plan p JOIN rubric_criterion c USING(rubric_ref)
WHERE p.plan_id=NEW.plan_id AND c.category_key=NEW.category_key AND c.criterion_key=NEW.criterion_key))
BEGIN SELECT RAISE(ABORT,'domain evidence criterion scope'); END;
CREATE TRIGGER delivered_snapshot_scope BEFORE INSERT ON delivered_snapshot
WHEN NOT EXISTS(SELECT 1 FROM retained_result r JOIN expected_trial t USING(expected_trial_id) JOIN benchmark_run b USING(run_uid)
JOIN template_revision d ON d.template_sha256=b.template_sha256
WHERE r.result_id=NEW.result_id AND b.template_sha256=NEW.template_sha256 AND d.baseline_digest=NEW.baseline_digest)
BEGIN SELECT RAISE(ABORT,'delivered snapshot template/baseline scope'); END;
CREATE TRIGGER evidence_observation_scope BEFORE INSERT ON evidence_observation
WHEN NOT EXISTS(SELECT 1 FROM result_evidence e JOIN retained_result r USING(result_id) JOIN expected_trial t USING(expected_trial_id)
JOIN benchmark_run b USING(run_uid) JOIN domain_evidence_plan p ON p.template_sha256=b.template_sha256
JOIN delivered_snapshot d ON d.result_id=r.result_id
WHERE e.result_evidence_id=NEW.result_evidence_id AND p.plan_id=NEW.plan_id AND d.manifest_digest=NEW.final_snapshot_digest
AND ((p.suite_schema='acceptance.v1' AND NEW.report_schema='observation.v1') OR (p.suite_schema='acceptance.v2' AND NEW.report_schema='observation.v2')))
BEGIN SELECT RAISE(ABORT,'observation plan/schema/final snapshot scope'); END;
CREATE TRIGGER variant_annotation_scope BEFORE INSERT ON variant_annotation
WHEN (NEW.observation_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM effective_variant_observation o WHERE o.observation_id=NEW.observation_id AND o.result_id=NEW.result_id AND o.record_kind='annotation'))
OR (NEW.exclusion_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM variant_exclusion x WHERE x.exclusion_id=NEW.exclusion_id AND x.result_id=NEW.result_id))
BEGIN SELECT RAISE(ABORT,'variant annotation payload scope'); END;
CREATE TRIGGER variant_observation_call_scope BEFORE INSERT ON effective_variant_observation
WHEN NEW.call_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM inference_call c WHERE c.call_id=NEW.call_id AND c.result_id=NEW.result_id)
BEGIN SELECT RAISE(ABORT,'variant observation call/result scope'); END;
CREATE TRIGGER variant_observation_sealed BEFORE INSERT ON effective_variant_observation
WHEN NEW.record_kind='source_fact' AND EXISTS(SELECT 1 FROM result_seal WHERE result_id=NEW.result_id)
BEGIN SELECT RAISE(ABORT,'sealed variant source fact'); END;
CREATE TRIGGER context_capture_scope BEFORE INSERT ON context_capture
WHEN (NEW.call_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM inference_call c WHERE c.call_id=NEW.call_id AND c.result_id=NEW.result_id))
OR (NEW.task_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM retained_result r JOIN expected_trial t USING(expected_trial_id)
JOIN benchmark_run b USING(run_uid) JOIN template_task k ON k.template_sha256=b.template_sha256
WHERE r.result_id=NEW.result_id AND k.task_id=NEW.task_id))
BEGIN SELECT RAISE(ABORT,'context capture task/call/result scope'); END;

CREATE TRIGGER domain_evidence_plan_immutable_update BEFORE UPDATE ON domain_evidence_plan
BEGIN SELECT RAISE(ABORT,'append-only domain_evidence_plan'); END;

CREATE TRIGGER domain_evidence_plan_immutable_delete BEFORE DELETE ON domain_evidence_plan
BEGIN SELECT RAISE(ABORT,'append-only domain_evidence_plan'); END;

CREATE TRIGGER domain_evidence_binding_immutable_update BEFORE UPDATE ON domain_evidence_binding
BEGIN SELECT RAISE(ABORT,'append-only domain_evidence_binding'); END;

CREATE TRIGGER domain_evidence_binding_immutable_delete BEFORE DELETE ON domain_evidence_binding
BEGIN SELECT RAISE(ABORT,'append-only domain_evidence_binding'); END;

CREATE TRIGGER delivered_snapshot_immutable_update BEFORE UPDATE ON delivered_snapshot
BEGIN SELECT RAISE(ABORT,'append-only delivered_snapshot'); END;

CREATE TRIGGER delivered_snapshot_immutable_delete BEFORE DELETE ON delivered_snapshot
BEGIN SELECT RAISE(ABORT,'append-only delivered_snapshot'); END;

CREATE TRIGGER delivered_snapshot_entry_immutable_update BEFORE UPDATE ON delivered_snapshot_entry
BEGIN SELECT RAISE(ABORT,'append-only delivered_snapshot_entry'); END;

CREATE TRIGGER delivered_snapshot_entry_immutable_delete BEFORE DELETE ON delivered_snapshot_entry
BEGIN SELECT RAISE(ABORT,'append-only delivered_snapshot_entry'); END;

CREATE TRIGGER evidence_observation_immutable_update BEFORE UPDATE ON evidence_observation
BEGIN SELECT RAISE(ABORT,'append-only evidence_observation'); END;

CREATE TRIGGER evidence_observation_immutable_delete BEFORE DELETE ON evidence_observation
BEGIN SELECT RAISE(ABORT,'append-only evidence_observation'); END;

CREATE TRIGGER variant_observed_control_immutable_update BEFORE UPDATE ON variant_observed_control
BEGIN SELECT RAISE(ABORT,'append-only variant_observed_control'); END;

CREATE TRIGGER variant_observed_control_immutable_delete BEFORE DELETE ON variant_observed_control
BEGIN SELECT RAISE(ABORT,'append-only variant_observed_control'); END;

CREATE TRIGGER delivered_snapshot_sealed BEFORE INSERT ON delivered_snapshot
WHEN EXISTS(SELECT 1 FROM result_seal s WHERE s.result_id=NEW.result_id)
BEGIN SELECT RAISE(ABORT,'sealed delivered_snapshot'); END;

CREATE TRIGGER delivered_snapshot_entry_sealed BEFORE INSERT ON delivered_snapshot_entry
WHEN EXISTS(SELECT 1 FROM result_seal s WHERE s.result_id=NEW.result_id)
BEGIN SELECT RAISE(ABORT,'sealed delivered_snapshot_entry'); END;

CREATE TRIGGER evidence_observation_sealed BEFORE INSERT ON evidence_observation
WHEN EXISTS(SELECT 1 FROM result_seal s WHERE s.result_id=(SELECT result_id FROM result_evidence WHERE result_evidence_id=NEW.result_evidence_id))
BEGIN SELECT RAISE(ABORT,'sealed evidence_observation'); END;

CREATE TRIGGER variant_exclusion_scope BEFORE INSERT ON variant_exclusion
WHEN NOT EXISTS(SELECT 1 FROM effective_variant_observation o WHERE o.observation_id=NEW.observation_id AND o.result_id=NEW.result_id)
BEGIN SELECT RAISE(ABORT,'variant exclusion result scope'); END;
CREATE TRIGGER variant_control_sealed BEFORE INSERT ON variant_observed_control
WHEN EXISTS(SELECT 1 FROM effective_variant_observation o JOIN result_seal s USING(result_id)
WHERE o.observation_id=NEW.observation_id AND o.record_kind='source_fact')
BEGIN SELECT RAISE(ABORT,'sealed variant source control'); END;
CREATE VIEW analytics_evidence_observation_v1 AS
SELECT e.result_evidence_id,e.result_id,t.run_uid,t.configuration_id,t.trial_index,
p.plan_id,p.plan_version,p.plan_digest,p.rubric_ref,p.suite_schema,o.report_schema,
o.context_kind,o.final_snapshot_digest,o.target_ref,o.build_ref,o.case_ref,
o.observation_mode,o.source_role,o.required_modality,o.coverage,e.artifact_id,o.context_artifact_id
FROM evidence_observation o JOIN result_evidence e USING(result_evidence_id)
JOIN retained_result r USING(result_id) JOIN expected_trial t USING(expected_trial_id)
JOIN domain_evidence_plan p USING(plan_id);

CREATE TRIGGER review_backend_provenance BEFORE INSERT ON review
WHEN NOT EXISTS(SELECT 1 FROM judge_group g JOIN retained_result r ON r.result_id=NEW.result_id
JOIN expected_trial t USING(expected_trial_id) JOIN benchmark_run b USING(run_uid)
JOIN template_revision d ON d.template_sha256=b.template_sha256
WHERE g.judge_group_id=NEW.judge_group_id AND g.rubric_ref=d.rubric_ref
AND ((g.backend='human_review' AND NEW.provenance='human_authored')
OR (g.backend='harness_review' AND NEW.provenance='model_authored')
OR (g.backend='decision_rubric' AND NEW.provenance='code_composed_from_decisions')))
BEGIN SELECT RAISE(ABORT,'review backend/rubric/provenance mismatch'); END;

COMMIT;
