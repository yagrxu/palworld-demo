import {Construct} from "constructs";
import {aws_ec2} from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cdk from "aws-cdk-lib";

export class Util {

    static resolveKeyPair(scope: Construct, region: string){
        let props = Util.resolvePrivateProps();
        const toCreate: string = props.createKeyPair;
        if(toCreate === 'true') {
            return new aws_ec2.KeyPair(scope, "pal-server-keypair", {
                keyPairName: `pal-server-keypair-${region}`,
            })
        }else{
            return aws_ec2.KeyPair.fromKeyPairName(scope, "pal-server-keypair", `pal-server-keypair-${region}`)
        }
    }

    static resolveS3Bucket(scope: Construct, region: string, accountId: string){
        let props = Util.resolvePrivateProps();
        const toCreate: string = props.createBucket;
        const bucketName: string = props.bucketName || `game-server-cdk-demo-${accountId}-${region}`;
        if(toCreate === 'true') {
            const backupBucket = new s3.Bucket(scope, `game-server-cdk-demo-${accountId}`, {
                // default is already blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
                autoDeleteObjects: true,
                bucketName: bucketName,
            });
            backupBucket.addLifecycleRule({
                enabled:true,
                // expiredObjectDeleteMarker: true,
                expiration: cdk.Duration.days(3)
            })
            return backupBucket;
        }
        else{
            return s3.Bucket.fromBucketArn(scope, `game-server-cdk-demo-${accountId}`,`arn:aws:s3:::${bucketName}`);
        }
    }

    static resolvePrivateProps(){
        let createKeyPair= process.env.CREATE_KEYPAIR || 'false';
        let createBucket= process.env.CREATE_BUCKET || 'false';
        let bucketName= process.env.BUCKET_NAME;
        return {createKeyPair, createBucket, bucketName}
    }

    static randomSuffix(){
        return (Math.random() + 1).toString(36).substring(5);
    }
}
interface PrivateProps {
    readonly createKeyPair: string;
    readonly createBucket: string;
    readonly bucketName: string | undefined;
}