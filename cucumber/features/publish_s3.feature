Feature: Persist tee traffic into S3

In order to persist tee'd requests from an external service
As a developer
I want to publish the request data in S3

Rules:
  - All proxied requests are published to S3
  - Distributed tracing is configured (XRay)
  - Request data is published to a file in JSON format
  - GET requests usually don't conventionally have a body but we should forward those anyway
  - Request data published to S3 contains the method, params, body, path and headers
  - Path of the file should be in format "yyyy/mm/dd/request_hh:mm:ss" (i.e. "2019/10/05/request_12:50:45")

@complete
Scenario Outline: All client requests are published to S3
  Given the client has sent a <method> request to the proxy
  Then a log file should be published to S3 under the date separated path
  And it should contain the request headers
  And it should contain the request path
  And it should contain the request params
  And it should contain the request body
  And it should contain the request method

  Examples:
    | method |
    | GET    |
    | POST   |
