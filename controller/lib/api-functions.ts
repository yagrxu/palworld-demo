import {Construct} from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {Topic} from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as iam from "aws-cdk-lib/aws-iam";
import {Util} from "./util";

export class ApiFunction {
    static createCfDeployFunction(scope: Construct, name: string, handler: string, policies: iam.PolicyStatement[], env: any){
        let id = name + '-' + Util.randomSuffix()
        return new lambda.Function(scope, id, {
            functionName: id,
            runtime: lambda.Runtime.PYTHON_3_12,
            code: lambda.Code.fromAsset('resources'),
            handler: handler,
            environment: env,
            initialPolicy: policies
        });
    }
    static createCfCallbackHandler(scope: Construct, topic: Topic){
        let callbackHandler = new lambda.Function(scope, 'cf-callback-handle-function', {
            runtime: lambda.Runtime.PYTHON_3_12,
            code: lambda.Code.fromAsset('resources'),
            handler: 'cf-callback-handler.main',
            environment: {
                TOPIC_ARN: topic.topicArn,
            },
            initialPolicy:[
                new iam.PolicyStatement({
                    actions: ['cloudformation:DescribeStacks'],
                    resources: ['*']
                })
            ]
        });
        topic.addSubscription(new subs.LambdaSubscription(callbackHandler))
    }

}