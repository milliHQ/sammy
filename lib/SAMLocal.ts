/**
 * Spawns a new AWS SAM process which can then be accessed by
 * - aws-sdk (type: sdk)
 * - API-gateway (type: api)
 */

import { spawn } from 'child_process';

import { getCLIOptionArgs } from './SAMLocalCLIOptions';
import { SAMLocalCLIOptions, SAMLocalType } from './types';
import { createDeferred } from './utils';

export interface SAMLocalOptions {
  onData?: (data: any) => void;
  onError?: (data: any) => void;
  cliOptions: SAMLocalCLIOptions;
}
export interface SAMLocal {
  kill: () => void;
}

export async function createSAMLocal(
  type: SAMLocalType,
  cwd: string,
  options: SAMLocalOptions = { cliOptions: {} }
): Promise<SAMLocal> {
  const { onData, onError, cliOptions } = options;
  const typeArg = type === 'sdk' ? 'start-lambda' : 'start-api';
  const spawnArgs = ['local', typeArg, ...getCLIOptionArgs(type, cliOptions)];
  const defer = createDeferred();
  let started = false;

  const startDefer = createDeferred();
  function checkStart(data: any) {
    if (!started && data.toString().includes('Press CTRL+C to quit')) {
      started = true;
      startDefer.resolve();
    }
  }

  const process = spawn('sam', spawnArgs, { cwd });

  process.on('exit', () => {
    defer.resolve();
  });

  process.stdout?.on('data', (data) => {
    checkStart(data);
    onData && onData(data);
  });

  process.stderr?.on('data', (data) => {
    checkStart(data);
    onError && onError(data);
  });

  // Wait until SAM CLI is running
  await startDefer.promise;

  return {
    async kill() {
      process.kill();
      await defer.promise;
    },
  };
}
