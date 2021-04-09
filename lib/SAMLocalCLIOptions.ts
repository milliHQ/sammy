import { paramCase } from 'change-case';
import { SAMLocalCLIOptions, SAMLocalType } from './types';
import { isNotEmptyString, isFinite } from './utils';

const cliOptionKeys = [
  'host',
  'port',
  'template',
  'envVars',
  'parameterOverrides',
  'debugPort',
  'debuggerPath',
  'debugArgs',
  'warmContainers',
  'debugFunction',
  'dockerVolumeBasedir',
  'dockerNetwork',
  'containerEnvVars',
  'logFile',
  'layerCacheBasedir',
  'skipPullImage',
  'forceImageBuild',
  'profile',
  'region',
  'configFile',
  'configEnv',
  'debug',
];

const isLocalStartLambdaCLIArgKey = (key: string) => {
  return cliOptionKeys.indexOf(key) > -1;
};
const isLocalStartAPICLIArgKey = (key: string) => {
  return [...cliOptionKeys, 'staticDir'].indexOf(key) > -1;
};

export const getCLIOptionArgs = (
  type: SAMLocalType,
  options: SAMLocalCLIOptions
): string[] => {
  const args = Object.keys(options).reduce((prev, key) => {
    const validKey =
      type === 'api'
        ? isLocalStartAPICLIArgKey(key)
        : isLocalStartLambdaCLIArgKey(key);
    if (!validKey) {
      console.warn(`Unknown option: ${key}. It is ignored.`);
      return prev;
    }

    const value = options[key as keyof SAMLocalCLIOptions];
    const paramArgs = isNotEmptyString(value)
      ? [`--${paramCase(key)}`, value]
      : isFinite(value)
      ? [`--${paramCase(key)}`, value + '']
      : /*typeof value === 'boolean'*/ [`--${paramCase(key)}`];
    return [...prev, ...paramArgs];
  }, [] as string[]);

  return args;
};
