import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import rimraf from 'rimraf';

import { LocalSAMGenerator } from '../lib/index';
import { generateLocalSAM } from '../lib/index';
import { zipFolder } from './utils';

jest.setTimeout(120_000);

describe('integration:Event', () => {
  describe('single lambda', () => {
    const functionName = 'first';
    let lambdaSAM: LocalSAMGenerator;
    let tmpdir: string;

    beforeAll(async () => {
      // Generate zip from the fixture
      const randomTmpId = Math.random().toString().slice(2);
      tmpdir = path.resolve(os.tmpdir(), `sammy-${randomTmpId}`);
      fs.mkdirSync(tmpdir, { recursive: true });

      const lambdaZip = path.join(tmpdir, 'first.zip');
      await zipFolder(path.resolve(__dirname, 'fixture/'), lambdaZip);

      lambdaSAM = await generateLocalSAM({
        lambdas: {
          [functionName]: {
            filename: 'first.zip',
            handler: 'handler.handler',
            runtime: 'nodejs14.x',
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
      generateLocalSAM;
      await lambdaSAM.start();
    });

    afterAll(async () => {
      await lambdaSAM.stop();
      rimraf.sync(tmpdir);
    });

    test('Invoke through AWS SDK', async () => {
      const response = await lambdaSAM.sendEvent(
        functionName,
        'RequestResponse',
        ''
      );

      expect(response.StatusCode).toBe(200);
      expect(JSON.parse(response.Payload!.toString())).toEqual({
        isBase64Encoded: false,
        statusCode: 200,
        body: 'Hello World!',
        headers: {
          'content-type': 'application/json',
        },
      });
    });
  });
});
