Feature: POST requests are forwarded to the http service

Rules:
  - Fowarding is triggered by S3 events containing client http request
  - Only client POST requests are forwarded to http service
  - Client request path, headers, params and body are forwarded to the http service
  - Client request host header is not included in request
  - Distributed tracing is configured (XRay)

Scenario: Non POST requests are not forwarded
  Given contents of a GET request
  When the contents are uploaded to a file on S3
  Then the proxy should not forward the request to the http service

Scenario: Client host header should not be forwarded to http service
  Given contents of a POST request with host header "http://mydomain.org"
  When the contents are uploaded to a file on S3
  Then the proxy should forward the request
  But the host header should not be the same

Scenario: Client request params, headers, body are forwarded on same path to the http service
  Given contents of a POST request
  When the contents are uploaded to a file on S3
  Then the proxy should forward the request should be to the same path
  And the request should have the same query params
  And the request should have the same headers params
  And the request should have the same body params
