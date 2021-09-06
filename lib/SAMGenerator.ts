import { writeFileSync } from 'fs';
import { EventEmitter } from 'events';
import { join, isAbsolute } from 'path';

import getPort from 'get-port';
import { dirSync as tmpDirSync, DirResult } from 'tmp';

import { SAMTemplate } from './SAMTemplate';
import { ConfigLambda, SAMLocalAPICLIOptions } from './types';
import { randomServerlessFunctionName, unzipToLocation } from './utils';
import { createSAMLocal, SAMLocal } from './SAMLocal';

type GeneratorType = 'api' | 'sdk';

type SAMInstance = {
  port: number;
  host: string;
  endpoint: string;
  region: string;
};

type GenerateLambdasOptions = {
  cwd?: string;
  randomizeFunctionNames?: boolean;
};

/**
 * Generator for an AWS SAM CLI instance
 */
class SAMGenerator extends EventEmitter {
  /**
   * Mapping of keys to the internal function name. We use internally randomized
   * function names since AWS SAM only accepts
   */
  private functionNames: Map<string, string>;
  SAM?: SAMLocal;
  SAMInstance?: SAMInstance;
  template: SAMTemplate;
  tmpDir: DirResult;
  type: GeneratorType;

  constructor(type: GeneratorType) {
    super();
    this.functionNames = new Map();
    this.tmpDir = tmpDirSync({ unsafeCleanup: true });
    this.template = new SAMTemplate();
    this.type = type;
  }

  // Explicit `this` binding
  private onData = (message: any) => {
    this.emit('data', message);
  };

  // Explicit `this` binding
  private onError = (message: any) => {
    this.emit('error', message);
  };

  /**
   * Unpacks the lambdas into a temporary workDir and creates a SAM Template
   * that can be passed to AWS SAM CLI
   *
   * @param lambdas - Key/Value object with the lambdas that should be created
   * @param cwd
   */
  async generateLambdas(
    lambdas: Record<string, ConfigLambda>,
    options?: GenerateLambdasOptions
  ) {
    const cwd = options?.cwd ?? process.cwd();

    // Unpack all lambdas
    for (const [externalFunctionName, lambda] of Object.entries(lambdas)) {
      const functionName = options?.randomizeFunctionNames
        ? randomServerlessFunctionName()
        : externalFunctionName;
      this.functionNames.set(externalFunctionName, functionName);

      const functionSourcePath = isAbsolute(lambda.filename)
        ? lambda.filename
        : join(cwd, lambda.filename);

      await unzipToLocation(
        functionSourcePath,
        join(this.tmpDir.name, functionName)
      );

      this.template.addLambda(functionName, {
        Type: 'AWS::Serverless::Function',
        Properties: {
          Handler: `${functionName}/${lambda.handler}`,
          Description: functionName,
          Runtime: lambda.runtime,
          MemorySize: lambda.memorySize ?? 128,
          Timeout: 29, // Max timeout from API Gateway
          Environment: {
            Variables: lambda.environment ?? {},
          },
        },
      });

      if (lambda.route) {
        this.template.addRoute(functionName, 'api', {
          Type: 'HttpApi',
          Properties: {
            Path: lambda.route,
            Method: lambda.method ?? 'any',
            TimeoutInMillis: 29000, // Max timeout
            PayloadFormatVersion: '2.0',
          },
        });
      } else if (lambda.routes) {
        for (const routeKey in lambda.routes) {
          this.template.addRoute(functionName, routeKey, {
            Type: 'HttpApi',
            Properties: {
              Path: lambda.routes[routeKey],
              Method: lambda.method ?? 'any',
              TimeoutInMillis: 29000, // Max timeout
              PayloadFormatVersion: '2.0',
            },
          });
        }
      }

      // Write the SAM template
      writeFileSync(
        join(this.tmpDir.name, 'template.yml'),
        this.template.toYaml()
      );
    }
  }

  /**
   * Start the AWS SAM CLI
   *
   * @param cliOptions
   */
  async start(cliOptions: SAMLocalAPICLIOptions = {}) {
    const port = cliOptions.port || (await getPort());
    const host = cliOptions.host || '127.0.0.1';
    const endpoint = `http://${host}:${port}`;
    const region = cliOptions.region || 'local';
    this.SAM = await createSAMLocal(this.type, this.tmpDir.name, {
      onData: this.onData,
      onError: this.onError,
      cliOptions: { ...cliOptions, port, host, region },
    });

    this.SAMInstance = {
      port,
      host,
      endpoint,
      region,
    };

    return this.SAMInstance;
  }

  /**
   * Stop the AWS SAM CLI
   */
  async stop() {
    if (this.SAM) {
      await this.SAM.kill();
    }

    this.tmpDir.removeCallback();
    this.SAMInstance = undefined;
  }

  /**
   * Get the real functionName for the key provided at creation
   */
  getFunctionName(key: string) {
    return this.functionNames.get(key);
  }
}

export { SAMGenerator };
