import { GraphQLExtension, GraphQLResponse } from 'graphql-extensions';
export declare class FormatErrorExtension extends GraphQLExtension {
    private formatError;
    private debug;
    constructor(formatError: Function, debug?: boolean);
    willSendResponse(o: {
        graphqlResponse: GraphQLResponse;
    }): void | {
        graphqlResponse: GraphQLResponse;
    };
}
//# sourceMappingURL=formatters.d.ts.map