import { GraphQLSchema } from 'graphql';
import { SharedLink } from './SharedLink';
export declare function getCachedTypeDefs(schemaPath: string, disableCache?: boolean): string;
export declare function getCachedRemoteSchema(endpoint: string, typeDefs: string, link: SharedLink, disableCache?: boolean): GraphQLSchema;
