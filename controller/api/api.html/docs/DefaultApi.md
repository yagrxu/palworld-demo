# OpenapiClient::DefaultApi

All URIs are relative to *http://localhost*

| Method | HTTP request | Description |
| ------ | ------------ | ----------- |
| [**servers_get**](DefaultApi.md#servers_get) | **GET** /servers | Returns a list of current running servers. |
| [**servers_post**](DefaultApi.md#servers_post) | **POST** /servers | bootstrap a new server to host players |
| [**servers_server_id_delete**](DefaultApi.md#servers_server_id_delete) | **DELETE** /servers/{server-id} | bootstrap a new server to host players |
| [**servers_server_id_get**](DefaultApi.md#servers_server_id_get) | **GET** /servers/{server-id} | Returns a running server with ID. |
| [**servers_server_id_post**](DefaultApi.md#servers_server_id_post) | **POST** /servers/{server-id} | actions towards running server |


## servers_get

> <Array<Server>> servers_get

Returns a list of current running servers.

N/A

### Examples

```ruby
require 'time'
require 'openapi_client'

api_instance = OpenapiClient::DefaultApi.new

begin
  # Returns a list of current running servers.
  result = api_instance.servers_get
  p result
rescue OpenapiClient::ApiError => e
  puts "Error when calling DefaultApi->servers_get: #{e}"
end
```

#### Using the servers_get_with_http_info variant

This returns an Array which contains the response data, status code and headers.

> <Array(<Array<Server>>, Integer, Hash)> servers_get_with_http_info

```ruby
begin
  # Returns a list of current running servers.
  data, status_code, headers = api_instance.servers_get_with_http_info
  p status_code # => 2xx
  p headers # => { ... }
  p data # => <Array<Server>>
rescue OpenapiClient::ApiError => e
  puts "Error when calling DefaultApi->servers_get_with_http_info: #{e}"
end
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**Array&lt;Server&gt;**](Server.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json


## servers_post

> <Server> servers_post(servers_post_request)

bootstrap a new server to host players

N/A

### Examples

```ruby
require 'time'
require 'openapi_client'

api_instance = OpenapiClient::DefaultApi.new
servers_post_request = OpenapiClient::ServersPostRequest.new({name: 'name_example'}) # ServersPostRequest | 

begin
  # bootstrap a new server to host players
  result = api_instance.servers_post(servers_post_request)
  p result
rescue OpenapiClient::ApiError => e
  puts "Error when calling DefaultApi->servers_post: #{e}"
end
```

#### Using the servers_post_with_http_info variant

This returns an Array which contains the response data, status code and headers.

> <Array(<Server>, Integer, Hash)> servers_post_with_http_info(servers_post_request)

```ruby
begin
  # bootstrap a new server to host players
  data, status_code, headers = api_instance.servers_post_with_http_info(servers_post_request)
  p status_code # => 2xx
  p headers # => { ... }
  p data # => <Server>
rescue OpenapiClient::ApiError => e
  puts "Error when calling DefaultApi->servers_post_with_http_info: #{e}"
end
```

### Parameters

| Name | Type | Description | Notes |
| ---- | ---- | ----------- | ----- |
| **servers_post_request** | [**ServersPostRequest**](ServersPostRequest.md) |  |  |

### Return type

[**Server**](Server.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json


## servers_server_id_delete

> <Server> servers_server_id_delete(server_id)

bootstrap a new server to host players

N/A

### Examples

```ruby
require 'time'
require 'openapi_client'

api_instance = OpenapiClient::DefaultApi.new
server_id = 'server_id_example' # String | The server id

begin
  # bootstrap a new server to host players
  result = api_instance.servers_server_id_delete(server_id)
  p result
rescue OpenapiClient::ApiError => e
  puts "Error when calling DefaultApi->servers_server_id_delete: #{e}"
end
```

#### Using the servers_server_id_delete_with_http_info variant

This returns an Array which contains the response data, status code and headers.

> <Array(<Server>, Integer, Hash)> servers_server_id_delete_with_http_info(server_id)

```ruby
begin
  # bootstrap a new server to host players
  data, status_code, headers = api_instance.servers_server_id_delete_with_http_info(server_id)
  p status_code # => 2xx
  p headers # => { ... }
  p data # => <Server>
rescue OpenapiClient::ApiError => e
  puts "Error when calling DefaultApi->servers_server_id_delete_with_http_info: #{e}"
end
```

### Parameters

| Name | Type | Description | Notes |
| ---- | ---- | ----------- | ----- |
| **server_id** | **String** | The server id |  |

### Return type

[**Server**](Server.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json


## servers_server_id_get

> <Server> servers_server_id_get(server_id)

Returns a running server with ID.

N/A

### Examples

```ruby
require 'time'
require 'openapi_client'

api_instance = OpenapiClient::DefaultApi.new
server_id = 'server_id_example' # String | The server id

begin
  # Returns a running server with ID.
  result = api_instance.servers_server_id_get(server_id)
  p result
rescue OpenapiClient::ApiError => e
  puts "Error when calling DefaultApi->servers_server_id_get: #{e}"
end
```

#### Using the servers_server_id_get_with_http_info variant

This returns an Array which contains the response data, status code and headers.

> <Array(<Server>, Integer, Hash)> servers_server_id_get_with_http_info(server_id)

```ruby
begin
  # Returns a running server with ID.
  data, status_code, headers = api_instance.servers_server_id_get_with_http_info(server_id)
  p status_code # => 2xx
  p headers # => { ... }
  p data # => <Server>
rescue OpenapiClient::ApiError => e
  puts "Error when calling DefaultApi->servers_server_id_get_with_http_info: #{e}"
end
```

### Parameters

| Name | Type | Description | Notes |
| ---- | ---- | ----------- | ----- |
| **server_id** | **String** | The server id |  |

### Return type

[**Server**](Server.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json


## servers_server_id_post

> servers_server_id_post(server_id, servers_server_id_post_request)

actions towards running server

N/A

### Examples

```ruby
require 'time'
require 'openapi_client'

api_instance = OpenapiClient::DefaultApi.new
server_id = 'server_id_example' # String | The server id
servers_server_id_post_request = OpenapiClient::ServersServerIdPostRequest.new # ServersServerIdPostRequest | 

begin
  # actions towards running server
  api_instance.servers_server_id_post(server_id, servers_server_id_post_request)
rescue OpenapiClient::ApiError => e
  puts "Error when calling DefaultApi->servers_server_id_post: #{e}"
end
```

#### Using the servers_server_id_post_with_http_info variant

This returns an Array which contains the response data (`nil` in this case), status code and headers.

> <Array(nil, Integer, Hash)> servers_server_id_post_with_http_info(server_id, servers_server_id_post_request)

```ruby
begin
  # actions towards running server
  data, status_code, headers = api_instance.servers_server_id_post_with_http_info(server_id, servers_server_id_post_request)
  p status_code # => 2xx
  p headers # => { ... }
  p data # => nil
rescue OpenapiClient::ApiError => e
  puts "Error when calling DefaultApi->servers_server_id_post_with_http_info: #{e}"
end
```

### Parameters

| Name | Type | Description | Notes |
| ---- | ---- | ----------- | ----- |
| **server_id** | **String** | The server id |  |
| **servers_server_id_post_request** | [**ServersServerIdPostRequest**](ServersServerIdPostRequest.md) |  |  |

### Return type

nil (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: Not defined

