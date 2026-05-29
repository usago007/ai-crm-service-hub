import { CoreServiceStatus } from './CoreServiceStatus';
import { ModelChainStatus } from './ModelChainStatus';
import type { LLMStatus, EmbeddingServiceStatus, VectorDbStatus, DocumentIngestionQueueStatus, FunctionalModelStatus, ScenarioModelStatus } from '../../../../types';

interface ServicesAndModelsTabProps {
  llmStatus: LLMStatus;
  embeddingStatus: EmbeddingServiceStatus;
  vectorDbStatus: VectorDbStatus;
  ingestionQueue: DocumentIngestionQueueStatus;
  functionalModelStatuses: FunctionalModelStatus[];
  scenarioModelStatuses: ScenarioModelStatus[];
  onRetryFailedJobs: () => void;
  onRebuildVectorIndex: () => void;
}

export function ServicesAndModelsTab({
  llmStatus,
  embeddingStatus,
  vectorDbStatus,
  ingestionQueue,
  functionalModelStatuses,
  scenarioModelStatuses,
  onRetryFailedJobs,
  onRebuildVectorIndex,
}: ServicesAndModelsTabProps) {
  return (
    <div className="space-y-6">
      <CoreServiceStatus
        llmStatus={llmStatus}
        embeddingStatus={embeddingStatus}
        vectorDbStatus={vectorDbStatus}
        ingestionQueue={ingestionQueue}
        onRetryFailedJobs={onRetryFailedJobs}
        onRebuildVectorIndex={onRebuildVectorIndex}
      />
      <ModelChainStatus
        functionalModelStatuses={functionalModelStatuses}
        scenarioModelStatuses={scenarioModelStatuses}
      />
    </div>
  );
}
