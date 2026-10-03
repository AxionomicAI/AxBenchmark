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
    insert(db,'template_revision',template_sha256='template',canonical_schema='definition/2',benchmark_type='one_shot',project_type='backend',target_mode='from_scratch',rubric_ref='rubric',baseline_digest='baseline',definition_artifact_id='artifact',publication_id=1)
    insert(db,'template_task',template_sha256='template',task_id='T1',ordinal='1',prompt_artifact_id='artifact')
    insert(db,'machine_snapshot',machine_snapshot_id='machine-snapshot',machine_id='machine',label='Machine',snapshot_digest='machine-digest',os_name='fixture',os_version='1',architecture='fixture',captured_at='2026-10-03T00:00:00Z',publication_id=1)
    insert(db,'harness_release',harness_release_id='harness',harness_id='fixture',version='1',adapter_version='1')
    insert(db,'model_checkpoint',checkpoint_id='base',source_namespace='fixture',repository_id='base',resolved_revision='immutable',identity_state='known')
    insert(db,'variant_snapshot',variant_snapshot_id='variant',variant_id='variant-id',descriptor_revision=1,descriptor_digest='descriptor',schema_version=1,normalization_version='1',display_label='Fine-tune + Q4',fingerprint_state='unknown',root_completeness='complete',adapter_state='known_empty',publication_id=1)
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


def validate_existing_profiles(db):
    """Independently authored fictional declarations; no private-profile data, shell, config, credential or agent access."""
    stamp='2026-10-03T01:00:00Z'
    profile=dict(profile_id='example-agent',version=1,profile_digest='example-agent-v1',display_name='example-agent',harness_release_id='claude_code',distribution_id='fixture-claude_code',source_kind='shell_alias',sanitized_source_description='Registered environment-prefixed Claude alias',sanitized_source_digest='sanitized-declarations',executable_identity_digest='binary-identity',inspection_id='inspection',inspection_digest='inspection-digest',parser_version='1',control_registry_version=1,settings_precedence_digest='layers',evidence_set_id='route-evidence',observed_at=stamp,publication_id=2)
    insert(db,'existing_agent_profile_snapshot',profile_snapshot_id='example-agent-v1',**profile)
    insert(db,'existing_agent_profile_role',profile_snapshot_id='example-agent-v1',role='competitor')
    insert(db,'existing_agent_profile_role',profile_snapshot_id='example-agent-v1',role='harness_judge')
    declarations=[('endpoint','https://launcher.example.invalid/messages'),('model','fixture-launcher-model'),('small_fast_model','fixture-launcher-model'),('default_haiku_model','fixture-launcher-model'),('native_effort','fixture-deep'),('thinking_budget_tokens',1536),('output_limit_tokens',4096),('context_limit_tokens',16384),('request_timeout_ms',45000),('auto_compact_window',16384),('auth_token_presence','present_resolution_unverified'),('api_key_presence','present_resolution_unverified'),('thinking_enabled',True),('plugins_enabled',False),('skip_permission_prompt',False)]
    for ordinal,(key,value) in enumerate(declarations,1):
        field='boolean_value' if isinstance(value,bool) else 'integer_value' if isinstance(value,int) else 'text_value'
        val=int(value) if isinstance(value,bool) else str(value)
        insert(db,'existing_agent_profile_control',control_id=f'declaration-{ordinal}',profile_snapshot_id='example-agent-v1',ordinal=ordinal,control_key=key,layer_kind='settings' if key in ('thinking_enabled','plugins_enabled','skip_permission_prompt','auto_compact_window') else 'environment',origin='declared',value_state='set',support_state='unverified',effective_state='unknown',evidence_set_id='route-evidence',**{field:val})
    control=dict(profile_snapshot_id='example-agent-v1',control_key='system_prompt_suffix',layer_kind='settings',origin='inherited',support_state='unverified',effective_state='unknown',evidence_set_id='route-evidence')
    for ordinal,state in enumerate(('unset','empty','inherited','set'),20):
        extra={'text_value':''} if state=='empty' else {'text_value':'captured value'} if state=='set' else {'reason':'inherited source unresolved'} if state=='inherited' else {}
        insert(db,'existing_agent_profile_control',control_id=f'state-{state}',ordinal=ordinal,value_state=state,**control,**extra)
    rejected(db,'credential declaration stores presence only',lambda:insert(db,'existing_agent_profile_control',control_id='secret',ordinal=30,value_state='set',**dict(control,control_key='auth_token_presence',text_value='synthetic-secret-value')))
    rejected(db,'registry rejects private executable/source/credential control',lambda:insert(db,'existing_agent_profile_control',control_id='private',ordinal=30,value_state='set',**dict(control,control_key='credential_ref',text_value='synthetic-local-locator')))
    rejected(db,'numeric declaration uses canonical integer type',lambda:insert(db,'existing_agent_profile_control',control_id='bad-integer',ordinal=30,value_state='set',**dict(control,control_key='thinking_budget_tokens',text_value='1536')))
    asset=dict(profile_snapshot_id='example-agent-v1',relative_binding='instructions/agent.md',kind='instruction',content_digest='instruction-digest',action='preserve',provenance_digest='source-asset',capability_state='not_required',isolation_state='qualified',evidence_set_id='route-evidence')
    rejected(db,'behavioral asset must use safe relative binding',lambda:insert(db,'existing_agent_profile_asset',asset_id='private-path',**dict(asset,relative_binding='/private/profile/history')))
    insert(db,'existing_agent_profile_asset',asset_id='instruction',**asset)
    insert(db,'existing_agent_profile_seal',profile_snapshot_id='example-agent-v1',validated_digest='example-agent-v1')
    rejected(db,'sealed source profile cannot gain controls',lambda:insert(db,'existing_agent_profile_control',control_id='late',ordinal=31,value_state='unset',**control))
    rejected(db,'sealed source profile cannot gain assets',lambda:insert(db,'existing_agent_profile_asset',asset_id='late-asset',**dict(asset,relative_binding='instructions/late.md')))
    rejected(db,'sealed source profile cannot gain roles',lambda:insert(db,'existing_agent_profile_role',profile_snapshot_id='example-agent-v1',role='planner'))
    rejected(db,'personal profile snapshot immutable',lambda:db.execute("UPDATE existing_agent_profile_snapshot SET display_name='changed' WHERE profile_snapshot_id='example-agent-v1'"))
    insert(db,'benchmark_run',run_uid='existing-run',run_label='Existing agent fixtures',template_sha256='template',machine_snapshot_id='machine-snapshot',launch_digest='existing-launch',launched_at=stamp,origin_kind='local',original_judge_group_id='human',display_currency='USD',currency_snapshot_digest='rates',jobs='1',launch_schema_version='2',publication_id=2)
    for name,harness in [('current','claude_code'),('clean','claude_code'),('other-profile','claude_code'),('wrong-release','codex')]:
        insert(db,'run_configuration',run_uid='existing-run',configuration_id=name,frozen_digest=name,display_label=name,harness_release_id=harness,environment_policy_digest='environment',serving_controls_digest='controls',expected_trial_count='1')
    binding=dict(run_uid='existing-run',configuration_id='current',role='competitor',profile_snapshot_id='example-agent-v1',treatment='existing',reproduction='captured_existing',effective_control_digest='captured-controls',resolved_plan_digest='current-plan',qualification_digest='ordinary-execution-and-isolation',isolation_state='qualified',model_evidence_state='unverified',effort_selection='harness_default',evidence_set_id='route-evidence',publication_id=2)
    rejected(db,'profile cannot bind wrong installed harness release',lambda:insert(db,'configuration_existing_agent_binding',binding_id='bad-release',**dict(binding,configuration_id='wrong-release')))
    rejected(db,'profile cannot bind undeclared role',lambda:insert(db,'configuration_existing_agent_binding',binding_id='bad-role',**dict(binding,role='planner')))
    rejected(db,'optional route cannot borrow another run/configuration',lambda:insert(db,'configuration_existing_agent_binding',binding_id='bad-route',**dict(binding,access_binding_id='claude_code')))
    rejected(db,'clean treatment cannot claim exact captured reproduction',lambda:insert(db,'configuration_existing_agent_binding',binding_id='bad-clean',**dict(binding,treatment='clean')))
    insert(db,'configuration_existing_agent_binding',binding_id='current',**binding)
    check(db.execute("SELECT access_binding_id,effort_contract_id,effort_selection FROM configuration_existing_agent_binding WHERE binding_id='current'").fetchone()==(None,None,'harness_default'),'ordinary inherited profile requires neither API access profile nor strict effort contract')
    insert(db,'existing_agent_profile_control',control_id='clean-override',binding_id='clean',ordinal=1,value_state='set',**dict(control,origin='reviewed_override',layer_kind='override',text_value='Reviewed benchmark override'))
    insert(db,'existing_agent_profile_asset',asset_id='clean-remove',binding_id='clean',**dict(asset,action='remove'))
    insert(db,'configuration_existing_agent_binding',binding_id='clean',**dict(binding,configuration_id='clean',treatment='clean',reproduction='transformed',override_set_digest='reviewed-clean-changes',effective_control_digest='clean-controls',resolved_plan_digest='clean-plan'))
    rejected(db,'closed treatment cannot gain overrides',lambda:insert(db,'existing_agent_profile_control',control_id='late-override',binding_id='clean',ordinal=2,value_state='unset',**dict(control,origin='reviewed_override',layer_kind='override')))
    rejected(db,'binding cannot change treatment',lambda:db.execute("UPDATE configuration_existing_agent_binding SET treatment='clean' WHERE binding_id='current'"))
    rejected(db,'profile controls immutable',lambda:db.execute("UPDATE existing_agent_profile_control SET text_value='different' WHERE control_id='declaration-5'"))
    check(db.execute("SELECT text_value,integer_value,effective_state FROM existing_agent_profile_control WHERE control_key IN ('native_effort','thinking_budget_tokens','output_limit_tokens','context_limit_tokens') AND binding_id IS NULL ORDER BY ordinal").fetchall()==[('fixture-deep',None,'unknown'),(None,'1536','unknown'),(None,'4096','unknown'),(None,'16384','unknown')],'effort, budget, output and context remain distinct unverified declarations')
    check(db.execute("SELECT value_state,text_value,integer_value FROM existing_agent_profile_control WHERE control_id LIKE 'state-%' ORDER BY ordinal").fetchall()==[('unset',None,None),('empty','',None),('inherited',None,None),('set','captured value',None)],'unset, explicit empty, inherited unknown and set remain distinct')
    check(db.execute("SELECT count(*) FROM existing_agent_profile_control WHERE control_key IN ('auth_token_presence','api_key_presence') AND effective_state='unknown'").fetchone()==(2,),'simultaneous credential presence retained without guessed conflict')
    insert(db,'existing_agent_profile_snapshot',profile_snapshot_id='example-agent-v2',**dict(profile,version=2,profile_digest='example-agent-v2',sanitized_source_digest='new-sanitized-declarations'))
    insert(db,'existing_agent_profile_role',profile_snapshot_id='example-agent-v2',role='competitor')
    insert(db,'existing_agent_profile_seal',profile_snapshot_id='example-agent-v2',validated_digest='example-agent-v2')
    insert(db,'configuration_existing_agent_binding',binding_id='other-profile',**dict(binding,configuration_id='other-profile',profile_snapshot_id='example-agent-v2',effective_control_digest='other-controls',resolved_plan_digest='other-plan'))
    check(db.execute("SELECT profile_snapshot_id FROM configuration_existing_agent_binding WHERE binding_id='current'").fetchone()==('example-agent-v1',),'new profile version leaves frozen configuration unchanged')
    insert(db,'configuration_existing_agent_binding',binding_id='matrix-profile',**dict(binding,run_uid='matrix-run',configuration_id='claude_code',resolved_plan_digest='matrix-profile-plan',effort_selection='contract',effort_contract_id='effort',access_binding_id='claude_code'))
    judge=dict(backend='harness_review',rubric_ref='rubric',policy_digest='judge-policy-with-profile-treatment-digest',harness_release_id='claude_code')
    insert(db,'judge_group',judge_group_id='profile-judge',group_digest='profile-judge-digest',selected_existing_agent_binding_id='judge-profile',**judge)
    judge_binding=dict(binding,role='harness_judge',run_uid=None,configuration_id=None,judge_group_id='profile-judge',resolved_plan_digest='judge-profile-plan')
    rejected(db,'judge profile cannot masquerade as competitor scope',lambda:insert(db,'configuration_existing_agent_binding',binding_id='wrong-judge-scope',**dict(judge_binding,run_uid='existing-run',configuration_id='current')))
    rejected(db,'human group cannot carry harness profile',lambda:insert(db,'configuration_existing_agent_binding',binding_id='wrong-backend',**dict(judge_binding,judge_group_id='human')))
    insert(db,'configuration_existing_agent_binding',binding_id='judge-profile',**judge_binding)
    check(db.execute("SELECT run_uid,configuration_id,judge_group_id FROM configuration_existing_agent_binding WHERE binding_id='judge-profile'").fetchone()==(None,None,'profile-judge'),'additional judge profile belongs to actual JudgeGroup without fabricated competitor subject')
    forbidden={'credential_ref' ,'credential_value','api_key','access_token','source_path','executable_path','raw_shell','config_directory','history','sessions','auth_store'}
    tables=['existing_agent_profile_snapshot','existing_agent_profile_role','existing_agent_profile_control','existing_agent_profile_asset','existing_agent_profile_seal','configuration_existing_agent_binding']
    check(all(not forbidden.intersection(c[1] for c in db.execute(f'PRAGMA table_info({table})')) for table in tables),'launcher schema has no credential/private-source/history storage slots')


def validate_harness_routes(db, matrix_sql, existing_sql):
    """Offline route evidence, matrix closure and analysis fixtures; no provider conformance claim."""
    stamp='2026-10-03T01:00:00Z'
    pub=2
    insert(db,'access_evidence_set',evidence_set_id='route-evidence',evidence_digest='route-evidence-digest',publication_id=pub)
    for n in (1,2):
        insert(db,'access_evidence_item',evidence_set_id='route-evidence',ordinal=n,source_id='source',pointer=f'fixture/{n}')
    insert(db,'access_evidence_seal',evidence_set_id='route-evidence',validated_digest='route-evidence-digest')
    ev='route-evidence'
    insert(db,'api_access_profile',profile_snapshot_id='proxy-v1',profile_id='proxy',version=1,profile_digest='proxy-digest',display_name='Fixture proxy',kind='litellm',public_account_ref='public-account',routing_policy_digest='pinned-policy',gateway_version='fixture',gateway_config_digest='gateway-config',gateway_locality='local',inference_locality='remote',evidence_set_id=ev,created_at=stamp,publication_id=pub)
    insert(db,'api_access_role',profile_snapshot_id='proxy-v1',role='competitor')
    for ordinal,kind,origin in [(1,'litellm','http://127.0.0.1:4000'),(2,'openrouter','https://fixture.invalid')]:
        insert(db,'api_route_hop',profile_snapshot_id='proxy-v1',ordinal=ordinal,kind=kind,endpoint_origin=origin,endpoint_path='/v1',input_protocol='openai_responses',output_protocol='openai_responses',provider_id='provider',deployment_id='pinned',region='region',tier='tier',upstream_state='declared',gateway_locality='local' if ordinal==1 else 'remote',inference_locality='remote',evidence_set_id=ev)
    insert(db,'api_access_profile_seal',profile_snapshot_id='proxy-v1',validated_digest='proxy-digest')
    rejected(db,'sealed profile cannot grow roles',lambda:insert(db,'api_access_role',profile_snapshot_id='proxy-v1',role='planner'))
    rejected(db,'profile immutable',lambda:db.execute("UPDATE api_access_profile SET gateway_locality='remote' WHERE profile_snapshot_id='proxy-v1'"))
    insert(db,'access_model_binding',model_binding_id='binding',binding_digest='binding-digest',profile_snapshot_id='proxy-v1',harness_selectable_id='fixture-selector',gateway_alias='fixture-alias',canonical_upstream_model_id='fixture-upstream',upstream_revision='immutable',checkpoint_id='base',variant_snapshot_id='variant',provider_id='provider',deployment_id='pinned',binding_status='declared',observed_at=stamp,evidence_set_id=ev,publication_id=pub)
    effort=dict(contract_id='native-effort',version=1,contract_digest='effort-digest',checkpoint_id='base',variant_snapshot_id='variant',semantic_owner='fixture-model-owner',semantic_version='fixture/1',kind='native_level',native_level='fixture-deep',reasoning_mode='enabled',output_limit_tokens='4096',output_limit_state='known',evidence_set_id=ev,publication_id=pub)
    insert(db,'effort_contract',effort_contract_id='effort',**effort)
    rejected(db,'level and token budget exclusive',lambda:insert(db,'effort_contract',effort_contract_id='invalid-effort',**dict(effort,contract_id='bad',contract_digest='bad',budget_tokens='100')))
    insert(db,'effort_contract',effort_contract_id='different-effort',**dict(effort,contract_id='other',contract_digest='different-effort',native_level='fixture-shallow'))
    registry=['claude_code','codex','grok_cli','pi','cursor_cli','opencode']
    for ordinal,harness in enumerate(registry,1):
        insert(db,'harness_registry_member',registry_digest='six-v1',harness_id=harness,ordinal=ordinal)
        insert(db,'harness_release',harness_release_id=harness,harness_id=harness,version='fixture/1',adapter_version='fixture/1')
        insert(db,'harness_effort_mapping',effort_mapping_id=harness,mapping_digest=f'map-{harness}',harness_release_id=harness,distribution_id=f'fixture-{harness}',model_binding_id='binding',effort_contract_id='effort',translation_semantics='fixture exact mapping',support_status='exact',evidence_set_id=ev,publication_id=pub)
        for ordinal_setting,stage,name,value in [(1,'launch','fixture.reasoning','fixture-deep'),(2,'upstream','fixture-native-setting','fixture-deep'),(3,'upstream','fixture-reasoning-mode','enabled')]:
            insert(db,'harness_effort_setting',effort_mapping_id=harness,ordinal=ordinal_setting,stage=stage,setting_name=name,text_value=value)
        insert(db,'harness_effort_mapping_seal',effort_mapping_id=harness,validated_digest=f'map-{harness}')
        insert(db,'harness_route_capability',capability_id=harness,capability_digest=f'cap-{harness}',effort_mapping_id=harness,platform='fixture',gateway_version='fixture',gateway_config_digest='gateway-config',protocol='openai_responses',documented_support='experimental',installed_conformance='passed' if ordinal<=2 else 'unverified',tool_state='fixture',stream_state='fixture',effort_state='fixture',route_state='fixture',evidence_set_id=ev,publication_id=pub)
        insert(db,'harness_route_capability_seal',capability_id=harness,validated_digest=f'cap-{harness}')
        if ordinal<=2:
            insert(db,'route_qualification',qualification_id=harness,diagnostic_job_id=f'qual-{harness}',outcome_digest=f'qual-digest-{harness}',capability_id=harness,plan_digest='fixture-plan',fixture_ref='qualification-fixture/1',consent_ref='explicit-fixture-consent',model_request_budget='2',output_token_budget='100',time_budget_seconds='twenty',execution_state='passed',tool_state='passed',stream_state='passed',model_state='unverified',effort_state='declared',route_state='declared',attempt_coverage='unknown',coverage_reason='gateway internal attempts unavailable',verification_accounting_ref=f'm03:{harness}',settlement_receipt_digest=f'settled-{harness}',evidence_set_id=ev,completed_at=stamp,publication_id=pub)
    rejected(db,'sealed multi-field effort mapping cannot grow settings',lambda:insert(db,'harness_effort_setting',effort_mapping_id='claude_code',ordinal=4,stage='upstream',setting_name='late',text_value='late'))
    rejected(db,'sealed capability cannot gain limitations',lambda:insert(db,'harness_capability_limitation',capability_id='claude_code',ordinal=1,code='late',detail='late'))
    check(db.execute("SELECT count(*) FROM harness_effort_setting WHERE effort_mapping_id='claude_code' AND stage='upstream'").fetchone()==(2,),'effort mapping retains multiple upstream controls')
    check(db.execute('SELECT count(*) FROM retained_result').fetchone()==(2,) and db.execute('SELECT count(*) FROM route_qualification').fetchone()==(2,),'qualification requires no fabricated result/call')
    insert(db,'model_checkpoint',checkpoint_id='other-base',identity_state='known',source_namespace='fixture',repository_id='other',resolved_revision='other')
    insert(db,'access_model_binding',model_binding_id='other-binding',binding_digest='other-binding',profile_snapshot_id='proxy-v1',harness_selectable_id='other',checkpoint_id='other-base',binding_status='declared',observed_at=stamp,evidence_set_id=ev,publication_id=pub)
    rejected(db,'effort model identity scope',lambda:insert(db,'harness_effort_mapping',effort_mapping_id='bad',mapping_digest='bad',harness_release_id='claude_code',distribution_id='fixture',model_binding_id='other-binding',effort_contract_id='effort',translation_semantics='none',support_status='exact',evidence_set_id=ev,publication_id=pub))
    insert(db,'benchmark_run',run_uid='matrix-run',run_label='same-label',template_sha256='template',machine_snapshot_id='machine-snapshot',launch_digest='matrix-launch',launched_at=stamp,origin_kind='local',original_judge_group_id='human',display_currency='USD',currency_snapshot_digest='rates',jobs='1',launch_schema_version='2',publication_id=pub)
    for harness in registry[:2]:
        insert(db,'run_configuration',run_uid='matrix-run',configuration_id=harness,frozen_digest=harness,display_label='same-label',harness_release_id=harness,requested_variant_snapshot_id='variant',environment_policy_digest='environment',serving_controls_digest='controls',expected_trial_count='3')
        for trial in range(1,4):
            insert(db,'expected_trial',expected_trial_id=f'{harness}-{trial}',run_uid='matrix-run',configuration_id=harness,trial_index=str(trial))
        insert(db,'configuration_access_binding',access_binding_id=harness,run_uid='matrix-run',configuration_id=harness,role='competitor',capability_id=harness,qualification_id=harness,binding_digest=f'access-{harness}')
    validate_existing_profiles(db)
    rows=db.execute(existing_sql,dict(existing_run_uid='existing-run')).fetchall()
    check(len(rows)==3 and all(row[3]=='claude_code' for row in rows),'ordinary configurations compare same harness profiles without control/asset fan-out')
    rejected(db,'qualification must match exact capability',lambda:insert(db,'configuration_access_binding',access_binding_id='bad',run_uid='matrix-run',configuration_id='codex',role='competitor',capability_id='codex',qualification_id='claude_code',binding_digest='bad'))
    insert(db,'harness_comparison',comparison_id='matrix',comparison_digest='matrix-digest',run_uid='matrix-run',preview_digest='preview',registry_digest='six-v1',model_binding_id='binding',effort_contract_id='effort',mode='strict',inference_scope='all_competitor_inference',trials='3',common_control_digest='common-controls',policy_digest='comparison-policy',coverage='subset',fail_closed_policy_ref='stop-configuration',publication_id=pub)
    rejected(db,'cannot freeze missing matrix cells',lambda:insert(db,'harness_comparison_freeze',comparison_id='matrix',validated_digest='matrix-digest',roster_digest='six-trials',publication_id=pub))
    rejected(db,'cell cannot borrow another configuration access binding',lambda:insert(db,'harness_comparison_cell',comparison_id='matrix',harness_id='codex',selected=1,configuration_id='codex',access_binding_id='claude_code',model_binding_id='binding',effort_mapping_id='codex',capability_id='codex',readiness='ready'))
    for harness in registry:
        selected=harness in registry[:2]
        insert(db,'harness_comparison_cell',comparison_id='matrix',harness_id=harness,selected=int(selected),configuration_id=harness if selected else None,access_binding_id=harness if selected else None,model_binding_id='binding',effort_mapping_id=harness,capability_id=harness,readiness='ready' if selected else 'blocked',exclusion_reason=None if selected else 'explicit unselected fixture')
        if not selected:
            for ordinal in (1,2):
                insert(db,'harness_comparison_cell_issue',comparison_id='matrix',harness_id=harness,ordinal=ordinal,kind='reason',code=f'fixture-{ordinal}',detail='Not an installed-provider support assertion')
    insert(db,'harness_comparison_freeze',comparison_id='matrix',validated_digest='matrix-digest',roster_digest='six-trials',publication_id=pub)
    rejected(db,'alias cannot add seventh matrix cell',lambda:insert(db,'harness_comparison_cell',comparison_id='matrix',harness_id='example-agent',selected=0,readiness='blocked',exclusion_reason='alias is not a harness'))
    check(db.execute("SELECT existing_agent_profile_name,existing_agent_treatment,existing_agent_control_digest FROM analytics_harness_comparison_v1 WHERE harness_id='claude_code'").fetchone()==('example-agent','existing','captured-controls'),'matrix exposes optional existing profile without changing grain')
    check(db.execute('SELECT count(*) FROM analytics_harness_comparison_v1').fetchone()==(6,),'six cells retained despite unsupported harnesses')
    check(db.execute("SELECT sum(expected_trial_rows) FROM analytics_harness_comparison_v1").fetchone()==(6,),'three trials for each materialized configuration')
    check(db.execute("SELECT cell_state,readiness,exclusion_reason FROM analytics_harness_comparison_v1 WHERE harness_id='cursor_cli'").fetchone()==('not_selected','blocked','explicit unselected fixture'),'not_selected projection preserves blocked readiness and reason')
    check(db.execute("SELECT DISTINCT gateway_locality,inference_locality FROM analytics_harness_comparison_v1").fetchall()==[('local','remote')],'loopback gateway does not imply local inference')
    rejected(db,'frozen trial roster rejects extra trial',lambda:insert(db,'expected_trial',expected_trial_id='extra',run_uid='matrix-run',configuration_id='claude_code',trial_index='4'))
    rejected(db,'frozen cell cannot gain a reason',lambda:insert(db,'harness_comparison_cell_issue',comparison_id='matrix',harness_id='cursor_cli',ordinal=3,kind='reason',code='late',detail='late'))
    for harness in registry[:2]:
        insert(db,'retained_result',result_id=f'{harness}-result',expected_trial_id=f'{harness}-1',publication_id=pub)
        insert(db,'inference_call',call_id=f'{harness}-call',result_id=f'{harness}-result',role='competitor',status='finished',publication_id=pub)
    observation=dict(call_id='claude_code-call',access_binding_id='claude_code',observation_digest='route-observation',record_kind='source_fact',requested_model_binding_id='binding',resolved_checkpoint_id='base',resolved_variant_snapshot_id='variant',resolved_model_state='declared',effective_model_state='unknown',status='unverified',coverage='partial',reason='effective identity/effort unexposed',evidence_set_id=ev,observed_at=stamp,publication_id=pub)
    rejected(db,'call cannot use other configuration route',lambda:insert(db,'request_route_observation',observation_id='wrong-call',**dict(observation,call_id='codex-call')))
    rejected(db,'call cannot use other run route',lambda:insert(db,'request_route_observation',observation_id='wrong-run',**dict(observation,call_id='call1')))
    insert(db,'request_route_observation',observation_id='request1',**observation)
    requested=dict(observation_id='request1',stage='requested',effort_contract_id='effort',kind='native_level',native_level='fixture-deep',semantic_owner='fixture-model-owner',semantic_version='fixture/1',state='declared',evidence_set_id=ev)
    rejected(db,'requested effort cannot be remapped after launch',lambda:insert(db,'request_effort_observation',**dict(requested,effort_contract_id='different-effort',native_level='fixture-shallow')))
    insert(db,'request_effort_observation',**requested)
    rejected(db,'unclosed observation lacks emitted/effective stages',lambda:insert(db,'request_route_finalization',observation_id='request1',validated_digest='route-observation'))
    insert(db,'request_effort_observation',**dict(requested,stage='emitted'))
    insert(db,'request_effort_observation',observation_id='request1',stage='effective',kind='unknown',state='unknown',reason='not exposed',evidence_set_id=ev)
    for ordinal,kind in [(1,'litellm'),(2,'openrouter')]:
        insert(db,'request_route_hop_observation',observation_id='request1',ordinal=ordinal,kind=kind,gateway_locality='local' if ordinal==1 else 'remote',inference_locality='remote',status='declared',evidence_set_id=ev)
    insert(db,'request_route_finalization',observation_id='request1',validated_digest='route-observation')
    check(db.execute('SELECT count(*),max(observed_hops),max(effective_native_level) FROM analytics_request_route_v1').fetchone()==(1,2,None),'two hops produce one request row and no invented effective effort')
    for harness in registry[:2]:
        insert(db,'result_seal',result_id=f'{harness}-result',facts_digest=f'facts-{harness}',finalization_receipt_digest=f'receipt-{harness}',terminal_status='finished',sealed_at=stamp,publication_id=pub)
    rejected(db,'late route source facts cannot change execution seal',lambda:insert(db,'request_route_observation',observation_id='late',**dict(observation,observation_digest='late')))
    rejected(db,'route finalization closes child evidence',lambda:insert(db,'request_route_hop_observation',observation_id='request1',ordinal=3,kind='openrouter',gateway_locality='remote',inference_locality='remote',status='declared',evidence_set_id=ev))
    for kind in ('harness_comparison','request_routes'):
        insert(db,'resource_revision',resource_kind=kind,resource_id='matrix',revision_digest=f'{kind}-v1',publication_id=pub)
    insert(db,'analysis_snapshot',analysis_id='matrix-analysis',analysis_digest='matrix-analysis',request_digest='matrix-request',input_digest='matrix-input',input_publication_id=pub,template_sha256='template',judge_group_id='human',algorithm_version='1',scoring_policy_digest='scoring',population_digest='matrix-population',selection_digest='matrix-selection',metadata_view='as_recorded',variant_comparison_mode='none',cost_policy_digest='cost',status='pending',created_at=stamp,publication_id=pub)
    for kind in ('harness_comparison','request_routes'):
        insert(db,'analysis_dependency',analysis_id='matrix-analysis',resource_kind=kind,resource_id='matrix',publication_id=pub)
    for harness in registry[:2]:
        insert(db,'analysis_subject',analysis_subject_id=f'matrix-{harness}',analysis_id='matrix-analysis',run_uid='matrix-run',configuration_id=harness,status='pending',reason='Incomplete trials and reviews',comparison_tier='not_applicable',selected_variant_snapshot_id='variant')
        for trial in range(1,4):
            insert(db,'analysis_trial',analysis_subject_id=f'matrix-{harness}',expected_trial_id=f'{harness}-{trial}',result_id=f'{harness}-result' if trial==1 else None,state='retained' if trial==1 else 'not_retained')
    insert(db,'comparison_analysis_link',analysis_id='matrix-analysis',comparison_id='matrix',comparison_axis='harness',policy_digest='comparison-policy',input_evidence_digest='route-evidence-digest',evidence_publication_id=pub,outcome_digest='unverified-matrix',classification='unverified_same_model_effort')
    rejected(db,'matrix analysis requires all cells',lambda:insert(db,'analysis_finalization',analysis_id='matrix-analysis',validation_version='1',validated_digest='matrix-analysis',publication_id=pub))
    rejected(db,'analysis cell cannot borrow another subject',lambda:insert(db,'comparison_analysis_cell',analysis_id='matrix-analysis',comparison_id='matrix',harness_id='claude_code',analysis_subject_id='matrix-codex',classification='unverified_same_model_effort'))
    for harness in registry:
        selected=harness in registry[:2]
        insert(db,'comparison_analysis_cell',analysis_id='matrix-analysis',comparison_id='matrix',harness_id=harness,analysis_subject_id=f'matrix-{harness}' if selected else None,classification='unverified_same_model_effort' if selected else 'unavailable',reason='Fixture unknown runtime identity' if selected else 'Unselected')
    rejected(db,'analysis requires existing treatment dependency',lambda:insert(db,'analysis_finalization',analysis_id='matrix-analysis',validation_version='1',validated_digest='matrix-analysis',publication_id=pub))
    insert(db,'resource_revision',resource_kind='existing_agent_binding',resource_id='matrix-profile',revision_digest='captured-controls-v1',publication_id=pub)
    insert(db,'analysis_dependency',analysis_id='matrix-analysis',resource_kind='existing_agent_binding',resource_id='matrix-profile',publication_id=pub)
    insert(db,'analysis_finalization',analysis_id='matrix-analysis',validation_version='1',validated_digest='matrix-analysis',publication_id=pub)
    rows=db.execute(matrix_sql,dict(comparison_id='matrix',comparison_analysis_id='matrix-analysis')).fetchall()
    check(len(rows)==6 and [row[4] for row in rows]==registry,'all-six parameterized matrix query without hop/reason fan-out')
    check(sum(row[22] is not None for row in rows)==2 and all(row[27] is None for row in rows),'only materialized subjects have analysis rows; unavailable/pending quality stays null')
    check(db.execute("SELECT existing_agent_profile_name FROM analytics_harness_comparison_score_v1 WHERE harness_id='claude_code'").fetchone()==('example-agent',),'saved score retains exact optional profile treatment')
    check(db.execute('SELECT count(*) FROM analytics_harness_comparison_score_v1').fetchone()==(2,),'comparison score view grain is selected subject')
    check(db.execute("SELECT freshness FROM analytics_analysis_status_v1 WHERE analysis_id='matrix-analysis'").fetchone()==('current',),'matrix dependency pin initially current')
    db.commit()
    insert(db,'publication',publication_id=3,transaction_id='route-annotation',intent_digest='route-annotation',kind='annotation',committed_at=stamp)
    insert(db,'request_route_observation',observation_id='request-correction',**dict(observation,observation_digest='late-mismatch',record_kind='annotation',supersedes_observation_id='request1',effective_checkpoint_id='other-base',effective_model_state='mismatch',status='mismatch',reason='Late conflicting provider evidence',publication_id=3))
    for stage in ('requested','emitted','effective'):
        insert(db,'request_effort_observation',**dict(requested,observation_id='request-correction',stage=stage))
    insert(db,'request_route_finalization',observation_id='request-correction',validated_digest='late-mismatch')
    insert(db,'request_route_exclusion',exclusion_id='late-mismatch',observation_id='request-correction',code='model_mismatch',reason='Retained late evidence',policy_ref='stop-configuration',publication_id=3)
    insert(db,'resource_revision',resource_kind='request_routes',resource_id='matrix',revision_digest='request_routes-v2',publication_id=3)
    insert(db,'resource_revision',resource_kind='existing_agent_binding',resource_id='matrix-profile',revision_digest='contradictory-model-evidence',publication_id=3)
    db.commit()
    check(db.execute("SELECT facts_digest FROM result_seal WHERE result_id='claude_code-result'").fetchone()==('facts-claude_code',),'late route annotation preserves sealed fact digest')
    check(db.execute("SELECT freshness FROM analytics_analysis_status_v1 WHERE analysis_id='matrix-analysis'").fetchone()==('stale',),'late route evidence invalidates current analysis without mutation')
    check(db.execute("SELECT count(*) FROM analytics_current_score_v1 WHERE analysis_id='matrix-analysis'").fetchone()==(0,),'stale harness analysis absent from current scores')
    check(db.execute('SELECT count(*) FROM analytics_request_route_v1').fetchone()==(2,),'disagreeing source and annotation are both retained')
    # Stored portable metadata has no credential-value/secret-locator column.
    forbidden={'api_key','access_token','credential_value','credential_ref','authorization','password'}
    new_tables=['api_access_profile','api_route_hop','access_model_binding','route_qualification','request_route_observation','request_route_hop_observation']
    check(all(not (forbidden & {column[1] for column in db.execute(f'PRAGMA table_info({table})')}) for table in new_tables),'portable route schemas contain no credential slots')


def validate_judge_routes(db, query_sql):
    """Independent original/additional judge configurations; fixture-only, no real API calls."""
    pub=3
    stamp='2026-10-03T01:30:00Z'
    def clone(table, key, value, **changes):
        cur=db.execute(f'SELECT * FROM {table} WHERE {key}=?',(value,))
        return dict(dict(zip([c[0] for c in cur.description],cur.fetchone())),**changes)
    routes={}
    for suffix,kind,budget in [('original','direct_provider','256'),('additional','openrouter','512')]:
        ident=f'judge-{suffix}'
        insert(db,'api_access_profile',**clone('api_access_profile','profile_snapshot_id','proxy-v1',profile_snapshot_id=ident,profile_id=ident,profile_digest=ident,display_name=f'Fixture {ident}',kind=kind,gateway_locality='remote'))
        insert(db,'api_access_role',profile_snapshot_id=ident,role='harness_judge')
        for ordinal in (1,2):
            insert(db,'api_route_hop',**clone('api_route_hop','ordinal',ordinal,profile_snapshot_id=ident,endpoint_origin=f'https://{suffix}.example.invalid',kind=kind,gateway_locality='remote'))
        insert(db,'api_access_profile_seal',profile_snapshot_id=ident,validated_digest=ident)
        insert(db,'access_model_binding',**clone('access_model_binding','model_binding_id','other-binding',model_binding_id=ident,binding_digest=ident,profile_snapshot_id=ident,harness_selectable_id=ident))
        insert(db,'effort_contract',**clone('effort_contract','effort_contract_id','effort',effort_contract_id=ident,contract_id=ident,contract_digest=ident,checkpoint_id='other-base',variant_snapshot_id=None,kind='reasoning_budget',native_level=None,budget_tokens=budget))
        insert(db,'harness_effort_mapping',**clone('harness_effort_mapping','effort_mapping_id','claude_code',effort_mapping_id=ident,mapping_digest=ident,model_binding_id=ident,effort_contract_id=ident))
        for ordinal,stage in [(1,'launch'),(2,'upstream')]:
            insert(db,'harness_effort_setting',effort_mapping_id=ident,ordinal=ordinal,stage=stage,setting_name='fixture.budget',text_value=budget)
        insert(db,'harness_effort_mapping_seal',effort_mapping_id=ident,validated_digest=ident)
        insert(db,'harness_route_capability',**clone('harness_route_capability','capability_id','claude_code',capability_id=ident,capability_digest=ident,effort_mapping_id=ident))
        insert(db,'harness_route_capability_seal',capability_id=ident,validated_digest=ident)
        insert(db,'route_qualification',**clone('route_qualification','qualification_id','claude_code',qualification_id=ident,diagnostic_job_id=ident,outcome_digest=ident,capability_id=ident))
        group=dict(judge_group_id=ident,group_digest=ident,backend='harness_review',rubric_ref='rubric',policy_digest=f'{ident}-identity-with-route-profile-model-effort-treatment',harness_release_id='claude_code',model_checkpoint_id='other-base',selected_effort_contract_id=ident,selected_access_binding_id=ident,selected_existing_agent_binding_id=ident)
        binding=dict(access_binding_id=ident,judge_group_id=ident,role='harness_judge',capability_id=ident,qualification_id=ident,binding_digest=ident)
        if suffix=='original':
            def wrong_owner(**changes):
                insert(db,'judge_group',**dict(group,**changes))
                insert(db,'configuration_access_binding',**binding)
            rejected(db,'judge route requires exact judge harness release',lambda:wrong_owner(harness_release_id='codex'))
            rejected(db,'judge route effort cannot bind another model',lambda:wrong_owner(model_checkpoint_id='base'))
            rejected(db,'judge selected effort cannot borrow competitor contract',lambda:wrong_owner(selected_effort_contract_id='effort'))
            rejected(db,'System One keeps native profile, no generic API route',lambda:wrong_owner(backend='decision_rubric',decision_engine_ref='fixture-system-one',decision_profile_version='1',decision_profile_digest='fixture-decision-profile'))
            rejected(db,'human cannot select model route',lambda:wrong_owner(backend='human_review',reviewer_ref='fixture-human',form_policy_ref='fixture-form'))
        insert(db,'judge_group',**group)
        if suffix=='original':
            rejected(db,'judge route has no invented competitor keys',lambda:insert(db,'configuration_access_binding',**dict(binding,run_uid='matrix-run',configuration_id='claude_code')))
            rejected(db,'judge route cannot borrow competitor-only profile permission',lambda:insert(db,'configuration_access_binding',**dict(binding,capability_id='claude_code',qualification_id='claude_code')))
            rejected(db,'judge route qualification must match selected capability',lambda:insert(db,'configuration_access_binding',**dict(binding,qualification_id='codex')))
            rejected(db,'planner route belongs to owner journal',lambda:insert(db,'configuration_access_binding',**dict(binding,role='planner')))
            rejected(db,'binding must be pinned by actual JudgeGroup identity',lambda:insert(db,'configuration_access_binding',**dict(binding,access_binding_id='unselected-binding')))
            rejected(db,'binding cannot attach to human group',lambda:insert(db,'configuration_access_binding',**dict(binding,judge_group_id='human')))
        insert(db,'configuration_access_binding',**binding)
        existing=clone('configuration_existing_agent_binding','binding_id','judge-profile',binding_id=ident,judge_group_id=ident,access_binding_id=ident,effort_selection='contract',effort_contract_id=ident,resolved_plan_digest=ident)
        if suffix=='additional':
            # A second independently registered launcher profile, never a competitor identity.
            insert(db,'existing_agent_profile_snapshot',**clone('existing_agent_profile_snapshot','profile_snapshot_id','example-agent-v1',profile_snapshot_id='review-helper-v1',profile_id='review-helper',profile_digest='review-helper-v1',display_name='review-helper'))
            insert(db,'existing_agent_profile_role',profile_snapshot_id='review-helper-v1',role='harness_judge')
            insert(db,'existing_agent_profile_seal',profile_snapshot_id='review-helper-v1',validated_digest='review-helper-v1')
            existing['profile_snapshot_id']='review-helper-v1'
            rejected(db,'judge launcher cannot borrow original judge route',lambda:insert(db,'configuration_existing_agent_binding',**dict(existing,access_binding_id='judge-original')))
            rejected(db,'judge launcher cannot borrow competitor route',lambda:insert(db,'configuration_existing_agent_binding',**dict(existing,access_binding_id='claude_code')))
            rejected(db,'judge launcher cannot borrow unpermitted profile',lambda:insert(db,'configuration_existing_agent_binding',**dict(existing,profile_snapshot_id='example-agent-v2')))
        insert(db,'configuration_existing_agent_binding',**existing)
        routes[suffix]=(ident,budget)
    check(db.execute("SELECT run_uid,configuration_id,judge_group_id FROM configuration_access_binding WHERE role='harness_judge' ORDER BY judge_group_id").fetchall()==[(None,None,'judge-additional'),(None,None,'judge-original')],'judge access bindings have actual group ownership only')
    check(db.execute("SELECT selected_access_binding_id FROM analytics_judge_configuration_v1 WHERE judge_group_id='profile-judge'").fetchone()==(None,),'ordinary inherited judge profile remains valid without route')
    insert(db,'judge_group',judge_group_id='decision-native',group_digest='decision-native',backend='decision_rubric',rubric_ref='rubric',policy_digest='decision-native',decision_engine_ref='fixture-system-one',decision_profile_version='1',decision_profile_digest='fixture-native-profile')
    rejected(db,'decision group cannot acquire harness route binding',lambda:insert(db,'configuration_access_binding',**dict(binding,access_binding_id='decision-route',judge_group_id='decision-native',binding_digest='decision-route')))
    # Circular FK closure is checked at the atomic publication, even if the selection is missing.
    db.commit()
    insert(db,'judge_group',**dict(group,judge_group_id='missing-route',group_digest='missing-route',selected_existing_agent_binding_id=None,selected_access_binding_id='missing-route'))
    try:
        db.commit()
    except sqlite3.IntegrityError:
        db.rollback()
        check(True,'unresolved selected route prevents publication')
    else:
        raise AssertionError('unresolved selected route was published')
    rejected(db,'immutable group cannot switch route',lambda:db.execute("UPDATE judge_group SET selected_access_binding_id='judge-additional' WHERE judge_group_id='judge-original'"))
    rejected(db,'immutable route cannot switch judge owner',lambda:db.execute("UPDATE configuration_access_binding SET judge_group_id='judge-additional' WHERE access_binding_id='judge-original'"))
    rejected(db,'route binding cannot be deleted',lambda:db.execute("DELETE FROM configuration_access_binding WHERE access_binding_id='judge-original'"))
    insert(db,'benchmark_run',**clone('benchmark_run','run_uid','matrix-run',run_uid='judged-run',launch_digest='judged-run',original_judge_group_id='judge-original'))
    insert(db,'run_configuration',**clone('run_configuration','configuration_id','codex',run_uid='judged-run',configuration_id='competitor',expected_trial_count='1'))
    insert(db,'expected_trial',expected_trial_id='judged-trial',run_uid='judged-run',configuration_id='competitor',trial_index='1')
    insert(db,'configuration_access_binding',access_binding_id='judged-competitor',run_uid='judged-run',configuration_id='competitor',role='competitor',capability_id='codex',qualification_id='codex',binding_digest='judged-competitor')
    insert(db,'retained_result',result_id='judged-result',expected_trial_id='judged-trial',publication_id=pub)
    insert(db,'inference_call',call_id='judged-competitor-call',result_id='judged-result',role='competitor',status='finished',publication_id=pub)
    insert(db,'result_seal',result_id='judged-result',facts_digest='competitor-facts',finalization_receipt_digest='competitor-receipt',terminal_status='finished',sealed_at=stamp,publication_id=pub)
    observations={}
    for suffix,(ident,budget) in routes.items():
        insert(db,'judge_assessment',assessment_id=ident,assessment_digest=ident,result_id='judged-result',judge_group_id=ident,purpose=suffix,reserved_review_id=ident,publication_id=pub)
        review=dict(review_id=ident,result_id='judged-result',judge_group_id=ident,judge_assessment_id=ident,purpose=suffix,outcome='ungraded',provenance='model_authored',review_digest=ident,artifact_digest=ident,scope_digest=ident,assessed_at=stamp,ungraded_reason='fixture unavailable evidence',publication_id=pub)
        if suffix=='original':
            rejected(db,'original review cannot use additional JudgeGroup',lambda:insert(db,'review',**dict(review,judge_group_id='judge-additional')))
        call=dict(call_id=ident,result_id='judged-result',judge_assessment_id=ident,role='judge',status='finished',publication_id=pub)
        rejected(db,'judge call cannot borrow another assessed result',lambda:insert(db,'inference_call',**dict(call,result_id='r1')))
        rejected(db,'competitor call cannot acquire judge review scope',lambda:insert(db,'inference_call',**dict(call,role='competitor')))
        insert(db,'inference_call',**call)
        obs=dict(observation_id=ident,call_id=ident,access_binding_id=ident,observation_digest=ident,record_kind='source_fact',requested_model_binding_id=ident,resolved_checkpoint_id='other-base',resolved_model_state='declared',effective_model_state='unknown',status='unverified',coverage='partial',reason='fixture does not expose effective model',evidence_set_id='route-evidence',observed_at=stamp,publication_id=pub)
        rejected(db,'judge call cannot borrow competitor route',lambda:insert(db,'request_route_observation',**dict(obs,access_binding_id='judged-competitor',requested_model_binding_id='binding')))
        rejected(db,'competitor call cannot borrow judge route',lambda:insert(db,'request_route_observation',**dict(obs,call_id='judged-competitor-call',record_kind='annotation')))
        rejected(db,'judge request cannot borrow competitor model binding',lambda:insert(db,'request_route_observation',**dict(obs,requested_model_binding_id='binding')))
        other='judge-additional' if suffix=='original' else 'judge-original'
        rejected(db,'judge request cannot borrow another group route',lambda:insert(db,'request_route_observation',**dict(obs,access_binding_id=other,requested_model_binding_id=other)))
        insert(db,'request_route_observation',**obs)
        check(db.execute('SELECT count(*) FROM review WHERE review_id=?',(ident,)).fetchone()==(0,),'live judge route evidence retained before committed Review')
        insert(db,'review',**review)
        rejected(db,'review finalization requires closed judge route observations',lambda:insert(db,'review_finalization',review_id=ident,validation_version='1',validated_digest=ident,publication_id=pub))
        effort=dict(observation_id=ident,stage='requested',effort_contract_id=ident,kind='reasoning_budget',budget_tokens=budget,semantic_owner='fixture-model-owner',semantic_version='fixture/1',state='declared',evidence_set_id='route-evidence')
        rejected(db,'judge requested effort must match exact native contract',lambda:insert(db,'request_effort_observation',**dict(effort,budget_tokens='999')))
        insert(db,'request_effort_observation',**effort)
        insert(db,'request_effort_observation',**dict(effort,stage='emitted'))
        insert(db,'request_effort_observation',observation_id=ident,stage='effective',kind='unknown',state='unknown',reason='unexposed fixture',evidence_set_id='route-evidence')
        for ordinal in (1,2):
            insert(db,'request_route_hop_observation',observation_id=ident,ordinal=ordinal,kind='direct_provider',gateway_locality='remote',inference_locality='remote',status='declared',evidence_set_id='route-evidence')
        rejected(db,'judge observation finalization requires its own digest',lambda:insert(db,'request_route_finalization',observation_id=ident,validated_digest='different'))
        insert(db,'request_route_finalization',observation_id=ident,validated_digest=ident)
        insert(db,'review_finalization',review_id=ident,validation_version='1',validated_digest=ident,publication_id=pub)
        rejected(db,'finalized judge review cannot acquire another call',lambda:insert(db,'inference_call',**dict(call,call_id=f'{ident}-late')))
        rejected(db,'finalized judge review cannot acquire new source facts',lambda:insert(db,'request_route_observation',**dict(obs,observation_id=f'{ident}-late',observation_digest=f'{ident}-late')))
        rows=db.execute(query_sql,dict(judge_group_id=ident)).fetchall()
        check(len(rows)==1 and rows[0][6:10]==('harness_review','claude_code','other-base',ident) and rows[0][-3:]==('judged-run','competitor',2),'judge route query retains own model/harness/effort and separate assessed subject without hop fan-out')
        observations[ident]=(obs,effort)
    # Billable failed/stopped assessments retain call identity and evidence with no Review.
    for state in ('failed','not_judged'):
        aid=f'judge-{state}'
        assessment=dict(assessment_id=aid,assessment_digest=aid,result_id='judged-result',judge_group_id='judge-additional',purpose='additional',reserved_review_id=f'{aid}-reserved',publication_id=pub)
        rejected(db,'human cannot own automated assessment',lambda:insert(db,'judge_assessment',**dict(assessment,judge_group_id='human')))
        insert(db,'judge_assessment',**assessment)
        failed_call=dict(call_id=aid,result_id='judged-result',judge_assessment_id=aid,role='judge',status=state,publication_id=pub)
        rejected(db,'judge call requires its real assessment scope',lambda:insert(db,'inference_call',**dict(failed_call,judge_assessment_id=None)))
        insert(db,'inference_call',**failed_call)
        insert(db,'cost_observation',cost_id=aid,result_id='judged-result',call_id=aid,role='judge',basis='native_charge',amount='one',currency='USD',coverage='partial',measurement_scope='assessment',reason='fixture partial billed failed call',publication_id=pub)
        rejected(db,'failed judge cost cannot attach to another result',lambda:insert(db,'cost_observation',cost_id=f'{aid}-bad',result_id='r1',call_id=aid,role='judge',basis='native_charge',amount='one',currency='USD',coverage='partial',measurement_scope='assessment',publication_id=pub))
        obs,effort=observations['judge-additional']
        insert(db,'request_route_observation',**dict(obs,observation_id=aid,call_id=aid,observation_digest=aid))
        disposition=dict(disposition_id=aid,result_id='judged-result',judge_group_id='judge-additional',assessment_id=aid,state=state,reason='fixture settlement without valid review',publication_id=pub)
        rejected(db,'failed disposition waits for route evidence closure',lambda:insert(db,'additional_disposition',**disposition))
        for stage in ('requested','emitted','effective'):
            insert(db,'request_effort_observation',**dict(effort,observation_id=aid,stage=stage))
        insert(db,'request_route_finalization',observation_id=aid,validated_digest=aid)
        rejected(db,'failed outcome cannot borrow another JudgeGroup',lambda:insert(db,'additional_disposition',**dict(disposition,judge_group_id='judge-original')))
        insert(db,'additional_disposition',**disposition)
        rejected(db,'settled failed assessment cannot gain another call',lambda:insert(db,'inference_call',**dict(failed_call,call_id=f'{aid}-late')))
        rejected(db,'settled failed assessment cannot gain source evidence',lambda:insert(db,'request_route_observation',**dict(obs,observation_id=f'{aid}-late',call_id=aid,observation_digest=f'{aid}-late')))
        rejected(db,'settled failed assessment cannot fabricate a late review',lambda:insert(db,'review',**dict(review,review_id=f'{aid}-reserved',judge_assessment_id=aid,review_digest=aid)))
        check(db.execute("SELECT o.judge_assessment_id,o.review_id,c.amount,d.state FROM analytics_request_route_v1 o JOIN cost_observation c USING(call_id) JOIN additional_disposition d ON d.assessment_id=o.judge_assessment_id WHERE o.observation_id=?",(aid,)).fetchone()==(aid,None,'one',state),'failed/not-judged retained billed route evidence has no synthetic Review')
    rejected(db,'assessment identity immutable',lambda:db.execute("UPDATE judge_assessment SET judge_group_id='judge-original' WHERE assessment_id='judge-failed'"))
    check(db.execute("SELECT count(*),count(DISTINCT access_profile_id),count(DISTINCT existing_agent_profile_id) FROM analytics_judge_configuration_v1 WHERE judge_group_id IN ('judge-original','judge-additional')").fetchone()==(2,2,2),'original and additional groups retain distinct access and launcher profiles')
    check(db.execute('SELECT count(*) FROM analytics_harness_comparison_score_v1').fetchone()==(2,),'judge route/profile joins preserve competitor comparison score grain')
    insert(db,'analysis_snapshot',**clone('analysis_snapshot','analysis_id','matrix-analysis',analysis_id='judge-analysis',analysis_digest='judge-analysis',request_digest='judge-analysis',input_digest='judge-analysis',input_publication_id=pub,judge_group_id='judge-additional',publication_id=pub))
    insert(db,'analysis_subject',analysis_subject_id='judge-subject',analysis_id='judge-analysis',run_uid='judged-run',configuration_id='competitor',status='ineligible',reason='fixture ungraded',comparison_tier='not_applicable')
    insert(db,'analysis_trial',analysis_subject_id='judge-subject',expected_trial_id='judged-trial',result_id='judged-result',selected_review_id='judge-additional',state='retained')
    for kind,rid in [('existing_agent_binding','judge-additional'),('judge_group','judge-additional'),('judge_request_routes','judge-additional')]:
        rejected(db,f'judge analysis requires {kind} dependency',lambda:insert(db,'analysis_finalization',analysis_id='judge-analysis',validation_version='1',validated_digest='judge-analysis',publication_id=pub))
        insert(db,'resource_revision',resource_kind=kind,resource_id=rid,revision_digest=f'{kind}-initial',publication_id=pub)
        insert(db,'analysis_dependency',analysis_id='judge-analysis',resource_kind=kind,resource_id=rid,publication_id=pub)
    insert(db,'analysis_finalization',analysis_id='judge-analysis',validation_version='1',validated_digest='judge-analysis',publication_id=pub)
    check(db.execute("SELECT freshness FROM analytics_analysis_status_v1 WHERE analysis_id='judge-analysis'").fetchone()==('current',),'judge analysis initially current at exact group/evidence cutoff')
    insert(db,'publication',publication_id=4,transaction_id='judge-route-annotation',intent_digest='judge-route-annotation',kind='annotation',committed_at=stamp)
    obs,effort=observations['judge-additional']
    insert(db,'request_route_observation',**dict(obs,observation_id='judge-correction',observation_digest='judge-correction',record_kind='annotation',supersedes_observation_id='judge-additional',effective_checkpoint_id='base',effective_model_state='mismatch',status='mismatch',reason='fixture contradictory served model',publication_id=4))
    for stage in ('requested','emitted','effective'):
        insert(db,'request_effort_observation',**dict(effort,observation_id='judge-correction',stage=stage))
    insert(db,'request_route_finalization',observation_id='judge-correction',validated_digest='judge-correction')
    insert(db,'request_route_exclusion',exclusion_id='judge-correction',observation_id='judge-correction',code='judge_model_mismatch',reason='fixture contradictory served model',policy_ref='judge-eligibility',publication_id=4)
    insert(db,'resource_revision',resource_kind='judge_request_routes',resource_id='judge-additional',revision_digest='judge-evidence-corrected',publication_id=4)
    check(db.execute("SELECT freshness FROM analytics_analysis_status_v1 WHERE analysis_id='judge-analysis'").fetchone()==('stale',),'late judge evidence advances only selected group evidence dependency')
    check(db.execute("SELECT facts_digest FROM result_seal WHERE result_id='judged-result'").fetchone()==('competitor-facts',),'post-seal judge sources and late annotation preserve competitor seal')
    # Portable relational round trip remains credential-free and inert, never activates profiles.
    forbidden={'api_key','access_token','credential_value','credential_ref','authorization','password'}
    tables=['judge_group','judge_assessment','configuration_access_binding','configuration_existing_agent_binding']
    check(all(not (forbidden & {c[1] for c in db.execute(f'PRAGMA table_info({table})')}) for table in tables),'judge identity and binding exchange carries no credentials or local secret locators')
    import json
    payload=[dict(zip([c[0] for c in cur.description],row)) for cur in [db.execute("SELECT * FROM analytics_judge_configuration_v1 WHERE judge_group_id IN ('judge-original','judge-additional') ORDER BY judge_group_id")] for row in cur.fetchall()]
    check(json.loads(json.dumps(payload))==payload and all(row['selected_access_binding_id']==row['judge_group_id'] for row in payload),'portable judge projection round-trips route/profile/treatment refs without activation state')
    db.commit()


def validate_integrated_evidence(db):
    """New owner-shape constraints, scoped provenance and pre-seal snapshot inventory."""
    pub=2
    insert(db,'retained_result',result_id='r3',expected_trial_id='t3',publication_id=pub)
    insert(db,'domain_evidence_plan',plan_id='plan',plan_version='1',plan_digest='plan-digest',template_sha256='template',rubric_ref='rubric',suite_schema='acceptance.v2',policy_artifact_id='artifact',publication_id=pub)
    insert(db,'domain_evidence_binding',plan_id='plan',ordinal=1,requirement_id='requirement',check_key='check',modality='text',source_role='candidate_source',coverage_requirement='required')
    rejected(db,'foreign criterion is not admitted by plan',lambda:insert(db,'domain_evidence_binding',plan_id='plan',ordinal=2,requirement_id='foreign',category_key='spec',criterion_key='foreign',modality='text',source_role='candidate_source',coverage_requirement='required'))
    snapshot=dict(result_id='r3',snapshot_ref='snapshot',manifest_digest='manifest',template_sha256='template',baseline_digest='baseline',delivered_scope_digest='scope',coverage='complete',manifest_artifact_id='artifact',publication_id=pub)
    rejected(db,'snapshot baseline mismatch',lambda:insert(db,'delivered_snapshot',**dict(snapshot,baseline_digest='wrong')))
    insert(db,'delivered_snapshot',**snapshot)
    entry=dict(result_id='r3',relative_path='README.md',kind='regular',byte_count='1',content_digest='fixture-content',artifact_id='artifact')
    insert(db,'delivered_snapshot_entry',**entry)
    rejected(db,'snapshot traversal rejected',lambda:insert(db,'delivered_snapshot_entry',**dict(entry,relative_path='../escape')))
    rejected(db,'snapshot link cannot provide regular retained bytes',lambda:insert(db,'delivered_snapshot_entry',**dict(entry,relative_path='link',kind='link')))
    check(db.execute("SELECT count(*) FROM delivered_snapshot_entry WHERE result_id='r3'").fetchone()==(1,) and db.execute("SELECT count(*) FROM result_seal WHERE result_id='r3'").fetchone()==(0,),'pre-seal delivered manifest is readable without circular seal prerequisite')
    contexts=['web','backend','native_mobile','devops','agentic','specification']
    for n,kind in enumerate(contexts):
        eid=f'domain-{n}'
        insert(db,'result_evidence',result_evidence_id=eid,result_id='r3',artifact_id='artifact',phase='final',logical_name=eid,coverage='partial',publication_id=pub)
        obs=dict(result_evidence_id=eid,plan_id='plan',report_schema='observation.v2',context_kind=kind,final_snapshot_digest='manifest',target_ref='approved-target',case_ref='approved-case',observation_mode='fixture_declared_mode',source_role='candidate_source',coverage='partial',context_artifact_id='artifact')
        if n==0:
            rejected(db,'observation final snapshot mismatch',lambda:insert(db,'evidence_observation',**dict(obs,final_snapshot_digest='wrong')))
            rejected(db,'acceptance/report schema dispatch mismatch',lambda:insert(db,'evidence_observation',**dict(obs,report_schema='observation.v1')))
        insert(db,'evidence_observation',**obs)
    check(db.execute("SELECT count(*),count(DISTINCT context_kind) FROM analytics_evidence_observation_v1 WHERE result_id='r3'").fetchone()==(6,6),'six tagged observation contexts remain queryable at one-row evidence grain')
    capture=dict(capture_id='capture',result_id='r3',task_id='T1',invocation_id='invocation',session_id='session',agent_id='child',parent_agent_id='parent',window_id='window',request_id='request',phase='input',identity_basis='adapter_synthetic',source_digest='source-digest',capture_policy_digest='capture-policy',coverage='partial',publication_id=pub)
    rejected(db,'capture cannot borrow another result call',lambda:insert(db,'context_capture',**dict(capture,call_id='call1')))
    insert(db,'context_capture',**capture)
    insert(db,'context_analysis',context_analysis_id='context-analysis',capture_id='capture',analysis_id='portable-analysis',through_entry_id='entry-11',ledger_digest='ledger-digest',status='complete',decision_engine_ref='fixture-profile/1',pack_digest='pack',input_digest='source-digest',analysis_digest='context-analysis-digest',publication_id=pub)
    labels=['system_input','user_input','thinking','thinking_summary','tool_definition','tool_call','tool_result','assistant_output','context_summary','protocol','unclassified']
    for label in labels:
        insert(db,'context_segment',capture_id='capture',segment_id=label,source_role='exposed',source_pointer=label,visibility='visible')
        insert(db,'context_classification',context_analysis_id='context-analysis',capture_id='capture',segment_id=label,category=label,label_policy_version='context-labels/1',basis='native')
    check(db.execute("SELECT count(DISTINCT category) FROM context_classification WHERE context_analysis_id='context-analysis'").fetchone()==(11,),'all eleven owner classification labels stay distinct')
    check(db.execute("SELECT identity_basis,agent_id,parent_agent_id,window_id FROM context_capture WHERE capture_id='capture'").fetchone()==('adapter_synthetic','child','parent','window'),'synthetic identity does not collapse native scope')
    insert(db,'context_capture',**dict(capture,capture_id='native-only'))
    insert(db,'context_segment',capture_id='native-only',segment_id='native',source_role='system',native_label='system_input',native_label_source_id='source',native_label_policy_version='context-labels/1',source_pointer='native',visibility='visible')
    insert(db,'context_snapshot',capture_id='native-only',snapshot_id='snapshot',sequence_index='1',observed_at='2026-10-03T01:00:00Z',native_occupancy_tokens='0',native_capacity_tokens='100',count_coverage='complete',membership_state='known')
    insert(db,'context_membership',capture_id='native-only',snapshot_id='snapshot',segment_id='native',membership='present',basis='native')
    check(db.execute("SELECT context_analysis_id,native_occupancy_tokens,category FROM analytics_context_v1 WHERE capture_id='native-only'").fetchone()==(None,'0','system_input'),'native-only context and native label remain queryable without a classifier')
    insert(db,'task_attempt',attempt_id='attempt3',result_id='r3',task_id='T1',attempt_index='1',process_status='finished',exit_code=0,publication_id=pub)
    for origin in ['authored','protocol']:
        insert(db,'check_result',check_result_id=origin,attempt_id='attempt3',check_key=origin,outcome='UNVERIFIED',infrastructure_state='unknown',origin=origin,suite_schema='acceptance.v2',reason='fixture',publication_id=pub)
    check(db.execute("SELECT origin,suite_schema FROM check_result ORDER BY origin").fetchall()==[('authored','acceptance.v2'),('protocol','acceptance.v2')],'authored versus protocol verdict origin survives SQL')
    rejected(db,'human review cannot acquire model commentary provenance',lambda:insert(db,'review',review_id='bad-human',result_id='r1',judge_group_id='human',purpose='additional',outcome='ungraded',provenance='model_authored',review_digest='bad-human',artifact_digest='artifact',scope_digest='scope',assessed_at='now',ungraded_reason='fixture',publication_id=pub))

    original=db.execute("SELECT * FROM variant_snapshot WHERE variant_snapshot_id='variant'").fetchone()
    columns=[x[1] for x in db.execute('PRAGMA table_info(variant_snapshot)')]
    variant=dict(zip(columns,original))
    rejected(db,'same variant ID and descriptor revision conflict',lambda:insert(db,'variant_snapshot',**dict(variant,variant_snapshot_id='conflict',descriptor_digest='conflicting-bytes')))
    insert(db,'variant_snapshot',**dict(variant,variant_snapshot_id='variant-v2',descriptor_revision=2,descriptor_digest='descriptor-v2',publication_id=pub))
    observed=dict(observation_id='late-proof',result_id='r1',call_id='call1',observed_snapshot_id='variant',record_kind='annotation',status='mismatch',proof_scope='request',invocation_id='invocation',request_id='request',proof_digest='proof',source_id='source',observed_at='2026-10-03T01:01:00Z',publication_id=pub)
    rejected(db,'post-seal source observation rejected',lambda:insert(db,'effective_variant_observation',**dict(observed,record_kind='source_fact')))
    rejected(db,'variant observation call scope rejected',lambda:insert(db,'effective_variant_observation',**dict(observed,result_id='r3')))
    insert(db,'effective_variant_observation',**observed)
    insert(db,'variant_observed_control',observation_id='late-proof',control_key='runtime_precision',state='known',text_value='fixture-fp',source_id='source')
    insert(db,'variant_observed_control',observation_id='late-proof',control_key='tokenizer',state='unknown',reason='unexposed')
    rejected(db,'unknown effective control cannot invent value',lambda:insert(db,'variant_observed_control',observation_id='late-proof',control_key='context_limit',state='unknown',numeric_value='zero',reason='unexposed'))
    rejected(db,'variant exclusion cannot borrow foreign result',lambda:insert(db,'variant_exclusion',exclusion_id='foreign-exclusion',result_id='r3',observation_id='late-proof',reason='mismatch',publication_id=pub))
    insert(db,'variant_exclusion',exclusion_id='late-exclusion',result_id='r1',observation_id='late-proof',reason='mismatch',publication_id=pub)
    base=dict(prior_snapshot_id='variant',author_ref='fixture-author',reason='fixture evidence',annotated_at='2026-10-03T01:02:00Z',publication_id=pub)
    for kind,payload in [('claim_correction',dict(subject_kind='descriptor',replacement_snapshot_id='variant-v2')),('effective_observation',dict(subject_kind='result',result_id='r1',observation_id='late-proof')),('attribution_exclusion',dict(subject_kind='result',result_id='r1',exclusion_id='late-exclusion'))]:
        insert(db,'operation_receipt',operation_id=kind,request_digest=kind,receipt_digest=kind,publication_id=pub)
        insert(db,'variant_annotation',annotation_id=kind,operation_id=kind,kind=kind,**base,**payload)
    rejected(db,'variant annotation payload cannot cross scope',lambda:insert(db,'variant_annotation',annotation_id='foreign',operation_id='foreign',kind='effective_observation',subject_kind='result',result_id='r3',observation_id='late-proof',**base))
    check(db.execute('SELECT count(DISTINCT kind) FROM variant_annotation').fetchone()==(3,),'three tagged annotations normalized with operation receipts')
    check(db.execute("SELECT variant_excluded,facts_digest FROM analytics_trial_v1 WHERE result_id='r1'").fetchone()==(1,'facts1'),'late mandatory exclusion leaves original facts digest unchanged')
    rejected(db,'delivered manifest immutable',lambda:db.execute("UPDATE delivered_snapshot SET manifest_digest='changed' WHERE result_id='r3'"))
    insert(db,'result_seal',result_id='r3',facts_digest='facts3',finalization_receipt_digest='receipt3',terminal_status='finished',sealed_at='2026-10-03T01:03:00Z',publication_id=pub)
    rejected(db,'sealed delivered inventory cannot gain entries',lambda:insert(db,'delivered_snapshot_entry',**dict(entry,relative_path='late.md')))
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
        params=dict(analysis_id='a1',template_sha256='template',creator_handle='quantizer',creator_role='quantizer',quant_preset='Q4_K_M',created_day='2026-09-12',context_analysis_id='absent',count_kind='native',node_id='quant',variant_snapshot_id='variant',comparison_id='absent',comparison_analysis_id='absent',existing_run_uid='absent',judge_group_id='absent')
        examples={}
        query_sql={}
        for block in re.split(r'-- query:',(HERE/'analysis-examples.sql').read_text())[1:]:
            name,sql=block.split('\n',1)
            query_sql[name]=sql
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
        validate_harness_routes(db,query_sql['harness_matrix'],query_sql['existing_agent_configurations'])
        validate_judge_routes(db,query_sql['judge_routes'])
        validate_integrated_evidence(db)
        check(db.execute('PRAGMA integrity_check').fetchall()==[('ok',)],'integrity check')
        check(db.execute('PRAGMA foreign_key_check').fetchall()==[],'foreign key check')
        tables=db.execute("SELECT count(*) FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchone()[0]
        views=db.execute("SELECT count(*) FROM sqlite_schema WHERE type='view'").fetchone()[0]
        backup.close();reader.close();db.close()
    print(f'PASS: {checks} schema/query checks; {tables} tables, {views} views; SQLite {sqlite3.sqlite_version}. Temporary databases removed.')

if __name__=='__main__':
    main()
