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
variant_snapshot_id TEXT PRIMARY KEY, variant_id TEXT NOT NULL, descriptor_digest TEXT NOT NULL UNIQUE,
schema_version INTEGER NOT NULL CHECK(schema_version=1), normalization_version TEXT NOT NULL,
display_label TEXT NOT NULL, family_claim TEXT, execution_fingerprint TEXT,
fingerprint_state TEXT NOT NULL CHECK(fingerprint_state IN ('complete','partial','unknown','unavailable')),
root_completeness TEXT NOT NULL CHECK(root_completeness IN ('complete','partial','unknown')),
selected_manifest_id TEXT REFERENCES artifact_manifest(manifest_id),
adapter_state TEXT NOT NULL CHECK(adapter_state IN ('known_empty','known','unknown','unavailable')),
publication_id INTEGER NOT NULL REFERENCES publication(publication_id), CHECK(fingerprint_state <> 'complete' OR execution_fingerprint IS NOT NULL)
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
annotation_id TEXT PRIMARY KEY, prior_snapshot_id TEXT NOT NULL REFERENCES variant_snapshot(variant_snapshot_id),
replacement_snapshot_id TEXT NOT NULL REFERENCES variant_snapshot(variant_snapshot_id), author_ref TEXT NOT NULL,
reason TEXT NOT NULL, annotated_at TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE judge_group (
judge_group_id TEXT PRIMARY KEY, group_digest TEXT NOT NULL UNIQUE,
backend TEXT NOT NULL CHECK(backend IN ('harness_review','decision_rubric','human_review')),
rubric_ref TEXT NOT NULL REFERENCES rubric_version(rubric_ref), policy_digest TEXT NOT NULL,
harness_release_id TEXT REFERENCES harness_release(harness_release_id),
model_checkpoint_id TEXT REFERENCES model_checkpoint(checkpoint_id),
variant_snapshot_id TEXT REFERENCES variant_snapshot(variant_snapshot_id),
requested_effort TEXT, effective_effort TEXT, decision_engine_ref TEXT, pack_ref TEXT,
reviewer_ref TEXT, form_policy_ref TEXT,
CHECK((backend='human_review' AND reviewer_ref IS NOT NULL AND form_policy_ref IS NOT NULL
AND harness_release_id IS NULL AND model_checkpoint_id IS NULL AND variant_snapshot_id IS NULL
AND requested_effort IS NULL AND effective_effort IS NULL AND decision_engine_ref IS NULL AND pack_ref IS NULL)
OR (backend<>'human_review' AND reviewer_ref IS NULL AND form_policy_ref IS NULL))
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
reason TEXT, evidence_id TEXT REFERENCES result_evidence(result_evidence_id), publication_id INTEGER NOT NULL REFERENCES publication(publication_id), UNIQUE(attempt_id,check_key)
) STRICT;

CREATE TABLE task_commit (
attempt_id TEXT NOT NULL REFERENCES task_attempt(attempt_id), ordinal INTEGER NOT NULL CHECK(ordinal>0),
commit_oid TEXT NOT NULL, parent_oid TEXT, role TEXT NOT NULL CHECK(role IN ('competitor','baseline_setup')),
PRIMARY KEY(attempt_id,ordinal)
) STRICT;

CREATE TABLE inference_call (
call_id TEXT PRIMARY KEY, result_id TEXT NOT NULL REFERENCES retained_result(result_id),
attempt_id TEXT REFERENCES task_attempt(attempt_id), review_id TEXT REFERENCES review(review_id) DEFERRABLE INITIALLY DEFERRED,
role TEXT NOT NULL CHECK(role IN ('competitor','judge','observer','verification')),
native_request_id TEXT, started_at TEXT, finished_at TEXT, status TEXT NOT NULL,
source_id TEXT REFERENCES source_observation(source_id), publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
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
call_id TEXT REFERENCES inference_call(call_id), capture_policy_digest TEXT NOT NULL,
stream_artifact_id TEXT REFERENCES evidence_artifact(artifact_id), closure_receipt_digest TEXT,
coverage TEXT NOT NULL, publication_id INTEGER NOT NULL REFERENCES publication(publication_id)
) STRICT;

CREATE TABLE context_segment (
capture_id TEXT NOT NULL REFERENCES context_capture(capture_id), segment_id TEXT NOT NULL,
source_role TEXT NOT NULL, content_artifact_id TEXT REFERENCES evidence_artifact(artifact_id),
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
decision_engine_ref TEXT NOT NULL, pack_digest TEXT NOT NULL, input_digest TEXT NOT NULL,
analysis_digest TEXT NOT NULL UNIQUE, publication_id INTEGER NOT NULL REFERENCES publication(publication_id), UNIQUE(context_analysis_id,capture_id)
) STRICT;

CREATE TABLE context_classification (
context_analysis_id TEXT NOT NULL, capture_id TEXT NOT NULL, segment_id TEXT NOT NULL,
category TEXT NOT NULL CHECK(category IN ('user','system','thinking','tool','assistant','unknown')),
basis TEXT NOT NULL CHECK(basis IN ('model_classified','native')), rationale TEXT, confidence_label TEXT,
PRIMARY KEY(context_analysis_id,segment_id),
FOREIGN KEY(context_analysis_id,capture_id) REFERENCES context_analysis(context_analysis_id,capture_id),
FOREIGN KEY(capture_id,segment_id) REFERENCES context_segment(capture_id,segment_id)
) STRICT;

CREATE TABLE review (
review_id TEXT PRIMARY KEY, result_id TEXT NOT NULL REFERENCES retained_result(result_id),
judge_group_id TEXT NOT NULL REFERENCES judge_group(judge_group_id),
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
 (SELECT count(*) FROM analysis_trial t WHERE t.analysis_subject_id=s.analysis_subject_id AND t.result_id IS NOT NULL) AS retained_rows
FROM analytics_analysis_status_v1 a JOIN analysis_subject s USING(analysis_id)
JOIN benchmark_run b USING(run_uid) JOIN run_configuration c USING(run_uid,configuration_id)
LEFT JOIN analysis_score z USING(analysis_subject_id)
LEFT JOIN analysis_ranking ranked ON ranked.analysis_subject_id=s.analysis_subject_id AND ranked.ranking_kind='combined'
LEFT JOIN analytics_exact_value_v1 q ON q.value_id=z.quality
LEFT JOIN analytics_exact_value_v1 k ON k.value_id=z.combined;

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
SELECT a.context_analysis_id,a.capture_id,k.result_id,s.snapshot_id,s.observed_at,
 s.native_occupancy_tokens,s.native_capacity_tokens,s.count_coverage,s.membership_state,
 m.segment_id,m.membership,m.basis AS membership_basis,c.category,c.basis AS classification_basis,
 n.count_kind,n.token_count,n.coverage AS token_coverage,n.tokenizer_ref
FROM context_analysis a JOIN context_capture k USING(capture_id)
JOIN context_snapshot s USING(capture_id) JOIN context_membership m USING(capture_id,snapshot_id)
LEFT JOIN context_classification c ON c.context_analysis_id=a.context_analysis_id AND c.capture_id=m.capture_id AND c.segment_id=m.segment_id
LEFT JOIN context_count n ON n.capture_id=m.capture_id AND n.segment_id=m.segment_id;

CREATE VIEW analytics_trial_score_v1 AS
SELECT s.analysis_id,s.analysis_subject_id,s.run_uid,s.configuration_id,t.expected_trial_id,t.result_id,t.selected_review_id,
 v.numerator AS quality_num,v.denominator AS quality_den,v.value_approx AS quality_approx
FROM analysis_trial_score q JOIN analysis_subject s USING(analysis_subject_id)
JOIN analysis_finalization f USING(analysis_id)
JOIN analysis_trial t USING(analysis_subject_id,expected_trial_id)
JOIN analytics_exact_value_v1 v ON v.value_id=q.quality;

COMMIT;
