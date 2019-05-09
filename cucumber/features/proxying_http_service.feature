Feature: POST requests are forwarded to the http service

Rules:
  - Fowarding is triggered by S3 events containing client http request
  - Only client POST requests are forwarded to http service
  - Client request path, headers, params and body are forwarded to the http service
  - Client request host header is not included in request
  - Distributed tracing is configured (XRay)

Scenario: Non POST requests are not forwarded
  Given a proxy GET request that was made downstream
  When the request is logged onto S3
  Then the proxy should not forward the request to the http service

Scenario: Client host header should not be forwarded to http service
  Given a proxy POST request that was made downstream
  When the request is logged onto S3
  Then the proxy should forward the request to the http service
  But the host header should not be directly copied across

Scenario: Client request params, headers, body are forwarded on same path to the http service
  Given a proxy POST request that was made downstream with specific headers, query, body and path
  When the request is logged onto S3
  Then the proxy should forward the request to the http service on the same path
  And the request should have the same query params
  And the request should have the same headers params
  And the request should have the same body params
