import {Construct} from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {Topic} from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as iam from "aws-cdk-lib/aws-iam";
import {Util} from "./util";

export class ApiFunction {
    static createCfDeployFunction(scope: Construct, name: string, handler: string, policies: iam.PolicyStatement[], env: any){
        let id = name
        return new lambda.Function(scope, id, {
            functionName: id,
            runtime: lambda.Runtime.PYTHON_3_12,
            code: lambda.Code.fromAsset('resources'),
            handler: handler,
            environment: env,
            initialPolicy: policies
        });
    }
    static createCfCallbackHandler(scope: Construct, id: string, topic: Topic, networkTableName: string){
        let callbackHandler = new lambda.Function(scope, id, {
            functionName: id,
            runtime: lambda.Runtime.PYTHON_3_12,
            code: lambda.Code.fromAsset('resources'),
            handler: 'cf-callback-handler.main',
            environment: {
                TOPIC_ARN: topic.topicArn,
                NETWORK_TABLE_NAME: networkTableName,
                CF_MGMT_TABLE: Util.TableName.get("cf-mgmt") || 'cf-mgmt',
                SERVER_TABLE_NAME: Util.TableName.get('server') || 'server-table',
                NICKNAME_TABLE_NAME: Util.TableName.get('nickname') || 'server-nick-name-mapping'

            },
            initialPolicy:[
                new iam.PolicyStatement({
                    actions: ['cloudformation:DescribeStacks', 'ec2:DescribeVpcs', 'ec2:DescribeInstances', 'ec2:DescribeSubnets', 'dynamodb:PutItem', 'dynamodb:DeleteItem', 'dynamodb:GetItem', 'dynamodb:Scan'],
                    resources: ['*']
                }),
                new iam.PolicyStatement({
                    actions: ['cloudformation:Delete*', 'ec2:Delete*', 'dynamodb:Delete*', 'lambda:Delete*', 'event:Delete*', 'ssm:Delete*', 'iam:DetachRolePolicy', 'iam:Delete*'],
                    resources: ['*']
                }),
            ]
        });
        topic.addSubscription(new subs.LambdaSubscription(callbackHandler))
    }

    static createFindNextNetworkHandler(scope: Construct, id: string, networkTableName: string){
        return new lambda.Function(scope, id, {
            functionName: id,
            runtime: lambda.Runtime.PYTHON_3_12,
            code: lambda.Code.fromAsset('resources'),
            handler: 'find-possible-networks.main',
            environment: {
                NETWORK_TABLE_NAME: networkTableName,
                CF_MGMT_TABLE: Util.TableName.get("cf-mgmt") || 'cf-mgmt'
            },
            initialPolicy:[
                new iam.PolicyStatement({
                    actions: ['cloudformation:DescribeStacks', 'ec2:DescribeVpcs', 'ec2:DescribeSubnets', 'dynamodb:Scan'],
                    resources: ['*']
                })
            ]
        });
    }
}