# palworld-demo

```shell
export CDK_DEFAULT_ACCOUNT=`aws sts get-caller-identity | jq .Account -r`                                             ✔  10002  15:53:02
export CDK_DEFAULT_REGION='ap-southeast-1'
```

cdk deploy --require-approval never
cdk destroy --all --force