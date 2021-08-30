/**
 * Simple handler function used for testing
 */
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
