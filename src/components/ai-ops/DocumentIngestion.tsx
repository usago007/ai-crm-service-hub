import { useState } from 'react';
import { useT } from '../../i18n';
import { Badge } from '../common/Badge';
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

  const inputCls = 'h-9 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 text-xs bg-white outline-none focus:border-[var(--color-primary)]';
  const labelCls = 'text-xs text-[var(--color-text-secondary)] mb-1 block';

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
        <div className="text-sm font-semibold mb-3">{t.aiOps.uploadDocument}</div>
        <div className="grid grid-cols-4 gap-3 max-[1200px]:grid-cols-2">
          <div>
            <label className={labelCls}>{t.aiOps.documentName}</label>
            <input className={`${inputCls} w-full`} value={docName} onChange={e => setDocName(e.target.value)} placeholder={`e.g. Policy_v1.pdf`} />
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.sourceType}</label>
            <select className={`${inputCls} w-full`} value={sourceType} onChange={e => setSourceType(e.target.value)}>
              {['PDF', 'DOCX', 'XLSX', 'CSV', 'HTML', 'TXT'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.knowledgeType}</label>
            <select className={`${inputCls} w-full`} value={knowledgeType} onChange={e => setKnowledgeType(e.target.value)}>
              {['FAQ', 'Policy', 'Product Spec', 'Business Rule', 'Reply Template'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.scenarioLabel}</label>
            <select className={`${inputCls} w-full`} value={scenario} onChange={e => setScenario(e.target.value)}>
              {['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint', 'Promotion'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.knowledgeType === '知识类型' ? '语言' : 'Language'}</label>
            <select className={`${inputCls} w-full`} value={language} onChange={e => setLanguage(e.target.value)}>
              {['EN', 'ZH', 'ES', 'RU', 'JA', 'FR', 'Multi'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.ownerLabel}</label>
            <input className={`${inputCls} w-full`} value={owner} onChange={e => setOwner(e.target.value)} placeholder="Ops / CS Lead / Product" />
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.versionLabel}</label>
            <input className={`${inputCls} w-full`} value={version} onChange={e => setVersion(e.target.value)} placeholder="v1.0" />
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.effectiveDate}</label>
            <input type="date" className={`${inputCls} w-full`} value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <button className="btn btn-primary btn-sm" onClick={handleIngest}>{t.aiOps.startIngestion}</button>
        </div>
      </div>

      <div className="overflow-auto border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)]">
        <table className="w-full border-collapse min-w-[1200px]">
          <thead>
            <tr>
              {[
                t.aiOps.documentName, t.aiOps.sourceType, t.aiOps.knowledgeType, t.aiOps.scenarioLabel,
                'Language', t.aiOps.ownerLabel,
                t.aiOps.parseStatus, t.aiOps.chunkStatus, t.aiOps.embedStatus, t.aiOps.indexStatus,
                t.aiOps.chunkCount, t.aiOps.vectorCount, t.aiOps.versionLabel, t.aiOps.lastSync, t.aiOps.actions,
              ].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? 'bg-[var(--color-bg)]' : ''}>
                <td className="px-3 py-2 text-[13px] border-b border-[var(--color-border-light)] font-medium whitespace-nowrap">{r.name}</td>
                <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{r.sourceType}</td>
                <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]"><Badge variant="blue">{r.knowledgeType}</Badge></td>
                <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{r.scenario}</td>
                <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{r.language}</td>
                <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{r.owner}</td>
                <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]"><Badge variant={statusVariant(r.parseStatus) as any}>{r.parseStatus}</Badge></td>
                <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]"><Badge variant={statusVariant(r.chunkStatus) as any}>{r.chunkStatus}</Badge></td>
                <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]"><Badge variant={statusVariant(r.embeddingStatus) as any}>{r.embeddingStatus}</Badge></td>
                <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]"><Badge variant={statusVariant(r.indexStatus) as any}>{r.indexStatus}</Badge></td>
                <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{r.chunkCount || '—'}</td>
                <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{r.vectorCount || '—'}</td>
                <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{r.version}</td>
                <td className="px-3 py-2 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border-light)] whitespace-nowrap">{r.lastSync}</td>
                <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">
                  <button className="text-[var(--color-primary)] hover:underline" onClick={() => showToast(t.aiOps.syncStarted)}>Sync</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
