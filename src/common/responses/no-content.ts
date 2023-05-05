import { APIGatewayProxyResult } from "aws-lambda";

export function NoContent(): APIGatewayProxyResult {
    return {
        statusCode: 204,
        body: ''
    }
}