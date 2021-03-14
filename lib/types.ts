export interface ServerLessFunctionAPIEvent {
  Type: 'Api' | 'HttpApi';
  Properties: {
    Path: string;
    Method: string;
    TimeoutInMillis: number;
    PayloadFormatVersion: '1.0' | '2.0';
  };
}

export interface ServerLessFunction {
  Type: 'AWS::Serverless::Function';
  Properties: {
    Handler: string;
    Runtime: 'nodejs12.x' | 'nodejs14.x';
    MemorySize: number;
    Timeout: number;
    Description?: string;
    Events?: Record<'Api', ServerLessFunctionAPIEvent>;
    Environment?: { Variables?: Record<string, string> };
  };
}

export interface SAMTemplate {
  AWSTemplateFormatVersion: string;
  Transform: string[];
  Resources: Record<string, ServerLessFunction>;
  Outputs?: {
    WebEndpoint: {
      Value: string;
    };
  };
}

export interface ConfigLambda {
  handler: string;
  runtime: 'nodejs12.x' | 'nodejs14.x';
  filename: string;
  route: string;
  method?: string;
  environment?: Record<string, string>;
  memorySize?: number;
}

export type SAMLocalType = 'sdk' | 'api'

type WarmContainersOptions = 'EAGER' | 'LAZY'

export interface SAMLocalCLICommonOptions {
  host?: string
  port?: number
  template?: string
  envVars?: string
  parameterOverrides?: string
  debugPort?: string
  debuggerPath?: string
  debugArgs?: string
  warmContainers?: WarmContainersOptions
  debugFunction?: string
  dockerVolumeBasedir?: string
  dockerNetwork?: string
  containerEnvVars?: string
  logFile?: string
  layerCacheBasedir?: string
  skipPullImage?: boolean
  forceImageBuild?: boolean
  profile?: string
  region?: string
  configFile?: string
  configEnv?: string
  debug?: boolean
  // help?: boolean
}

export interface SAMLocalLambadCLIOptions extends SAMLocalCLICommonOptions {
  // https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-local-start-lambda.html
  // This type is the same as SAMLocalCLICommonOptions
}

export interface SAMLocalAPICLIOptions extends SAMLocalCLICommonOptions {
  // https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-local-start-api.html
  staticDir?: string
}

export type SAMLocalCLIOptions =
  | SAMLocalLambadCLIOptions
  | SAMLocalAPICLIOptions
