# http-link-dataloader

[![CircleCI](https://circleci.com/gh/graphcool/http-link-dataloader.svg?style=shield)](https://circleci.com/gh/graphcool/http-link-dataloader) [![npm version](https://badge.fury.io/js/http-link-dataloader.svg)](https://badge.fury.io/js/http-link-dataloader)

📚📡 HTTP Apollo Link with batching & caching provided by dataloader.

## Idea

A Apollo Link that batches requests both in Node and the Browser.
You may ask what's the difference to [apollo-link-batch-http](https://github.com/apollographql/apollo-link/tree/master/packages/apollo-link-batch-http).
Instead of having a time-frame/fixed cache size based batching approach like in `apollo-link-batch-http`, this library uses [dataloader](https://github.com/facebook/dataloader) for batching requests. It is a more generic approach just depending on the Node.JS event loop that batches all consecutive queries directly.
The main use-case for this library is the usage from a [`graphql-yoga`](https://github.com/graphcool/graphql-yoga) server using [`prisma-binding`](https://github.com/graphcool/prisma-binding), but it can be used in any environment, even the browser as the latest `dataloader` version also runs in browser environments.

## Usage

```ts
import { HTTPLinkDataloader } from 'http-link-dataloader'

const link = new HTTPLinkDataloader()

const token = 'Auth Token'

const httpLink = new HTTPLinkDataloader({
  uri: `api endpoint`,
  headers: { Authorization: `Bearer ${token}` },
})
```

## Caching behavior

Note that the dataloader cache aggressively caches everything! That means if you don't want to cache anymore, just create a new instance of `BatchedHTTPLink`.
A good fit for this is every incoming HTTP request in a server environment - on each new HTTP request a new `BatchedHTTPLink` instance is created.

## Batching

This library uses array-based batching. Querying 2 queries like this creates the following payload:

```graphql
query {
  Item(id: "1") {
    id
    name
    text
  }
}
```

```graphql
query {
  Item(id: "2") {
    id
    name
    text
  }
}
```

Instead of sending 2 separate http requests, it gets combined into one:

```js
;[
  {
    query: `query {
      Item(id: "1") {
        id
        name
        text
      }
    }`,
  },
  {
    query: `query {
      Item(id: "2") {
        id
        name
        text
      }
    }`,
  },
]
```

**Note that the GraphQL Server needs to support the array-based batching!**
(Prisma supports this out of the box)

## Even better batching

A batching that would even be faster is alias-based batching. Instead of creating the array described above, it would generate something like this:

```js
{
  query: `
    query {
      item_1: Item(id: "1") {
        id
        name
        text
      }
      item_2: Item(id: "2") {
        id
        name
        text
      }
    }`
}
```

This requires a lot more logic and resolution magic for aliases, but would be a lot faster than the array based batching as our tests have shown!
Anyone intersted in working on this is more than welcome to do so!
You can either create an issue or just reach out to us in slack and join our #contributors channel.

## Help & Community [![Slack Status](https://slack.graph.cool/badge.svg)](https://slack.graph.cool)

Join our [Slack community](http://slack.graph.cool/) if you run into issues or have questions. We love talking to you!

![](http://i.imgur.com/5RHR6Ku.png)
