import {Construct} from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {Topic} from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as iam from "aws-cdk-lib/aws-iam";

export class ApiFunction {
    static createInstanceFunction(scope: Construct, topic: Topic, templateUrl: string){
        return new lambda.Function(scope, 'create-server-function', {
            runtime: lambda.Runtime.PYTHON_3_12,
            code: lambda.Code.fromAsset('resources'),
            handler: 'cf-controller.main',
            environment: {
                TOPIC_ARN: topic.topicArn,
                TEMPLATE_URL: templateUrl,
            },
            initialPolicy: [
                new iam.PolicyStatement({
                    actions: ['cloudformation:CreateStack'],
                    resources: ['*']
                }),
                new iam.PolicyStatement({
                    actions: ['SNS:Publish'],
                    resources: [topic.topicArn]
                }),
                new iam.PolicyStatement({
                    actions: ['ec2:*'],
                    resources: ['*']
                }),
            ]
        });
    }
    static createCfCallbackHandler(scope: Construct, topic: Topic){
        let callbackHandler = new lambda.Function(scope, 'cf-callback-handle-function', {
            runtime: lambda.Runtime.PYTHON_3_12,
            code: lambda.Code.fromAsset('resources'),
            handler: 'cf-callback-handler.main',
            environment: {
                TOPIC_ARN: topic.topicArn,
            }
        });
        topic.addSubscription(new subs.LambdaSubscription(callbackHandler))
    }

}