-- Read-only examples for analytics view contract v1; bind named parameters.
-- Every *_approx is exploratory floating point, never the official ranking calculation.
-- Execute each query separately. validate-schema.py executes all examples with fixtures.

-- query:variant_scores
-- One row per selected (analysis, run, configuration). EXISTS avoids creator/date fan-out.
SELECT s.analysis_id, s.run_uid, s.configuration_id, v.display_label,
       s.comparison_tier, s.metadata_view, s.freshness,
       s.quality_num, s.quality_den, s.quality_approx,
       s.combined_num, s.combined_den, s.combined_approx, s.official_rank
FROM analytics_score_v1 s
LEFT JOIN variant_snapshot v ON v.variant_snapshot_id=s.selected_variant_snapshot_id
WHERE s.analysis_id=:analysis_id AND s.template_sha256=:template_sha256
  AND (:creator_handle IS NULL OR EXISTS (
    SELECT 1 FROM analytics_variant_creator_v1 c
    WHERE c.variant_snapshot_id=v.variant_snapshot_id
      AND c.role=:creator_role AND c.public_handle=:creator_handle AND c.state='known'))
  AND (:quant_preset IS NULL OR EXISTS (
    SELECT 1 FROM quantization_claim q WHERE q.variant_snapshot_id=v.variant_snapshot_id
      AND q.state='known' AND q.weight_kind='quantized' AND q.native_preset=:quant_preset))
  AND (:created_day IS NULL OR EXISTS (
    SELECT 1 FROM analytics_variant_date_v1 d WHERE d.variant_snapshot_id=v.variant_snapshot_id
      AND d.kind='created' AND d.state='known' AND d.precision='day'
      AND d.normalized_value=:created_day))
ORDER BY s.run_uid,s.configuration_id;

-- query:category_profile
-- One row per subject/category under its selected JudgeGroup. Missing trials remain in denominator.
-- Null mean indicates incomplete selected grade coverage; this is not weighted M06 Q.
SELECT s.analysis_id,s.run_uid,s.configuration_id,c.category_key,c.label,
       count(*) AS expected_trials,count(g.grade_half_units) AS graded_trials,
       CASE WHEN count(*)=count(g.grade_half_units) THEN avg(g.grade_approx) END AS mean_grade_approx
FROM analysis_subject s JOIN analysis_snapshot a USING(analysis_id)
JOIN template_revision b USING(template_sha256) JOIN rubric_category c USING(rubric_ref)
JOIN analysis_trial t USING(analysis_subject_id)
LEFT JOIN analytics_review_category_v1 g
  ON g.review_id=t.selected_review_id AND g.category_key=c.category_key
  AND g.judge_group_id=a.judge_group_id AND g.outcome='graded'
WHERE a.analysis_id=:analysis_id
GROUP BY s.analysis_subject_id,c.category_key ORDER BY s.run_uid,s.configuration_id,c.ordinal;

-- query:cost_quality_scatter
-- One row per subject. Cost raw value uses this analysis's pinned cost policy/currency projection.
SELECT s.analysis_id,s.run_uid,s.configuration_id,s.subject_status,s.reason,s.freshness,
       s.quality_approx,c.raw_approx AS cost_approx,c.raw_num AS cost_num,c.raw_den AS cost_den,
       c.coverage AS cost_coverage,t.raw_approx AS elapsed_seconds_approx
FROM analytics_score_v1 s
LEFT JOIN analytics_component_v1 c ON c.analysis_subject_id=s.analysis_subject_id AND c.factor='cost'
LEFT JOIN analytics_component_v1 t ON t.analysis_subject_id=s.analysis_subject_id AND t.factor='time'
WHERE s.analysis_id=:analysis_id;

-- query:pooled_generation
-- One row per run/configuration, all expected trials. Aggregate numerators and durations, not ratios.
-- This graph projection is conservative: no comparable number if any call lacks complete paired timing.
WITH trial_pairs AS (
 SELECT t.expected_trial_id,count(c.call_id) AS calls,
        sum(CASE WHEN g.coverage='complete' AND g.paired_output_tokens_approx IS NOT NULL
                  AND g.generation_seconds_approx>0 THEN 1 ELSE 0 END) AS paired_calls,
        sum(g.paired_output_tokens_approx) AS tokens_approx,
        sum(g.generation_seconds_approx) AS seconds_approx
 FROM analytics_trial_v1 t
 LEFT JOIN inference_call c ON c.result_id=t.result_id AND c.role='competitor'
 LEFT JOIN analytics_generation_pair_v1 g ON g.call_id=c.call_id
 WHERE t.template_sha256=:template_sha256
 GROUP BY t.expected_trial_id
)
SELECT t.run_uid,t.configuration_id,count(*) AS expected_trials,
       sum(CASE WHEN t.retention_state='sealed' THEN 1 ELSE 0 END) AS sealed_trials,
       sum(p.calls) AS calls,sum(p.paired_calls) AS paired_calls,
       CASE WHEN min(t.retention_state='sealed')=1 AND min(t.run_invalidated=0)=1
                 AND min(t.variant_excluded=0)=1 AND min(p.calls>0)=1
                 AND sum(p.calls)=sum(p.paired_calls) AND sum(p.seconds_approx)>0
            THEN sum(p.tokens_approx)/sum(p.seconds_approx) END AS pooled_generation_tps_approx
FROM analytics_trial_v1 t JOIN trial_pairs p USING(expected_trial_id)
GROUP BY t.run_uid,t.configuration_id;

-- query:verification_outcomes
-- One row per result; process failure and check infrastructure are independent axes.
WITH checks AS (
 SELECT a.result_id,
        sum(c.outcome='PASS') AS passed_checks,sum(c.outcome='FAIL') AS failed_checks,
        sum(c.outcome='UNVERIFIED') AS unverified_checks,
        sum(c.infrastructure_state IN ('missing_prerequisite','broken')) AS infrastructure_gaps
 FROM task_attempt a JOIN check_result c USING(attempt_id) GROUP BY a.result_id
), attempts AS (
 SELECT result_id,count(*) AS task_attempts,sum(exit_code<>0) AS nonzero_exits
 FROM task_attempt GROUP BY result_id
)
SELECT t.run_uid,t.configuration_id,t.trial_index,t.result_id,t.retention_state,
       t.terminal_status,t.original_disposition,a.task_attempts,a.nonzero_exits,
       c.passed_checks,c.failed_checks,c.unverified_checks,c.infrastructure_gaps
FROM analytics_trial_v1 t LEFT JOIN checks c USING(result_id) LEFT JOIN attempts a USING(result_id)
WHERE t.template_sha256=:template_sha256;

-- query:context_rows
-- One row per snapshot/segment for one selected count basis. Occupancy is a gauge: never SUM it.
-- Hidden/unclassified membership remains explicit; classifier labels cannot establish exact counts.
SELECT context_analysis_id,result_id,snapshot_id,observed_at,native_occupancy_tokens,native_capacity_tokens,
       count_coverage,membership_state,segment_id,membership,membership_basis,
       coalesce(category,'unknown') AS category,classification_basis,count_kind,token_count,token_coverage
FROM analytics_context_v1
WHERE context_analysis_id=:context_analysis_id AND (count_kind=:count_kind OR count_kind IS NULL)
ORDER BY observed_at,snapshot_id,segment_id;

-- query:lineage_graph
-- One row per edge, retaining ordered parents and explicit unknown boundaries.
WITH RECURSIVE ancestry(node_id) AS (
 SELECT :node_id UNION
 SELECT e.parent_node_id FROM lineage_edge e JOIN ancestry a ON a.node_id=e.child_node_id
 WHERE e.variant_snapshot_id=:variant_snapshot_id AND e.parent_node_id IS NOT NULL
)
SELECT n.node_id,n.kind,n.checkpoint_id,n.output_manifest_id,e.parent_ordinal,e.parent_node_id,e.unknown_parent_reason
FROM ancestry a JOIN lineage_node n ON n.node_id=a.node_id AND n.variant_snapshot_id=:variant_snapshot_id
LEFT JOIN lineage_edge e ON e.variant_snapshot_id=n.variant_snapshot_id AND e.child_node_id=n.node_id
ORDER BY n.node_id,e.parent_ordinal;

-- query:token_source_means
-- One row per run/configuration across the full frozen roster; arithmetic is plotting-only.
-- A missing/partial trial makes the applicable mean NULL, while coverage counts remain visible.
SELECT run_uid,configuration_id,count(*) AS expected_trials,
       sum(CASE WHEN input_coverage='complete' THEN 1 ELSE 0 END) AS complete_input_trials,
       sum(CASE WHEN output_coverage='complete' THEN 1 ELSE 0 END) AS complete_output_trials,
       sum(CASE WHEN file_coverage='complete' THEN 1 ELSE 0 END) AS complete_file_trials,
       sum(CASE WHEN loc_coverage='complete' THEN 1 ELSE 0 END) AS complete_loc_trials,
       CASE WHEN count(*)=count(CASE WHEN retention_state='sealed' AND input_coverage='complete' THEN input_tokens_approx END)
            THEN avg(input_tokens_approx) END AS mean_input_tokens_approx,
       CASE WHEN count(*)=count(CASE WHEN retention_state='sealed' AND output_coverage='complete' THEN output_tokens_approx END)
            THEN avg(output_tokens_approx) END AS mean_output_tokens_approx,
       CASE WHEN count(*)=count(CASE WHEN retention_state='sealed' AND file_coverage='complete' THEN file_count_approx END)
            THEN avg(file_count_approx) END AS mean_file_count_approx,
       CASE WHEN count(*)=count(CASE WHEN retention_state='sealed' AND loc_coverage='complete' THEN loc_count_approx END)
            THEN avg(loc_count_approx) END AS mean_loc_approx,
       max(run_invalidated) AS run_invalidated,max(variant_excluded) AS variant_excluded
FROM analytics_trial_v1 WHERE template_sha256=:template_sha256
GROUP BY run_uid,configuration_id;
