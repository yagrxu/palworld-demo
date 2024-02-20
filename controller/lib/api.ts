import {Construct} from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import {ApiFunction} from "./api-functions";
import {Topic} from "aws-cdk-lib/aws-sns";

export class ControllerApi {
    static createServerApis(scope: Construct, topic: Topic){
        const api = new apigateway.RestApi(scope, 'controller-api', {
            restApiName: 'controller Service',
            description: 'This service serves platform orchestration.'
        });

        /** POST /servers
         * create a new server stack - info should be registered after creation
         * {size, stackName, serverName...}
         **/
        const serversApi = api.root.addResource('servers')
        const createServerIntegration = new apigateway.LambdaIntegration(ApiFunction.createInstanceFunction(scope, topic), {
            requestTemplates: {'application/json': '{ "statusCode": "200" }'}
        });
        serversApi.addMethod('POST', createServerIntegration)
    }
}