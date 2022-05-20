import { stringify as yaml } from 'yaml';

import {
  SAMTemplate as SAMTemplateJSON,
  ServerLessFunction,
  ServerLessFunctionAPIEvent,
} from './types';

type PickPartial<T, K extends keyof T> = { [P in K]: Partial<T[P]> };

type PartialServerLessFunctionProps = 'MemorySize' | 'Runtime' | 'Timeout';

type ServerLessFunctionArgs = ServerLessFunction & {
  Properties: PickPartial<
    ServerLessFunction['Properties'],
    PartialServerLessFunctionProps
  >;
};

const defaultFunctionProperties: Pick<
  ServerLessFunction['Properties'],
  PartialServerLessFunctionProps
> = {
  MemorySize: 128, // in mb
  Runtime: 'nodejs16.x',
  Timeout: 30, // in seconds
};

/**
 * Helper class to generate the SAMTemplate
 */
class SAMTemplate {
  template: SAMTemplateJSON;

  constructor() {
    // Default header
    this.template = {
      AWSTemplateFormatVersion: '2010-09-09',
      Transform: ['AWS::Serverless-2016-10-31'],
      Resources: {},
    };
  }

  private addAPIGatewayOutput() {
    if (!this.template.Outputs) {
      this.template.Outputs = {};
    }

    if (!('WebEndpoint' in this.template.Outputs)) {
      this.template.Outputs['WebEndpoint'] = {
        Value:
          "!Sub 'https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/'",
      };
    }
  }

  addLambda(functionName: string, lambda: ServerLessFunctionArgs) {
    this.template.Resources[functionName] = {
      ...lambda,
      Properties: {
        ...defaultFunctionProperties,
        ...lambda.Properties,
      },
    };
  }

  addRoute(
    functionName: string,
    routeKey: string,
    apiEvent: ServerLessFunctionAPIEvent
  ) {
    if (!(functionName in this.template.Resources)) {
      throw new Error(
        `No function resource with name "${functionName}". Please create the function first before adding routes.`
      );
    }

    // Initialize Events if not present
    if (!this.template.Resources[functionName].Properties.Events) {
      this.template.Resources[functionName].Properties.Events = {};
    }

    this.template.Resources[functionName].Properties.Events![
      routeKey
    ] = apiEvent;

    this.addAPIGatewayOutput();
  }

  toYaml() {
    return yaml(this.template);
  }
}

export { SAMTemplate };
