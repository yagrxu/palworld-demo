# palworld-demo

## How to use the CDK

### Prepare Environment Values

```shell
export CDK_DEFAULT_ACCOUNT=`aws sts get-caller-identity | jq .Account -r`
export CDK_DEFAULT_REGION='ap-southeast-1'
```

### Server Deployment Commands

1. KeyPairs

   - For the fist time deployment, you can create a keyPair for instance ssh login by using `export CREATE_KEYPAIR=true`.
   - We use key name `pal-server-keypair-${region}` for all servers in the same region.

    > **&#9432;** If you do not have the keyPair in the deployment region and do not set `export CREATE_KEYPAIR=true` to create the keyPair, the deployment will fail.

2. Backup S3 Bucket

   - For the fist time deployment, you can create a bucket for backups and other purposes by using `export CREATE_BUCKET=true`.
   - We use bucket name `palworld-cdk-demo-${accountId}-${region}` for all servers in the same region.
   - In case bucket name is already taken by others, you can also provide 

   > **&#9432;** If you do not have the bucket in the deployment region and do not set `export CREATE_BUCKET=true` nor `export BUCKET_NAME=xxx` to create or assign the bucket, the deployment will fail.

```shell
cd ./server
export CREATE_KEYPAIR=true
export CREATE_BUCKET=true
cdk deploy --require-approval never
```


## Clean up Projects

Go to the root of CDK projects and run the command below.

```shell
cdk destroy --all --force
```
