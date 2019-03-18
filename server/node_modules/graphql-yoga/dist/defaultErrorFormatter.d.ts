import { GraphQLFormattedError } from 'graphql/error/formatError';
export interface PrismaErrorProps {
    code?: number;
    requestId?: string;
}
export declare function defaultErrorFormatter(error: any): GraphQLFormattedError & PrismaErrorProps;
