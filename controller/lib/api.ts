import {Construct} from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import {Function} from "aws-cdk-lib/aws-lambda";
import {Topic} from "aws-cdk-lib/aws-sns";
import {RestApi} from "aws-cdk-lib/aws-apigateway";

export class ControllerApi {
    static createApiGateway(scope: Construct){
        return new RestApi(scope, 'controller-api', {
            restApiName: 'controller Service',
            description: 'This service serves platform orchestration.'
        });
    }
    static createServerApis(scope: Construct, api:RestApi, topic: Topic, func: Function){

        /** POST /servers
         * create a new server stack - info should be registered after creation
         * {size, stackName, serverName...}
         **/
        const serversApi = api.root.addResource('servers')
        const createServerIntegration = new apigateway.LambdaIntegration(func, {
            requestTemplates: {'application/json': '{ "statusCode": "200" }'}
        });
        serversApi.addMethod('POST', createServerIntegration)
    }
    static createNetworksApis(scope: Construct, api:RestApi, topic: Topic, func: Function){

        /** POST /servers
         * create a new server stack - info should be registered after creation
         * {size, stackName, serverName...}
         **/
        const serversApi = api.root.addResource('networks')
        const createServerIntegration = new apigateway.LambdaIntegration(func, {
            requestTemplates: {'application/json': '{ "statusCode": "200" }'}
        });
        serversApi.addMethod('POST', createServerIntegration);
    }

    static findNextSubnetApi(scope: Construct, api:RestApi, func: Function){
        let networkApi = api.root.getResource('networks');
        if (!networkApi){
            networkApi = api.root.addResource('networks');
        }
        const randomNetworkApi = networkApi.addResource('random');
        const createServerIntegration = new apigateway.LambdaIntegration(func, {
            requestTemplates: {'application/json': '{ "statusCode": "200" }'}
        });
        randomNetworkApi.addMethod('GET', createServerIntegration)
    }
}