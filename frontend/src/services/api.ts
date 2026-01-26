
// Re-export from root api service to ensure consistency and fix build errors
export * from '../../../services/api';
import { api as rootApi } from '../../../services/api';
export const api = rootApi;
