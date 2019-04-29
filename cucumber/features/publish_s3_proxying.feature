Feature: Persist tee traffic into S3

In order to persist tee'd requests from an external service
As a developer
I want to publish the request data in S3

Rules:
  - All proxied requests are published to S3
  - Request data is published to a file in JSON format
  - Request data published to S3 contains the method, params, body, path and headers
  - Path of the file should be in format "yyyy/mm/dd/log_hh:mm:ss" (i.e. "2019/10/05/log_12:50:45")

@dev
Scenario: Client requests are published to S3
  When the client sends a request to the proxy
  Then the request data should be published to s3 at the correct path
