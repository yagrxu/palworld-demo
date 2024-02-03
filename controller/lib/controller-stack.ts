import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as sqs from 'aws-cdk-lib/aws-sqs';
import {Attribute, AttributeType} from "aws-cdk-lib/aws-dynamodb/lib/shared";

export class ControllerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const handler = new lambda.Function(this, 'controller-main', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('resources'),
      handler: 'controller.main',
      environment: {}
    });

    // bucket.grantReadWrite(handler);

    const api = new apigateway.RestApi(this, 'controller-api', {
      restApiName: 'controller Service',
      description: 'This service serves platform orchestration.'
    });

    const test = new apigateway.LambdaIntegration(handler, {
      requestTemplates: {'application/json': '{ "statusCode": "200" }'}
    });

    api.root.addMethod('GET', test);

    const serverTable = new dynamodb.Table(this, 'ServerTable', {
      tableName: 'server-table',
      pointInTimeRecovery: true,
      partitionKey: {name: 'server-id', type: AttributeType.STRING},
      sortKey: {name: 'server-name', type: AttributeType.STRING},
    });
    const sessionTable = new dynamodb.Table(this, 'ServerTable', {
      tableName: 'server-session',
      pointInTimeRecovery: true,
      partitionKey: {name: 'server-id', type: AttributeType.STRING},
      sortKey: {name: 'server-name', type: AttributeType.STRING},
    });
  }
}
