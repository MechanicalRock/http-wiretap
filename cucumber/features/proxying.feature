Feature: Load Balancer to proxy Adapter HTTP requests

In order to tee traffic between existing services without side effects
As a developer
I want to proxy traffic

Rules:
 - All requests are proxied downstream, with responses returned to the client
 - The proxy has a configurable timeout
 - Responses should be < timeout + 10%
 - Distributed tracing is configured (XRay)
 - No modification of response bodies - if they contain absolute URLs, it's not our problem
 - Downstream service is configured as a URL


@complete
Scenario Outline: Responses are returned from downstream
  Given the downstream service shall return <return_code>
  When the client sends <http_method> a request to the proxy
  Then the proxy return code should be <return_code>

  Examples:

  | http_method | return_code |
  | GET         | 200         |
  | POST        | 201         |
  | GET         | 404         |
  | POST        | 500         |

@dev
Scenario: The downstream service fails to respond
  Given the downstream service shall not respond
  And the proxy timeout is configured to 1 second
  When the client send a request to the proxy
  Then the proxy return code should be 502
  And the proxy should return within 1.1 seconds

Scenario: Transparent proxying of requests downstream
  When the client send a request to the proxy
  Then the request body should be received by the downstream service
  And the request headers should be received by the downstream service
  And the request parameters should be received by the downstream service
  And the request path should be received by the downstream service

Scenario: Proxying downstream path URL
  Given the downstream service URL is configured as "http://foo.example.com/mypath/"
  When the request path "/foo/bar/baz?something=awesome" is sent to the proxy
  Then the downstream service should receive the path "/mypath/foo/bar/baz?something=awesome"

Scenario: Response bodies are returned upstream
  Given the downstream service shall respond with a response body
  When the client sends a request to the proxy
  Then the client should receive the response body from the downstream service
  And the client should receive the response headers from the downstream service
