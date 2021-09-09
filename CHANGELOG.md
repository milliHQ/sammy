# Changelog

## 2.0.1

Republish of `v2.0.0`.

## 2.0.0

This release is a rewrite of the internal template generator.
It is now possible to create Lambdas that are accessible via `aws-sdk`.

- Adds ability to start lambdas without API ([#7](https://github.com/milliHQ/sammy/pull/7))

## 1.7.0 (July 11, 2021)

- Adds ability to add custom request headers ([#6](https://github.com/milliHQ/sammy/pull/6))

## 1.6.1 (May 03, 2021)

- Return SAM endpoint on start ([#5](https://github.com/milliHQ/sammy/pull/5))

## 1.6.0 (April 09, 2021)

- Allows multiple routes per Lambda ([#3](https://github.com/milliHQ/sammy/issues/3) [#4](https://github.com/milliHQ/sammy/pull/4))

## 1.5.0 (March 14, 2021)

- Add support for passing all supported args to SAM CLI ([#2](https://github.com/milliHQ/sammy/pull/2))

## 1.4.0 (March 13, 2021)

- Add `--warm-containers` option to SAMLocalOptions ([#1](https://github.com/milliHQ/sammy/pull/1))
