PROXY_URL=$1
PROXY_TIMEOUT=$2
AWS_PROFILE=$3
VPC_ID=$4
SUBNET_IDS=$5

export AWS_SDK_LOAD_CONFIG=true

npm run deploy -- \
  --proxyUrl ${PROXY_URL} \
  --proxyTimeout ${PROXY_TIMEOUT} \
  --aws-profile ${AWS_PROFILE} \
  --vpcId ${VPC_ID} \
  --subnetIds ${SUBNET_IDS}
