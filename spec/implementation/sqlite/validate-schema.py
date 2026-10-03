#!/usr/bin/env python3
"""Exercise the proposed SQL contract in disposable databases; not an application test."""
from pathlib import Path
from tempfile import TemporaryDirectory
from fractions import Fraction
import re
import sqlite3

HERE = Path(__file__).resolve().parent
checks = 0

def check(condition, description):
    global checks
    if not condition:
        raise AssertionError(description)
    checks += 1


def insert(db, table, **row):
    names = ','.join(row)
    db.execute(f'INSERT INTO {table} ({names}) VALUES ({",".join("?" for _ in row)})', tuple(row.values()))


def rejected(db, description, fn):
    db.execute('SAVEPOINT rejected_case')
    try:
        fn()
    except sqlite3.IntegrityError:
        check(True, description)
    else:
        raise AssertionError(f'Not rejected: {description}')
    finally:
        db.execute('ROLLBACK TO rejected_case')
        db.execute('RELEASE rejected_case')


def seed(db):
    insert(db,'publication',publication_id=1,transaction_id='seed',intent_digest='seed-intent',kind='append',committed_at='2026-10-03T00:00:00Z')
    for key,n,d in [('zero','0','1'),('one','1','1'),('twenty','20','1'),('weight','25','1'),('q','80','1'),('combined','7','9'),('third','1','3'),('negative','-5','1'),('huge','9'*400,'1')]:
        insert(db,'exact_value',value_id=key,numerator=n,denominator=d)
    insert(db,'source_observation',source_id='source',source_kind='fixture',retrieved_at='2026-10-03T00:00:00Z',publication_id=1)
    insert(db,'evidence_artifact',artifact_id='artifact',content_sha256='fixture-content',relative_path='sha256/fixture',media_type='text/plain',byte_count='1',evidence_kind='source',publication_id=1)
    insert(db,'rubric_version',rubric_ref='rubric',profile_id='backend',profile_version='2',rubric_digest='rubric-digest',family='backend')
    for ordinal,key in enumerate(['developer_experience','api_interface_design','code_quality','spec','robustness','operability_documentation'],1):
        insert(db,'rubric_category',rubric_ref='rubric',category_key=key,ordinal=ordinal,label=key,default_weight='weight',business_gate=int(key=='spec'))
    insert(db,'template_revision',template_sha256='template',canonical_schema='definition/2',benchmark_type='one_shot',rubric_ref='rubric',baseline_digest='baseline',definition_artifact_id='artifact',publication_id=1)
    insert(db,'template_task',template_sha256='template',task_id='T1',ordinal='1',prompt_artifact_id='artifact')
    insert(db,'machine_snapshot',machine_snapshot_id='machine-snapshot',machine_id='machine',label='Machine',snapshot_digest='machine-digest',os_name='fixture',os_version='1',architecture='fixture',captured_at='2026-10-03T00:00:00Z',publication_id=1)
    insert(db,'harness_release',harness_release_id='harness',harness_id='fixture',version='1',adapter_version='1')
    insert(db,'model_checkpoint',checkpoint_id='base',source_namespace='fixture',repository_id='base',resolved_revision='immutable',identity_state='known')
    insert(db,'variant_snapshot',variant_snapshot_id='variant',variant_id='variant-id',descriptor_digest='descriptor',schema_version=1,normalization_version='1',display_label='Fine-tune + Q4',fingerprint_state='unknown',root_completeness='complete',adapter_state='known_empty',publication_id=1)
    insert(db,'lineage_node',variant_snapshot_id='variant',node_id='base',kind='base',checkpoint_id='base')
    insert(db,'lineage_node',variant_snapshot_id='variant',node_id='ft',kind='fine_tune')
    insert(db,'lineage_node',variant_snapshot_id='variant',node_id='quant',kind='quantization')
    insert(db,'lineage_edge',variant_snapshot_id='variant',child_node_id='ft',parent_ordinal=1,parent_node_id='base')
    insert(db,'lineage_edge',variant_snapshot_id='variant',child_node_id='quant',parent_ordinal=1,parent_node_id='ft')
    insert(db,'variant_root',variant_snapshot_id='variant',node_id='base')
    insert(db,'quantization_claim',variant_snapshot_id='variant',node_id='quant',state='known',weight_kind='quantized',native_preset='Q4_K_M',coverage='reported',basis='reported')
    insert(db,'creator',creator_id='creator',namespace='fixture',public_handle='quantizer')
    insert(db,'creator_claim',creator_claim_id='creator-claim',variant_snapshot_id='variant',node_id='quant',role='quantizer',state='known')
    for ordinal in (1,2):
        insert(db,'creator_claim_value',creator_claim_id='creator-claim',value_ordinal=ordinal,creator_id='creator',basis='reported',source_id='source')
    insert(db,'date_claim',date_claim_id='date',variant_snapshot_id='variant',node_id='quant',kind='created',state='known')
    insert(db,'date_claim_value',date_claim_id='date',value_ordinal=1,raw_value='2026-09-12',normalized_value='2026-09-12',precision='day',basis='reported',source_id='source')
    insert(db,'judge_group',judge_group_id='human',group_digest='human-digest',backend='human_review',rubric_ref='rubric',policy_digest='human-policy',reviewer_ref='self-declared-reviewer',form_policy_ref='form/1')
    insert(db,'benchmark_run',run_uid='run',run_label='same-label',template_sha256='template',machine_snapshot_id='machine-snapshot',launch_digest='launch',launched_at='2026-10-03T00:00:00Z',origin_kind='local',original_judge_group_id='human',display_currency='USD',currency_snapshot_digest='rates',jobs='6',launch_schema_version='2',publication_id=1)
    for config,trial_count in [('C1','2'),('C2','1')]:
        insert(db,'run_configuration',run_uid='run',configuration_id=config,frozen_digest=config,display_label='same-label',harness_release_id='harness',requested_variant_snapshot_id='variant',environment_policy_digest='environment',serving_controls_digest='controls',expected_trial_count=trial_count)
    for tid,config,index in [('t1','C1','1'),('t2','C1','2'),('t3','C2','1')]:
        insert(db,'expected_trial',expected_trial_id=tid,run_uid='run',configuration_id=config,trial_index=index)
    for index,tokens,seconds in [(1,'10','one'),(2,'100','twenty')]:
        rid,tid,call=f'r{index}',f't{index}',f'call{index}'
        insert(db,'retained_result',result_id=rid,expected_trial_id=tid,publication_id=1)
        insert(db,'result_evidence',result_evidence_id=f'e{index}',result_id=rid,artifact_id='artifact',phase='final',logical_name='artifact',coverage='complete',publication_id=1)
        insert(db,'task_attempt',attempt_id=f'attempt{index}',result_id=rid,task_id='T1',attempt_index='1',process_status='finished',exit_code=0,publication_id=1)
        insert(db,'inference_call',call_id=call,result_id=rid,attempt_id=f'attempt{index}',role='competitor',status='finished',publication_id=1)
        insert(db,'generation_interval',call_id=call,paired_output_tokens=tokens,generation_seconds=seconds,coverage='complete',timing_basis='native_decode')
        insert(db,'trial_measurement',result_id=rid,elapsed_seconds=seconds,elapsed_coverage='complete',input_tokens='0',input_coverage='complete',output_tokens=tokens,output_coverage='complete',file_count='2',loc_count='10',source_coverage='complete',file_coverage='complete',loc_coverage='complete',source_snapshot_digest='source-snapshot',source_policy_digest='count-policy',measurement_policy_version='1',publication_id=1)
        insert(db,'result_seal',result_id=rid,facts_digest=f'facts{index}',finalization_receipt_digest=f'receipt{index}',terminal_status='finished',sealed_at='2026-10-03T00:01:00Z',publication_id=1)
        review=f'review{index}'
        insert(db,'review',review_id=review,result_id=rid,judge_group_id='human',purpose='original',outcome='graded',provenance='human_authored',review_digest=review,artifact_digest='artifact-digest',scope_digest='scope',assessed_at='2026-10-03T00:02:00Z',publication_id=1)
        for category, in db.execute('SELECT category_key FROM rubric_category').fetchall():
            insert(db,'review_grade',review_id=review,category_key=category,grade_half_units=8,rationale='Fixture rationale')
            insert(db,'review_evidence',review_id=review,category_key=category,result_evidence_id=f'e{index}')
        for axis in ['code_quality','developer_experience','specification']:
            insert(db,'review_comment',review_id=review,comment_key=axis,comment='Fixture comment')
        insert(db,'review_finalization',review_id=review,validation_version='1',validated_digest=review,publication_id=1)
        insert(db,'original_disposition',disposition_id=f'd{index}',result_id=rid,state='graded',review_id=review,publication_id=1)
    insert(db,'resource_revision',resource_kind='run',resource_id='run',revision_digest='input-v1',publication_id=1)
    insert(db,'analysis_snapshot',analysis_id='a1',analysis_digest='analysis1',request_digest='request1',input_digest='input1',input_publication_id=1,template_sha256='template',judge_group_id='human',algorithm_version='1',scoring_policy_digest='scoring',population_digest='population',selection_digest='selection',metadata_view='as_recorded',variant_comparison_mode='exploratory',cost_policy_digest='cost',status='complete',created_at='2026-10-03T00:03:00Z',publication_id=1)
    insert(db,'analysis_dependency',analysis_id='a1',resource_kind='run',resource_id='run',publication_id=1)
    for factor,direction in [('cost','lower'),('time','lower'),('quality','higher')]:
        insert(db,'analysis_factor',analysis_id='a1',factor=factor,weight='one',direction=direction)
    for config,status in [('C1','eligible'),('C2','pending')]:
        insert(db,'analysis_subject',analysis_subject_id=config,analysis_id='a1',run_uid='run',configuration_id=config,status=status,comparison_tier='exploratory',selected_variant_snapshot_id='variant')
    for index in (1,2):
        insert(db,'analysis_trial',analysis_subject_id='C1',expected_trial_id=f't{index}',result_id=f'r{index}',selected_review_id=f'review{index}',state='retained')
        insert(db,'analysis_trial_score',analysis_subject_id='C1',expected_trial_id=f't{index}',quality='q')
    insert(db,'analysis_trial',analysis_subject_id='C2',expected_trial_id='t3',state='not_retained',reason='pending')
    insert(db,'analysis_score',analysis_subject_id='C1',quality='q',combined='combined')
    for kind in ('combined','quality'):
        insert(db,'analysis_ranking',analysis_subject_id='C1',ranking_kind=kind,official_rank='1',tie_key='stable')
    for factor,value in [('cost','zero'),('time','twenty'),('quality','q')]:
        insert(db,'analysis_component',analysis_subject_id='C1',factor=factor,raw_value=value,normalized_value='one',weighted_contribution='one',coverage='complete')
    insert(db,'analysis_finalization',analysis_id='a1',validation_version='1',validated_digest='analysis1',publication_id=1)
    db.commit()


def main():
    if sqlite3.sqlite_version_info < (3,51,3):
        raise RuntimeError('Live WAL fixture requires the supported patched SQLite runtime >=3.51.3')
    with TemporaryDirectory(prefix='axbenchmark-schema-') as directory:
        path=Path(directory)/'fixture.sqlite3'
        db=sqlite3.connect(path)
        db.executescript((HERE/'results-v1.sql').read_text())
        db.execute('PRAGMA journal_mode=WAL')
        db.execute('PRAGMA synchronous=FULL')
        seed(db)
        check(db.execute('PRAGMA foreign_keys').fetchone()==(1,), 'foreign keys enabled')
        for name, in db.execute("SELECT name FROM sqlite_schema WHERE type='view'").fetchall():
            db.execute(f'SELECT * FROM {name}').fetchall()
            check(True,f'view compiles: {name}')
        check(db.execute('SELECT count(*) FROM analytics_trial_v1').fetchone()==(3,), 'full expected roster retained')
        check(db.execute("SELECT retention_state FROM analytics_trial_v1 WHERE expected_trial_id='t3'").fetchone()==('not_retained',),'missing trial preserved')
        check(db.execute("SELECT input_tokens FROM analytics_trial_v1 WHERE result_id='r1'").fetchone()==('0',),'known zero retained')
        check(Fraction(*map(int,db.execute("SELECT numerator,denominator FROM exact_value WHERE value_id='third'").fetchone()))==Fraction(1,3),'fraction lossless')
        check(db.execute("SELECT value_approx FROM analytics_exact_value_v1 WHERE value_id='huge'").fetchone()==(None,),'large exact value not coerced')
        check(db.execute("SELECT value_approx FROM analytics_exact_value_v1 WHERE value_id='negative'").fetchone()==(-5.0,),'signed hardware value')
        rejected(db,'noncanonical count',lambda:insert(db,'exact_value',value_id='bad',numerator='00',denominator='1'))
        rejected(db,'zero denominator',lambda:insert(db,'exact_value',value_id='bad',numerator='1',denominator='0'))
        rejected(db,'foreign key',lambda:insert(db,'retained_result',result_id='bad',expected_trial_id='absent',publication_id=1))
        rejected(db,'sealed fact insertion',lambda:insert(db,'task_attempt',attempt_id='late',result_id='r1',task_id='T1',attempt_index='2',process_status='finished',publication_id=1))
        rejected(db,'fact update',lambda:db.execute("UPDATE trial_measurement SET input_tokens='1' WHERE result_id='r1'"))
        rejected(db,'finalized review insert',lambda:insert(db,'review_grade',review_id='review1',category_key='foreign',grade_half_units=8,rationale='bad'))
        rejected(db,'lineage cycle',lambda:insert(db,'lineage_edge',variant_snapshot_id='variant',child_node_id='base',parent_ordinal=1,parent_node_id='quant'))
        rejected(db,'second original review',lambda:insert(db,'review',review_id='duplicate',result_id='r1',judge_group_id='human',purpose='original',outcome='ungraded',provenance='human_authored',review_digest='dup',artifact_digest='artifact',scope_digest='scope',assessed_at='now',ungraded_reason='missing',publication_id=1))
        rejected(db,'finalized analysis insertion',lambda:insert(db,'analysis_trial',analysis_subject_id='C1',expected_trial_id='t3',state='not_retained'))
        # Check scope independently before a finalization guard can hide an error.
        insert(db,'analysis_snapshot',analysis_id='a2',analysis_digest='analysis2',request_digest='request2',input_digest='input1',input_publication_id=1,template_sha256='template',judge_group_id='human',algorithm_version='1',scoring_policy_digest='scoring',population_digest='population',selection_digest='selection',metadata_view='as_recorded',variant_comparison_mode='exploratory',cost_policy_digest='cost',status='pending',created_at='now',publication_id=1)
        insert(db,'analysis_subject',analysis_subject_id='a2-C1',analysis_id='a2',run_uid='run',configuration_id='C1',status='pending',comparison_tier='exploratory')
        rejected(db,'cross-configuration trial',lambda:insert(db,'analysis_trial',analysis_subject_id='a2-C1',expected_trial_id='t3',state='not_retained'))
        rejected(db,'cross-result review',lambda:insert(db,'analysis_trial',analysis_subject_id='a2-C1',expected_trial_id='t1',result_id='r1',selected_review_id='review2',state='retained'))
        insert(db,'cost_observation',cost_id='unknown-cost',result_id='r1',role='human_lifecycle',basis='unmeasured',coverage='unknown',measurement_scope='review',reason='labor unmeasured',publication_id=1)
        rejected(db,'unknown is not zero',lambda:insert(db,'cost_observation',cost_id='bad-cost',result_id='r1',role='human_lifecycle',basis='unmeasured',amount='zero',currency='USD',coverage='unknown',measurement_scope='review',publication_id=1))
        db.rollback()  # discard intentionally unfinished a2; do not publish a partial analysis.
        params=dict(analysis_id='a1',template_sha256='template',creator_handle='quantizer',creator_role='quantizer',quant_preset='Q4_K_M',created_day='2026-09-12',context_analysis_id='absent',count_kind='native',node_id='quant',variant_snapshot_id='variant')
        examples={}
        for block in re.split(r'-- query:',(HERE/'analysis-examples.sql').read_text())[1:]:
            name,sql=block.split('\n',1)
            examples[name]=db.execute(sql,params).fetchall()
            check(True,f'example query executes: {name}')
        check(len(examples['variant_scores'])==2,'two subjects, no creator/date fan-out')
        pooled={row[1]:row[-1] for row in examples['pooled_generation']}
        check(abs(pooled['C1']-110/21)<1e-12 and pooled['C2'] is None,'pooled paired throughput and missing trial')
        check(db.execute("SELECT freshness FROM analytics_analysis_status_v1 WHERE analysis_id='a1'").fetchone()==('current',),'initial dependencies current')
        reader=sqlite3.connect(path.as_uri()+'?mode=ro',uri=True)
        reader.execute('BEGIN')
        check(reader.execute('SELECT count(*) FROM publication').fetchone()==(1,),'reader pins initial publication')
        db.execute('BEGIN IMMEDIATE')
        insert(db,'publication',publication_id=2,transaction_id='rolled-back',intent_digest='rollback',kind='import',committed_at='now')
        insert(db,'resource_revision',resource_kind='run',resource_id='run',revision_digest='invalidation',publication_id=2)
        db.rollback()
        check(db.execute('SELECT count(*) FROM publication').fetchone()==(1,),'publication and input change rollback together')
        insert(db,'publication',publication_id=2,transaction_id='invalidate',intent_digest='invalidate',kind='append',committed_at='now')
        insert(db,'run_invalidation',invalidation_id='invalid',run_uid='run',reason='fixture',detected_at='now',publication_id=2)
        insert(db,'resource_revision',resource_kind='run',resource_id='run',revision_digest='invalidation',publication_id=2)
        db.commit()
        check(reader.execute('SELECT count(*) FROM publication').fetchone()==(1,),'pinned WAL reader unchanged')
        reader.commit()
        check(reader.execute('SELECT count(*) FROM publication').fetchone()==(2,),'next snapshot sees whole publication')
        check(db.execute("SELECT freshness FROM analytics_analysis_status_v1 WHERE analysis_id='a1'").fetchone()==('stale',),'invalidation without recomputation marks stale')
        check(db.execute('SELECT count(*) FROM analytics_current_score_v1').fetchone()==(0,),'stale absent from current view')
        backup=sqlite3.connect(Path(directory)/'backup.sqlite3')
        db.backup(backup)
        check(backup.execute('SELECT count(*) FROM publication').fetchone()==(2,),'online backup includes committed WAL')
        check(db.execute('PRAGMA integrity_check').fetchall()==[('ok',)],'integrity check')
        check(db.execute('PRAGMA foreign_key_check').fetchall()==[],'foreign key check')
        tables=db.execute("SELECT count(*) FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchone()[0]
        views=db.execute("SELECT count(*) FROM sqlite_schema WHERE type='view'").fetchone()[0]
        backup.close();reader.close();db.close()
    print(f'PASS: {checks} schema/query checks; {tables} tables, {views} views; SQLite {sqlite3.sqlite_version}. Temporary databases removed.')

if __name__=='__main__':
    main()
