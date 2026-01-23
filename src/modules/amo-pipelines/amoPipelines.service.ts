import { AmoService } from '../../core/amo';
import {
  amoPipelinesResponseSchema,
  PipelineWithStatuses,
  pipelineWithStatusesSchema,
} from './amoPipelines.schemas';

export class AmoPipelinesService {
  constructor(private readonly amoService: AmoService) {}

  async getPipelines(): Promise<PipelineWithStatuses[]> {
    const data = await this.amoService.request({
      path: '/leads/pipelines',
    });

    // AmoCRM returns 204 No Content (empty response) when there are no results
    if (!data) {
      return [];
    }

    const parsed = amoPipelinesResponseSchema.parse(data);

    const pipelines = parsed._embedded.pipelines.map((pipeline) =>
      pipelineWithStatusesSchema.parse({
        id: pipeline.id,
        name: pipeline.name,
        is_main: pipeline.is_main,
        sort: pipeline.sort,
        statuses: pipeline._embedded.statuses,
      })
    );

    return pipelines;
  }
}
