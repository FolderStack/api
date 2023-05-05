import { Span, Transaction } from '@sentry/core';
import { extractTraceparentData } from '@sentry/node';
import * as Sentry from '@sentry/serverless';
import { AWSLambda } from '@sentry/serverless';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

AWSLambda.init({
    dsn: process.env.SENTRY_DSN!, // Replace with your actual Sentry DSN
    tracesSampleRate: 1.0, // Set the sample rate for Sentry tracing
});

export function withSentryTrace<T>(
    handler: (event: APIGatewayProxyEvent, context: Context) => Promise<T>
) {
    return async (event: APIGatewayProxyEvent, context: Context) => {
        const sentryTraceId = event.headers['sentry-trace']; // Assuming trace ID is sent in the "sentry-trace" header

        let transaction: Transaction | undefined;
        let span: Span | undefined;

        if (sentryTraceId) {
            const traceData = extractTraceparentData(sentryTraceId);

            if (traceData) {
                transaction = new Transaction({
                    name: context.functionName,
                    traceId: traceData.traceId,
                    sampled: traceData.parentSampled,
                });

                span = transaction.startChild({
                    op: 'aws.lambda.handler',
                    spanId: traceData.parentSpanId,
                });

                Sentry.getCurrentHub().configureScope((scope) => {
                    scope.setSpan(span);
                });
            }
        }

        try {
            const response = await handler(event, context);
            if (span) {
                span.finish();
            }
            if (transaction) {
                transaction.finish();
            }
            return response;
        } catch (error) {
            Sentry.captureException(error, span);
            if (span) {
                span.setStatus('internal_error');
                span.finish();
            }
            if (transaction) {
                transaction.finish();
            }
            await Sentry.AWSLambda.flush(2000); // Flush Sentry events with a 2000ms timeout
            throw error;
        }
    };
}
