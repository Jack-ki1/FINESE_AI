// Backwards-compat re-export — new code should import from '@/store'
export * from './index';
export { useDatumStore as default } from './index';
import { MAX_FILE_BYTES as _MAX } from '@/lib/constants';
export const MAX_FILE_BYTES = _MAX;
