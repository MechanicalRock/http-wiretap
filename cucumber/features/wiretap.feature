Feature: Load Balancer to proxy HTTP request

Scenario: Post proxy is successfully sent
Given we have an MVP proxy
And a http post request body
When we post the request to the MVP proxy endpoint successfully
Then the return code will be 201

Scenario: Post proxy fails
Given we have an MVP proxy
And a http post request body
When we post the request to the MVP proxy endpoint unsuccessfully
Then the return code will be 500

Scenario: Get proxy succeeds
Given we have an MVP proxy
And a http post request body
When we post the request to the MVP proxy endpoint successfully
And Then get the request with the same identifier
Then the return code will be 200
And the content returned should match the content posted

Scenario: Delete proxy succeeds
Given we have an MVP proxy
And a http post request body
When we post the request to the MVP proxy endpoint successfully
And Then delete the resource with the same identifier
Then a get request for a resource with same identifier should give return code 404
