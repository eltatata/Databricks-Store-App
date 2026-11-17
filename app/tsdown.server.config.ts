import path from 'node:path';
import { appkitServerConfig } from '@databricks/appkit/tsdown';

const NODE_MODULES_SEGMENT = /[\\/]node_modules[\\/]/;
const BARE_SPECIFIER = /^[^./\\]/;

function isExternalDependency(id: string): boolean {
  if (NODE_MODULES_SEGMENT.test(id)) {
    return true;
  }
  return BARE_SPECIFIER.test(id) && !path.isAbsolute(id);
}

export default appkitServerConfig((base) => ({ ...base, external: isExternalDependency }));
