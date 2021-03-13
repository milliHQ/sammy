/**
 * Spawns a new AWS SAM process which can then be accessed by
 * - aws-sdk (type: sdk)
 * - API-gateway (type: api)
 */

import { spawn } from 'child_process';

import { createDeferred } from './utils';

interface SAMLocalOptions {
  // https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-local-start-api.html
  warmContainers?: 'EAGER' | 'LAZY';
  onData?: (data: any) => void;
  onError?: (data: any) => void;
}
export interface SAMLocal {
  kill: () => void;
}

export async function createSAMLocal(
  type: 'sdk' | 'api',
  cwd: string,
  port: number,
  options: SAMLocalOptions = {}
): Promise<SAMLocal> {
  const {warmContainers, onData, onError} = options
  const sdkSpawnArgs = [
    'local', 'start-lambda',
    '--port', `${port}`,
    '--region', 'local',
  ];
  const apiSpawnArgs = [
    'local', 'start-api',
    '--port', `${port}`,
    ...(warmContainers ? ['--warm-containers',warmContainers] : []),
  ];
  const defer = createDeferred();
  let started = false;

  const startDefer = createDeferred();
  function checkStart(data: any) {
    if (!started && data.toString().includes('Press CTRL+C to quit')) {
      started = true;
      startDefer.resolve();
    }
  }

  const process = spawn('sam', type === 'sdk' ? sdkSpawnArgs : apiSpawnArgs, {
    cwd,
  });

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
