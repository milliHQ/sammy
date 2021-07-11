import { CloudFrontHeaders } from 'aws-lambda';

function convertToCloudFrontHeaders(
  headers: Record<string, string>
): CloudFrontHeaders {
  const cloudFrontHeaders: CloudFrontHeaders = {};
  for (const key in headers) {
    const lowercaseKey = key.toLowerCase();
    cloudFrontHeaders[lowercaseKey] = [{ key, value: headers[key] }];
  }

  return cloudFrontHeaders;
}

export { convertToCloudFrontHeaders };
