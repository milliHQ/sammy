import nodeFetch from 'node-fetch';

import { SAMGenerator } from './SAMGenerator';
import { GeneratorProps } from './types';

type SendApiGwRequestOptions = {
  headers?: Record<string, string>;
};

class APISAMGenerator extends SAMGenerator {
  sendApiGwRequest(path: string, { headers }: SendApiGwRequestOptions = {}) {
    return nodeFetch(`${this.SAMInstance?.endpoint}${path}`, {
      headers,
    });
  }
}

/**
 * Wrapper that generates a serverless application model (SAM) for lambda inputs
 *
 * @see {@link https://github.com/aws/serverless-application-model/blob/master/versions/2016-10-31.md#awsserverlessfunction}
 * @param param0
 * @returns
 */
async function generateAPISAM({
  lambdas,
  cwd,
  randomizeFunctionNames,
  onData,
  onError,
}: GeneratorProps): Promise<APISAMGenerator> {
  const generator = new APISAMGenerator('api');
  await generator.generateLambdas(lambdas, { cwd, randomizeFunctionNames });

  if (onData) {
    generator.on('data', onData);
  }

  if (onError) {
    generator.on('error', onError);
  }

  return generator;
}

export { generateAPISAM, APISAMGenerator };
