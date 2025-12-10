import { Invoice } from './invoice.model';
import { ExtractionMetadata } from './extraction-metadata.model';

export interface ExtractionResponse {
  invoice: Invoice;
  extraction_metadata: ExtractionMetadata;
  message: string;
}
