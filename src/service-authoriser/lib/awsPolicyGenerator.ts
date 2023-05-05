/// AWS Policy Generator creates the proper access to the function.

import { APIGatewayAuthorizerResult, PolicyDocument } from 'aws-lambda';

/// http://docs.aws.amazon.com/apigateway/latest/developerguide/use-custom-authorizer.html
export class AWSPolicyGenerator {
    static generate(
        principalId: string,
        effect: string,
        resource: string,
        context?: unknown
    ): APIGatewayAuthorizerResult {
        const authResponse: APIGatewayAuthorizerResult =
            {} as APIGatewayAuthorizerResult;

        authResponse.principalId = principalId;
        if (effect && resource) {
            const policyDocument: PolicyDocument = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: effect,
                        Resource: resource,
                    },
                ],
            };
            authResponse.policyDocument = policyDocument;
        }

        if (
            context !== null &&
            context !== undefined &&
            typeof context === 'object'
        ) {
            authResponse.context =
                context as APIGatewayAuthorizerResult['context'];
        }

        return authResponse;
    }
}
