import AWSLambda, { InvocationType, _Blob } from 'aws-sdk/clients/lambda';

import { SAMGenerator } from './SAMGenerator';
import { GeneratorProps } from './types';

class LocalSAMGenerator extends SAMGenerator {
  private _client?: AWSLambda;

  private get client(): AWSLambda {
    if (!this._client) {
      this._client = new AWSLambda({
        endpoint: this.SAMInstance?.endpoint,
        region: this.SAMInstance?.region,
      });
    }

    return this._client;
  }

  sendEvent(
    functionName: string,
    invocationType: InvocationType,
    payload: _Blob
  ) {
    return this.client
      .invoke({
        FunctionName: functionName,
        InvocationType: invocationType,
        Payload: payload,
      })
      .promise();
  }
}

/**
 * Makes Lambdas callable though AWS SDK
 */
async function generateLocalSAM({
  lambdas,
  cwd,
  onData,
  onError,
}: GeneratorProps) {
  const generator = new LocalSAMGenerator('sdk');
  await generator.generateLambdas(lambdas, cwd);

  if (onData) {
    generator.on('data', onData);
  }

  if (onError) {
    generator.on('error', onError);
  }

  return generator;
}

export { generateLocalSAM, LocalSAMGenerator };
