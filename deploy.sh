PROXY_URL=$1
PROXY_TIMEOUT=$2
HTTP_SERVICE_URL=$3
AWS_PROFILE=$4
VPC_ID=$5
PRIVATE_SUBNET_IDS=$6
PUBLIC_SUBNET_IDS=$7

export AWS_SDK_LOAD_CONFIG=true

npm run build

npm run deploy -- \
  --proxyUrl ${PROXY_URL} \
  --proxyTimeout ${PROXY_TIMEOUT} \
  --httpServiceUrl ${HTTP_SERVICE_URL} \
  --aws-profile ${AWS_PROFILE} \
  --vpcId ${VPC_ID} \
  --privateSubnetIds ${PRIVATE_SUBNET_IDS} \
  --publicSubnetIds ${PUBLIC_SUBNET_IDS}
