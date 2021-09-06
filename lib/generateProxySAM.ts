import { createServer, Server } from 'http';

import AWSLambda, { InvocationType, _Blob } from 'aws-sdk/clients/lambda';
import getPort from 'get-port';

import { SAMGenerator } from './SAMGenerator';
import { GeneratorProps } from './types';

class ProxySAMGenerator extends SAMGenerator {
  configServer?: Server;

  private async startConfigServer() {
    const port = await getPort();
    this.configServer = createServer((_req, res) => {
      res.writeHead(200);
      res.end(proxyConfig);
    });

    return new Promise<void>((resolve) =>
      this.configServer!.listen(port, '0.0.0.0', () => {
        resolve();
      })
    );
  }

  start: SAMGenerator['start'] = async (...args) => {
    // Start the proxy config server
    const configServerPort = await getPort();

    return super.start(...args);
  };
}
