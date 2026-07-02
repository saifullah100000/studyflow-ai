import {
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class N8nProcessingCallbackDto {
  @IsUUID('4', {
    message: 'Job ID must be a valid UUID',
  })
  jobId!: string;

  @IsUUID('4', {
    message: 'Request ID must be a valid UUID',
  })
  requestId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  executionId?: string;
}

export class N8nCompletedCallbackDto extends N8nProcessingCallbackDto {
  @IsObject({
    message: 'Output must be a structured object',
  })
  output!: Record<string, unknown>;
}

export class N8nFailedCallbackDto extends N8nProcessingCallbackDto {
  @IsString({
    message: 'Error message must be text',
  })
  @MaxLength(1000, {
    message: 'Error message cannot exceed 1000 characters',
  })
  errorMessage!: string;
}
