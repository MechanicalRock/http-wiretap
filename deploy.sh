PROXY_URL=$1
PROXY_TIMEOUT=$2
AWS_PROFILE=$3
VPC_ID=$4
PRIVATE_SUBNET_IDS=$5
PUBLIC_SUBNET_IDS=$6

export AWS_SDK_LOAD_CONFIG=true

npm run build

npm run deploy -- \
  --proxyUrl ${PROXY_URL} \
  --proxyTimeout ${PROXY_TIMEOUT} \
  --aws-profile ${AWS_PROFILE} \
  --vpcId ${VPC_ID} \
  --privateSubnetIds ${PRIVATE_SUBNET_IDS} \
  --publicSubnetIds ${PUBLIC_SUBNET_IDS}
