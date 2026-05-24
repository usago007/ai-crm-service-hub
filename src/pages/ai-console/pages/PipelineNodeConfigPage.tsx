import { useState } from 'react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Toggle } from '../../../components/common/Toggle';
import type { AIConsoleProps } from '../types';
import { Field, PageHeader, SectionCard, StatCard } from '../shared';
import { inputCls } from '../sharedUtils';
import type { PipelineNodeModelConfig } from '../../../types';
import { displayScenario } from '../../../utils/display';

type Props = Pick<AIConsoleProps, 'pipelineNodeConfigs' | 'effectiveNodePolicies' | 'aiOpsStages' | 'onUpdatePipelineNodeConfig'>;

export function PipelineNodeConfigPage({ pipelineNodeConfigs, effectiveNodePolicies, aiOpsStages, onUpdatePipelineNodeConfig }: Props) {
  const [selectedId, setSelectedId] = useState<string>(pipelineNodeConfigs[0]?.id ?? '');
  const [draft, setDraft] = useState<PipelineNodeModelConfig | undefined>(pipelineNodeConfigs[0]);
  const [dirty, setDirty] = useState(false);
  const selected = pipelineNodeConfigs.find(item => item.id === selectedId) ?? pipelineNodeConfigs[0];
  const activeDraft = dirty ? draft : selected;

  function updateDraft(recipe: (current: PipelineNodeModelConfig) => PipelineNodeModelConfig) {
    setDraft(prev => recipe(prev ?? selected ?? pipelineNodeConfigs[0]));
    setDirty(true);
  }
  if (!activeDraft) return null;

  return (
    <div className="space-y-4">
      <PageHeader title="能力节点" description="把能力开关并入节点配置，所有启停、继承关系和模型覆盖都在一个地方完成。" />

      <div className="grid grid-cols-4 gap-3 max-[1200px]:grid-cols-2">
        <StatCard label="节点总数" value={String(effectiveNodePolicies.length)} detail="统一展示运行节点而不是拆成多套页面" />
        <StatCard label="节点覆盖" value={String(effectiveNodePolicies.filter(item => item.effectiveSource === 'node').length)} detail="关闭继承后才会生效" />
        <StatCard label="继承场景" value={String(effectiveNodePolicies.filter(item => item.effectiveSource === 'scenario').length)} detail="最终模型来自场景策略" />
        <StatCard label="停用节点" value={String(effectiveNodePolicies.filter(item => !item.enabled).length)} detail="这里才是最终启停状态" tone="yellow" />
      </div>

      <div className="grid grid-cols-[340px_minmax(0,1fr)] gap-4 max-[1200px]:grid-cols-1">
        <SectionCard title="节点列表">
          <div className="space-y-2">
            {effectiveNodePolicies.map(item => (
              <div
                key={item.nodeConfigId}
                className={`border rounded-[14px] p-3 cursor-pointer ${selectedId === item.nodeConfigId ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)]' : 'border-[var(--color-border-light)]'}`}
                onClick={() => setSelectedId(item.nodeConfigId)}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="font-medium text-sm">{item.name}</div>
                  <Badge variant={item.enabled ? 'green' : 'gray'}>{item.enabled ? '启用' : '停用'}</Badge>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">{item.effectiveModel}</div>
                <div className="flex gap-1 flex-wrap mt-2">
                  <Badge variant={item.effectiveSource === 'scenario' ? 'blue' : 'yellow'}>{item.effectiveSource === 'scenario' ? '继承场景' : '节点覆盖'}</Badge>
                  <Badge variant={item.humanConfirmationRequired ? 'red' : 'green'}>{item.humanConfirmationRequired ? '需人工确认' : '自动流转'}</Badge>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-[var(--color-text-secondary)]">最近更新：{activeDraft.updatedAt || '未记录'}</div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => {
                if (selected) setDraft(selected);
                setDirty(false);
              }}>恢复当前版本</Button>
              <Button size="sm" disabled={!dirty} onClick={() => { if (activeDraft) void onUpdatePipelineNodeConfig(activeDraft); setDirty(false); }}>保存节点配置</Button>
            </div>
          </div>

          <SectionCard title="节点运行配置">
            <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
              <Field label="节点名称"><input className={inputCls} value={activeDraft.name} onChange={e => updateDraft(prev => ({ ...prev, name: e.target.value }))} /></Field>
              <Field label="使用模型"><input className={inputCls} value={activeDraft.primaryModel ?? ''} onChange={e => updateDraft(prev => ({ ...prev, primaryModel: e.target.value || undefined }))} /></Field>
              <Field label="备用模型"><input className={inputCls} value={activeDraft.fallbackModel ?? ''} onChange={e => updateDraft(prev => ({ ...prev, fallbackModel: e.target.value || undefined }))} /></Field>
              <Field label="输入字段来源"><input className={inputCls} value={activeDraft.inputSource} onChange={e => updateDraft(prev => ({ ...prev, inputSource: e.target.value }))} /></Field>
              <Field label="输出结构"><input className={inputCls} value={activeDraft.outputSchema} onChange={e => updateDraft(prev => ({ ...prev, outputSchema: e.target.value }))} /></Field>
              <Field label="超时 ms"><input type="number" className={inputCls} value={activeDraft.timeoutMs} onChange={e => updateDraft(prev => ({ ...prev, timeoutMs: Number(e.target.value) }))} /></Field>
              <Field label="重试次数"><input type="number" className={inputCls} value={activeDraft.retryCount} onChange={e => updateDraft(prev => ({ ...prev, retryCount: Number(e.target.value) }))} /></Field>
              <Field label="失败回退"><input className={inputCls} value={activeDraft.fallbackStrategy} onChange={e => updateDraft(prev => ({ ...prev, fallbackStrategy: e.target.value }))} /></Field>
              <Field label="适用场景"><textarea className={`${inputCls} h-24 py-2 resize-none`} value={activeDraft.allowedScenarios.join('\n')} onChange={e => updateDraft(prev => ({ ...prev, allowedScenarios: e.target.value.split('\n').map(item => item.trim()).filter(Boolean) }))} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 max-[1000px]:grid-cols-1">
              <Toggle label="节点启用" on={activeDraft.enabled} onClick={() => updateDraft(prev => ({ ...prev, enabled: !prev.enabled }))} />
              <Toggle label="默认继承场景配置" on={activeDraft.inheritFromScenario} onClick={() => updateDraft(prev => ({ ...prev, inheritFromScenario: !prev.inheritFromScenario }))} />
              <Toggle label="要求引用" on={activeDraft.citationRequired} onClick={() => updateDraft(prev => ({ ...prev, citationRequired: !prev.citationRequired }))} />
              <Toggle label="要求人工确认" on={activeDraft.humanConfirmationRequired} onClick={() => updateDraft(prev => ({ ...prev, humanConfirmationRequired: !prev.humanConfirmationRequired }))} />
            </div>
            {activeDraft.inheritFromScenario ? (
              <div className="mt-3 text-xs text-[var(--color-text-secondary)] border border-[var(--color-border-light)] rounded-[12px] p-3 bg-[var(--color-bg)]">
                当前节点会继承场景策略中的主模型、回退口径和复核边界。只有关闭继承后，节点级模型覆盖才会生效。
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title="运维阶段快照">
            <div className="space-y-2">
              {aiOpsStages.slice(0, 4).map(stage => (
                <div key={stage.id} className="border border-[var(--color-border-light)] rounded-[12px] p-3 text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-medium">{stage.stage}</div>
                    <Badge variant={stage.status === 'healthy' ? 'green' : stage.status === 'watch' ? 'yellow' : 'red'}>{stage.status === 'healthy' ? '健康' : stage.status === 'watch' ? '观察' : '风险'}</Badge>
                  </div>
                  <div className="text-[var(--color-text-secondary)]">{stage.detail}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="节点作用范围">
            <div className="flex gap-2 flex-wrap text-xs">
              {activeDraft.allowedScenarios.map(item => (
                <div key={item} className="border border-[var(--color-border-light)] rounded-[999px] px-3 py-1 bg-white">{displayScenario(item)}</div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
