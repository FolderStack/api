import { AWSPolicyGenerator } from './awsPolicyGenerator';
import { APIGatewayAuthorizerResult } from 'aws-lambda';

describe('AWSPolicyGenerator', () => {
    it('should generate a policy with the given parameters', () => {
        const principalId = 'principalId';
        const effect = 'Allow';
        const resource =
            'arn:aws:execute-api:region:account-id:api-id/stage/HTTP_VERB/resource-path';

        const expectedResult: APIGatewayAuthorizerResult = {
            principalId,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: effect,
                        Resource: resource,
                    },
                ],
            },
        };

        const result = AWSPolicyGenerator.generate(
            principalId,
            effect,
            resource
        );
        expect(result).toEqual(expectedResult);
    });

    it('should include the context if provided', () => {
        const principalId = 'principalId';
        const effect = 'Allow';
        const resource =
            'arn:aws:execute-api:region:account-id:api-id/stage/HTTP_VERB/resource-path';
        const context = { key: 'value' };

        const expectedResult: APIGatewayAuthorizerResult = {
            principalId,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: effect,
                        Resource: resource,
                    },
                ],
            },
            context,
        };

        const result = AWSPolicyGenerator.generate(
            principalId,
            effect,
            resource,
            context
        );
        expect(result).toEqual(expectedResult);
    });
});
