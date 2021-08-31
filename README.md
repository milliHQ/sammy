# Sammy

A Node.js wrapper for [AWS SAM CLI](https://aws.amazon.com/serverless/sam/) for local testing of Lambda functions.

## Usage

```sh
npm i -D @dealmore/sammy     # npm
yarn add -D @dealmore/sammy  # or yarn
```

Assuming you have a Lambda function with the following content:

```js
// handler.js
exports.handler = async function (event, context) {
  return {
    isBase64Encoded: false,
    statusCode: 200,
    body: 'Hello World!',
    headers: {
      'content-type': 'application/json',
    },
  };
};
```

which is packaged into a compressed zip file called `lambda.zip`.

### Run lambda locally with API-Gateway

You can now start the Lambda function locally and access it through an API-Endpoint:

```ts
import * as path from 'path';

import type { APISAMGenerator } from '@dealmore/sammy';
import { generateAPISAM } from '@dealmore/sammy';

const lambdaSAM = await generateAPISAM({
  lambdas: {
    first: {
      filename: 'lambda.zip',
      handler: 'handler.handler',
      runtime: 'nodejs14.x',
      route: '/test',
      method: 'get',
    },
  },
  cwd: process.cwd(),
});

const response = await lambdaSAM.sendApiGwRequest('/test');
console.log(await response.text());
// => Hello World!
```

## License

Apache-2.0 - see [LICENSE](./LICENSE) for details.
