# Angular BaseModel

Angular base service for a REST server comunication.

## Installation

Download the file and add the script tag to your html.

```html
<script src="/path/basemodel.js" type="text/javascript" ></script>
```


And just add the module `BaseModel` as a dependency.
```javascript
angular.module('myApp', ['BaseModel']);
```

## Dependencies

- [Angular.js ~v1.1.5](https://github.com/angular/angular.js)
- [Lodash ~v2.4.1](https://github.com/lodash/lodash)

## Usage

 Just create a new factory, and return the instance of the BaseModel based on your resource.

```javascript
angular.module('myApp')
.factory('UserService',  ['BaseModel', function(BaseModel) {
	"use strict";

	var config = {
		$name: "Users",
		$resource: "user",
		$primaryKey: "id",
		$fields: ['name', 'email', 'login'],
		$baseUrl: 'http://api.myapp.com/',
		$query: {
			limit: 20,
			sort: this.$primaryKey
		},

		// For extending methods and variables, just add anything
		// this is a extended method that can be access
		thumbnail: function() {
			var width = 154, height = 154;

			var thumbnail = "my picture";

			return thumbnail;
		}
	};

	return BaseModel.instance(config);
}]);
```

All extended methods will be assigned to the `UserService` (service name) instance.

### Methods

#### BaseModel.get
```javascript
MyService.get(id [, query]);
```
**Returns** a promise with the returned value from the server as a parameter.
The value as well is added to an internal variable, and can be access any time with `MyService.current()` method.

#### BaseModel.create
```javascript
MyService.create(data);
```
**Returns** a promise with the returned value from the server as a parameter.
The value as well is added to an internal variable, and can be access any time with `MyService.current()` method.

#### BaseModel.save
```javascript
MyService.save(id, data);
```
**Returns** a promise with the returned value from the server as a parameter.
The new value as well is added to an internal variable, and can be access any time with `MyService.current()` method.

#### BaseModel.delete
```javascript
MyService.save(id);
```
**Returns** a promise with the returned value from the server as a parameter, and remove the value from the internl variable. The current method now returns an empty object `{}`.

#### BaseModel.addSet
```javascript
MyService.addSet(id, resource, data);
```
Adds a new subdocument `resource` with the content of `data` for the document `id`.

**Returns** a promise with the returned value from the server as a parameter.
The new value as well is added to the internal variable updating modified document.

#### BaseModel[$resource]
This method can be access using the resource name defined in the configuration by `$resource`.
The method is a setter/getter:
```javascript
UserService.users([Array data]);
```
If a parameter is passed, `set` the internal variable to this new passed (the variable muts be an Array) returning the `this` arg (the service instance).
If not, `get` the internal value.

**`WARNING`**
If you assign a variable to the `BaseModel.users()` (e.g).
Every new request will automatically update the variable.
Consider the example bellow, the `$scope.users` will be automatically update.
Be carefull with multi service initialization, because the service is a singleton, any changes in a controller will propagate to others controllers.

*Example:*
```javascript
angular.module('myApp')
.controller('MyController', ['$scope', 'UserService', function($scope, UserService) {

	$scope.users = UserService.users();
	console.log($scope.users);
	// -> [];

	UserService.get().then(function() {
		console.log($scope.users);
		// -> [{id:1, name: "Jane"}, ..., {...}];
	});
}]);
```


### Configuration

The default config object, all this values can be overwritten:

```javascript
var config = {
	$name: "Users",
	$resource: "users",
	$primaryKey: "_id",
	$allowSingular: false,
	$fields: [],
	$baseUrl: "",
	$query: {
		limit: 20,
		sort: this.$primaryKey
	},
	$hasMany: {
		records: {}
	},
	$belongsTo: {
		author: {name: 'users', type: String, resource: 'UsersService'}
	},
	$validation: {
		$all: {
			_id: {required: true}
		},
		$read: {
		},
		$create: {
		},
		$update: {
		},
		$delete: {
		}
	},
	$after: {
		$read: function(){

		},
		$create:  function(data, resource){
			
		},
		$update:  function(){
			
		},
		$delete:  function(){
			
		}
	},
	$before: {
		$read: function(){

		},
		$create:  function(data, resource){
			
		},
		$update:  function(){
			
		},
		$delete:  function(){
			
		}
	},
	$responses: {
		invalidParams: "The parameter.."
	},
	$errorDesign: function(type, msg) {
		return {
			type: type,
			message: msg,
			code: null
		};
	}
};
```

This project was influenced by [ModelCore](https://github.com/klederson/ModelCore).
