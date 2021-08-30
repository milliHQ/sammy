import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import rimraf from 'rimraf';

import type { APISAMGenerator } from '../lib/index';
import { generateAPISAM } from '../lib/index';
import { zipFolder } from './utils';

jest.setTimeout(120_000);

describe('integration:Api-Gateway', () => {
  describe('single route', () => {
    const route = '/test';
    let lambdaSAM: APISAMGenerator;
    let tmpdir: string;

    beforeAll(async () => {
      // Generate zip from the fixture
      const randomTmpId = Math.random().toString().slice(2);
      tmpdir = path.resolve(os.tmpdir(), `sammy-${randomTmpId}`);
      fs.mkdirSync(tmpdir, { recursive: true });

      const lambdaZip = path.join(tmpdir, 'first.zip');
      await zipFolder(path.resolve(__dirname, 'fixture/'), lambdaZip);

      lambdaSAM = await generateAPISAM({
        lambdas: {
          first: {
            filename: 'first.zip',
            handler: 'handler.handler',
            runtime: 'nodejs14.x',
            route,
            method: 'get',
          },
        },
        cwd: tmpdir,
        onData(data) {
          console.log(data.toString());
        },
        onError(data) {
          console.log(data.toString());
        },
      });
      await lambdaSAM.start();
    });

    afterAll(async () => {
      await lambdaSAM.stop();
      rimraf.sync(tmpdir);
    });

    test('Invoke through API Gateway', async () => {
      const response = await lambdaSAM.sendApiGwRequest(route);
      expect(response.status).toBe(200);
      expect(Buffer.from(await response.buffer()).toString('utf-8')).toBe(
        'Hello World!'
      );
    });
  });
});
