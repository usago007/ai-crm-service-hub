import { FileSearch, Scissors, Layers, Search, Sparkles } from 'lucide-react';

export type RagConfigStep = 'parser' | 'chunking' | 'embedding' | 'retrieval' | 'prompt';

export const RAG_CONFIG_STEPS: Array<{ key: RagConfigStep; label: string; description: string; icon: typeof FileSearch }> = [
  { key: 'parser',    label: '文本解析',   description: '控制 OCR、表格、层级和语言识别',   icon: FileSearch },
  { key: 'chunking',  label: '切片分段',   description: '控制 chunk 大小、重叠和来源保留', icon: Scissors },
  { key: 'embedding', label: '向量化',     description: '控制 Embedding 模型、维度和索引', icon: Layers },
  { key: 'retrieval', label: '相似检索',   description: '控制 Top K、阈值、重排和过滤',   icon: Search },
  { key: 'prompt',    label: 'Prompt 组装', description: '控制上下文注入和输出格式',       icon: Sparkles },
];
