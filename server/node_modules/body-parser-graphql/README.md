# body-parser-graphql [![npm](https://img.shields.io/npm/v/body-parser-graphql.svg?style=for-the-badge)](https://www.npmjs.com/package/body-parser-graphql)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=for-the-badge)](https://github.com/semantic-release/semantic-release)[![CircleCI](https://img.shields.io/circleci/project/github/supergraphql/body-parser-graphql.svg?style=for-the-badge)](https://circleci.com/gh/supergraphql/body-parser-graphql)[![Code Climate](https://img.shields.io/codeclimate/maintainability/supergraphql/body-parser-graphql.svg?style=for-the-badge&label=code%20quality)](https://codeclimate.com/github/supergraphql/body-parser-graphql)[![Coveralls](https://img.shields.io/coveralls/github/supergraphql/body-parser-graphql.svg?style=for-the-badge)](https://coveralls.io/github/supergraphql/body-parser-graphql)[![Renovate badge](https://img.shields.io/badge/renovate-enabled-e10079.svg?style=for-the-badge)](https://renovateapp.com/)  
Express body-parser that supports the `application/graphql` MIME type.

## How does it work?
`body-parser-graphql` checks the `Content-Type` header of the request. If the Content-Type is `application/graphql`, the request is transformed into a 'normal' `application/json` GraphQL request, and the `Content-Type` header is set to `application/json`.

Received request:
```graphql
{
  posts {
    id
    title
  }
}
```
`request.body` value after the middleware:
```js
{
  query: {
    posts {
      id
      title
    }
  }
}
```

If an `application/json` request is received, it applies the JSON body-parser.

## Installation

Install `body-parser-graphql` using your favorite package manager:
```shell
$ yarn add body-parser-graphql
$ npm install body-parser-graphql
```

## Usage

The `body-parser-graphql` can be used as a drop-in replacement for the normal `json` body-parser.

```diff
import * as express from 'express'
- import * as bodyParser from 'body-parser'
+ import * as bodyParser from 'body-parser-graphql'

const app = express()

- app.use(bodyParser.json())
+ app.use(bodyParser.graphql())

// Your express routes

app.listen(/* your configuration */)
```

Alternatively, you can also import the body-parser directly:

```typescript
import { bodyParserGraphQL } from 'body-parser-graphql'

app.use(bodyParserGraphQL())
```

<hr>
<p align="center">
  <img src="https://img.shields.io/badge/built-with_%F0%9F%92%99-blue.svg?style=for-the-badge"/><a href="https://github.com/kbrandwijk" target="-_blank"><img src="https://img.shields.io/badge/by-kim_brandwijk-blue.svg?style=for-the-badge"/></a>
</p>
