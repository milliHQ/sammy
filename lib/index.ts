import { generateAPISAM, APISAMGenerator } from './generateAPISAM';
/**
 * @deprecated - please use `generateAPISAM` instead
 */
const generateSAM = generateAPISAM;

export { generateAPISAM, APISAMGenerator, generateSAM };

export { generateLocalSAM, LocalSAMGenerator } from './generateLocalSAM';
export { generateProxySAM, SAM as ProxySAM } from './generateProxyModel';
export { normalizeCloudFrontHeaders } from './utils';

// Types
export type { ConfigLambda } from './types';
