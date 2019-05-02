AWS_PROFILE=$1

export AWS_SDK_LOAD_CONFIG=true

npm run build
npm run deploy -- --aws-profile ${AWS_PROFILE}
