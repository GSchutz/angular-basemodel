export var BaseModel = angular.module('BaseModel', [])
.service('BaseModel',  ["$q", '$http', '$location', '$timeout', function($q, $http, $location, $timeout) {
	"use strict";

	function BaseModel() {

		var $this = this;

		var collection = $this.$resource;

		var current;
		var currentDeferred = $q.defer();

		var $data = [];

		this[$this.$resource] = function(_data) {
			if (!_data)
				return $data;

			$data = _data;

			return this;
		}

		this.current = function(d) {
			if (!d) {

				return currentDeferred.promisse;
			}

			current = d;

			currentDeferred.resolve(current);

			return this;
		}

		/**
		 * Short method for construct the base URL. If needed for another resource, use: url([1, 'records'], 'collection'));
		 *
		 * @method   url
		 *
		 * @memberOf MapsService
		 *
		 * @return   {string} The URL containing all the arguments passed.
		 */
		function url(params, withCollection) {
			var args;

			if (_.isArray(params)) {
				args = _.toArray(params);
			} else {
				args = _.toArray(arguments);
				withCollection = collection;	
			}

			return [$this.$baseUrl, withCollection].concat(args).join('/');
		}

		/**
		 * Even validation normally are defined at the template level (principal
		 * with angular), the main idea here is to give a centralized, widely
		 * accepted way of validate data.
		 *
		 * @method   validate
		 *
		 * @memberOf BaseModel
		 *
		 * @param    {string|object} rules The specified rules for validation the `data`
		 * @param    {object|array} data  The `data` to be validated.
		 *
		 * @return   {object|array}       A validation constructor?.
		 */
		function validate(rules, data) {

		}

		this.get = function(id, query) {
			if (_.isPlainObject(id)) {
				query = id;

				id = undefined;

				if (!_.isEmpty(current))
					id = current[$this.$primaryKey];
			}

			query = _.defaults(query, $this.$query);

			var config = {
				params: query
			};

			// @TODO	validation

			var deferred = $q.defer();

			if (_.isFunction($this.$before.$read)) {
				var response = $this.$before.$read.call($this);

				if (response) {
					deferred.reject(response);
					return deferred.promisse;
				}
			}

			return $http.get(url(id || ''), config)
				.success(function(d) {
					// after `read` we dispatch our events
					$this.$after.$read.call($this, d);

					if (_.isArray(d))
						$this[$this.$resource](d);
					else
						$this.current(d);
				});
		};

		this.addSet = function(id, resource, data) {
			// @TODO	validation

			var deferred = $q.defer();

			if (_.isFunction($this.$before.$create)) {
				var response = $this.$before.$create.call($this, data, resource);
				
				if (response) {
					deferred.reject(response);
					return deferred.promisse;
				}
			}

			return $http.post(url(id, resource), data)
				.success(function(d) {
					// after `create` we dispatch our events
					$this.$after.$create.call($this, d, resource);

					var g = {};
					g[$this.$primaryKey] = id;

					var i = _($data).findIndex(g);

					if (i > -1) {
						$data[i] = d;
						$this.current($data[i]);
					}
				});
		}

		this.create = function(data) {
			// @TODO	validation

			var deferred = $q.defer();

			if (_.isFunction($this.$before.$create)) {
				var response = $this.$before.$create.call($this, data, false);
				
				if (response) {
					deferred.reject(response);
					return deferred.promisse;
				}
			}

			return $http.post(url(), data)
				.success(function(d){
					// after `create` we dispatch our events
					$this.$after.$create.call($this, d, false);

					if (_.isArray(d)) {
						$data.concat(d);
					} else {
						$data.push(d);
						$this.current(d);
					}
				});
		};

		this.save = function(id, data) {
			var deferred = $q.defer();

			if (_.isPlainObject(id)) {
				data = id;

				if (!_.isEmpty(current))
					id = current[$this.$primaryKey];
				else
					deferred.reject(new TypeError("Expected two params for method 'save'."));
			}

			if (_.isFunction($this.$before.$update)) {
				var response = $this.$before.$update.call($this, data, resource);
				
				if (response) {
					deferred.reject(response);
					return deferred.promisse;
				}
			}

			return $http.put(url(id), data)
				.success(function(d) {
					// after `update` we dispatch our events
					$this.$after.$update.call($this, d, false);

					// remove the item from the $data data
					var g = {};
					g[$this.$primaryKey] = id;

					var i = _($data).findIndex(g);
					if (i > -1) {
						$data[i] = d;
						$this.current($data[i]);
					}
				});
		};

		this.delete = function(id) {
			var deferred = $q.defer();

			if (!id) {
				deferred.reject(new TypeError("Expected one params for method 'delete'."));
				return deferred.promisse;
			}

			if (_.isFunction($this.$before.$delete)) {
				var response = $this.$before.$delete.call($this, id);
				
				if (response) {
					deferred.reject(response);
					return deferred.promisse;
				}
			}

			return $http.delete(url(id))
				.success(function(d) {
					// after `update` we dispatch our events
					$this.$after.$delete.call($this, d);

					// remove the item from the $data data
					var g = {};
					g[$this.$primaryKey] = id;

					var i = _($data).findIndex(g);
					if (i > -1) {
						$data.splice(i, 1);
						$this.current({});
					}
				});
		};
	}

	this.instance = function(o) {

		var o = _.defaults(o, {
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
				}
			}
		});

		BaseModel.prototype = o;

		return new BaseModel();
	}

}]);