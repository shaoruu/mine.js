import { GraphQLSchema } from 'graphql';
import { CacheHint, CacheControlExtensionOptions } from '../..';
export declare function collectCacheControlHints(schema: GraphQLSchema, source: string, options?: CacheControlExtensionOptions): Promise<CacheHint[]>;
