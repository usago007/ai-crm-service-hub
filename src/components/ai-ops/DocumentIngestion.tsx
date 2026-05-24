import { useState } from 'react';
import { useT } from '../../i18n';
import { Badge, type BadgeVariant } from '../common/Badge';
import { Button } from '../common/Button';
import { DataTable } from '../common/DataTable';
import { PanelCard, inputCls } from '../common/PageChrome';
import { INGESTION_RECORDS } from '../../data/aiOperations';

interface IngestionRecord {
  id: string;
  name: string;
  sourceType: string;
  knowledgeType: string;
  scenario: string;
  language: string;
  owner: string;
  parseStatus: string;
  chunkStatus: string;
  embeddingStatus: string;
  indexStatus: string;
  chunkCount: number;
  vectorCount: number;
  version: string;
  lastSync: string;
}

const statusVariant = (s: string) => {
  if (s === 'Published') return 'green';
  if (s === 'Indexed') return 'green';
  if (s === 'Embedded') return 'blue';
  if (s === 'Parsed' || s === 'Chunking') return 'blue';
  if (s === 'Parsing') return 'yellow';
  if (s === 'Pending' || s === 'Uploaded') return 'gray';
  if (s === 'Failed') return 'red';
  return 'gray';
};

const badgeVariant = (status: string): BadgeVariant => statusVariant(status) as BadgeVariant;

export function DocumentIngestion() {
  const { t } = useT();
  const [records, setRecords] = useState<IngestionRecord[]>(INGESTION_RECORDS as IngestionRecord[]);
  const [docName, setDocName] = useState('');
  const [sourceType, setSourceType] = useState('PDF');
  const [knowledgeType, setKnowledgeType] = useState('Policy');
  const [scenario, setScenario] = useState('Shipping');
  const [language, setLanguage] = useState('EN');
  const [owner, setOwner] = useState('');
  const [version, setVersion] = useState('v1.0');
  const [effectiveDate, setEffectiveDate] = useState('2026-05-21');

  const showToast = (msg: string) => {
    const el = document.createElement('div');
    el.className = 'fixed bottom-4 right-4 bg-[var(--color-success)] text-white px-4 py-2 rounded-lg text-xs shadow-lg z-[9999]';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  };

  const handleIngest = () => {
    const name = docName || `New Document.${sourceType.toLowerCase()}`;
    const newRec: IngestionRecord = {
      id: `DOC-${String(records.length + 1).padStart(3, '0')}`,
      name,
      sourceType,
      knowledgeType,
      scenario,
      language,
      owner: owner || 'Ops',
      parseStatus: 'Uploaded',
      chunkStatus: 'Pending',
      embeddingStatus: 'Pending',
      indexStatus: 'Pending',
      chunkCount: 0,
      vectorCount: 0,
      version,
      lastSync: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    setRecords([newRec, ...records]);
    setDocName('');
    showToast(t.aiOps.ingestionStarted);

    setTimeout(() => setRecords(prev => prev.map(r => r.id === newRec.id ? { ...r, parseStatus: 'Parsing' } : r)), 800);
    setTimeout(() => setRecords(prev => prev.map(r => r.id === newRec.id ? { ...r, parseStatus: 'Parsed', chunkStatus: 'Chunking' } : r)), 2000);
    setTimeout(() => setRecords(prev => prev.map(r => r.id === newRec.id ? { ...r, chunkStatus: 'Indexed', embeddingStatus: 'Embedded', chunkCount: Math.floor(Math.random() * 40) + 10, vectorCount: Math.floor(Math.random() * 40) + 10 } : r)), 3500);
    setTimeout(() => setRecords(prev => prev.map(r => r.id === newRec.id ? { ...r, embeddingStatus: 'Indexed', indexStatus: 'Published' } : r)), 5000);
  };

  const labelCls = 'text-xs text-[var(--color-text-secondary)] mb-1 block';

  return (
    <div className="grid grid-cols-1 gap-4">
      <PanelCard title={t.aiOps.uploadDocument} description="Create a mock ingestion record and watch parse, chunk, embed, and publish statuses progress through the workflow.">
        <div className="grid grid-cols-4 gap-3 max-[1200px]:grid-cols-2">
          <div>
            <label className={labelCls}>{t.aiOps.documentName}</label>
            <input className={inputCls} value={docName} onChange={e => setDocName(e.target.value)} placeholder={`e.g. Policy_v1.pdf`} />
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.sourceType}</label>
            <select className={inputCls} value={sourceType} onChange={e => setSourceType(e.target.value)}>
              {['PDF', 'DOCX', 'XLSX', 'CSV', 'HTML', 'TXT'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.knowledgeType}</label>
            <select className={inputCls} value={knowledgeType} onChange={e => setKnowledgeType(e.target.value)}>
              {['FAQ', 'Policy', 'Product Spec', 'Business Rule', 'Reply Template'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.scenarioLabel}</label>
            <select className={inputCls} value={scenario} onChange={e => setScenario(e.target.value)}>
              {['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint', 'Promotion'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{(t.aiOps as Record<string, string>).knowledgeType === '知识类型' ? '语言' : 'Language'}</label>
            <select className={inputCls} value={language} onChange={e => setLanguage(e.target.value)}>
              {['EN', 'ZH', 'ES', 'RU', 'JA', 'FR', 'Multi'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.ownerLabel}</label>
            <input className={inputCls} value={owner} onChange={e => setOwner(e.target.value)} placeholder="Ops / CS Lead / Product" />
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.versionLabel}</label>
            <input className={inputCls} value={version} onChange={e => setVersion(e.target.value)} placeholder="v1.0" />
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.effectiveDate}</label>
            <input type="date" className={inputCls} value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <Button size="sm" onClick={handleIngest}>{t.aiOps.startIngestion}</Button>
        </div>
      </PanelCard>

      <DataTable
        columns={[
          { key: 'name', label: t.aiOps.documentName, width: '20%' },
          { key: 'sourceType', label: t.aiOps.sourceType },
          { key: 'knowledgeType', label: t.aiOps.knowledgeType },
          { key: 'scenario', label: t.aiOps.scenarioLabel },
          { key: 'language', label: 'Language' },
          { key: 'owner', label: t.aiOps.ownerLabel },
          { key: 'parseStatus', label: t.aiOps.parseStatus },
          { key: 'chunkStatus', label: t.aiOps.chunkStatus },
          { key: 'embedStatus', label: t.aiOps.embedStatus },
          { key: 'indexStatus', label: t.aiOps.indexStatus },
          { key: 'chunkCount', label: t.aiOps.chunkCount },
          { key: 'vectorCount', label: t.aiOps.vectorCount },
          { key: 'version', label: t.aiOps.versionLabel },
          { key: 'lastSync', label: t.aiOps.lastSync },
          { key: 'actions', label: t.aiOps.actions },
        ]}
        emptyMessage="No ingestion records available."
      >
            {records.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? 'bg-[var(--color-bg)]' : ''}>
                <td className="px-4 py-3 text-[13px] border-b border-[var(--color-border-light)] font-medium whitespace-nowrap">{r.name}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{r.sourceType}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant="blue">{r.knowledgeType}</Badge></td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{r.scenario}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{r.language}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{r.owner}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={badgeVariant(r.parseStatus)}>{r.parseStatus}</Badge></td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={badgeVariant(r.chunkStatus)}>{r.chunkStatus}</Badge></td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={badgeVariant(r.embeddingStatus)}>{r.embeddingStatus}</Badge></td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={badgeVariant(r.indexStatus)}>{r.indexStatus}</Badge></td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] tabular-nums">{r.chunkCount || '—'}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] tabular-nums">{r.vectorCount || '—'}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{r.version}</td>
                <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border-light)] whitespace-nowrap">{r.lastSync}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">
                  <Button variant="ghost" size="sm" onClick={() => showToast(t.aiOps.syncStarted)}>Sync</Button>
                </td>
              </tr>
            ))}
      </DataTable>
    </div>
  );
}
