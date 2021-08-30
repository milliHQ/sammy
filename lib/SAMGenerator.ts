import * as fs from 'fs';
import { EventEmitter } from 'events';
import * as path from 'path';

import getPort from 'get-port';
import { dirSync as tmpDirSync, DirResult } from 'tmp';

import { SAMTemplate } from './SAMTemplate';
import { ConfigLambda, SAMLocalAPICLIOptions } from './types';
import { unzipToLocation } from './utils';
import { createSAMLocal, SAMLocal } from './SAMLocal';

type GeneratorType = 'api' | 'sdk';

type SAMInstance = {
  port: number;
  host: string;
  endpoint: string;
  region: string;
};

class LoggerEmitter extends EventEmitter {}

/**
 * Generator for an AWS SAM CLI instance
 */
class SAMGenerator {
  loggerEmitter: LoggerEmitter;
  SAM?: SAMLocal;
  SAMInstance?: SAMInstance;
  template: SAMTemplate;
  tmpDir: DirResult;
  type: GeneratorType;

  constructor(type: GeneratorType) {
    this.loggerEmitter = new LoggerEmitter();
    this.tmpDir = tmpDirSync({ unsafeCleanup: true });
    this.template = new SAMTemplate();
    this.type = type;
  }

  // Explicit `this` binding
  private onData = (message: any) => {
    this.loggerEmitter.emit('data', message);
  };

  // Explicit `this` binding
  private onError = (message: any) => {
    this.loggerEmitter.emit('error', message);
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
    cwd: string = process.cwd()
  ) {
    // Unpack all lambdas
    for (const [functionName, lambda] of Object.entries(lambdas)) {
      const functionSourcePath = path.isAbsolute(lambda.filename)
        ? lambda.filename
        : path.join(cwd, lambda.filename);

      await unzipToLocation(
        functionSourcePath,
        path.join(this.tmpDir.name, functionName)
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
      fs.writeFileSync(
        path.join(this.tmpDir.name, 'template.yml'),
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
   * Subscribe to data or error messages from the CLI
   * @param topic
   * @param callback
   */
  on(topic: 'data' | 'error', callback: (data: string) => void) {
    this.loggerEmitter.on(topic, callback);
  }

  /**
   * Unsubscribe to data or error messages from the CLI
   * @param topic
   * @param callback
   */
  off(topic: 'data' | 'error', callback: (data: string) => void) {
    this.loggerEmitter.off(topic, callback);
  }
}

export { SAMGenerator };
