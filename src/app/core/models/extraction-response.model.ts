import { ExtractionMetadata } from './extraction-metadata.model';

// The API now returns ExtractionMetadata directly (no wrapper)
export type ExtractionResponse = ExtractionMetadata;
