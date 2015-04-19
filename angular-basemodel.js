angular.module('BaseModel', [])
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
		};

		this.currentPromise = function(d) {
			if (!d) {

				return currentDeferred.promise;
			}

			current = d;

			currentDeferred.resolve(current);

			return this;
		};

		this.current = function(d) {
			if (!d) {

				return current;
			} else {
				current = d;

				this.currentPromise(d);

				return this;
			}
		};

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

		var swto = [];

		this.throttle = function(fn, time, namespace) {
			namespace = namespace || 'global';

			if (!swto[namespace])
				swto.push(namespace);

	    $timeout.cancel(swto[namespace]);

	    //var deferred = $q.defer();

	    swto[namespace] = $timeout(function() {
	    	fn.call($this);
	    }, time || 1000);

	    return this;
		};

		this.getOf = function(resource, value, query) {

			query = _.defaults(query, $this.$query);

			var config = {
				params: query
			};

			var deferred = $q.defer();

			if (_.isFunction($this.$before.$read)) {
				var response = $this.$before.$read.call($this);

				if (response) {
					deferred.reject(response);
					return deferred.promise;
				}
			}

			return $http.get(url(resource, value), config)
				.success(function(d) {
					// after `read` we dispatch our events
					$this.$after.$read.call($this, d);

					if (_.isArray(d))
						$this[$this.$resource](d);
					else
						$this.current(d);
				});
		};

		this.getBy = function(field, value, query) {
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
					return deferred.promise;
				}
			}

			var u = field ? url(field, value) : ((value == undefined) ? url() : url(value));

			return $http.get(u, config)
				.success(function(d) {
					// after `read` we dispatch our events
					$this.$after.$read.call($this, d);

					if (_.isArray(d)) {
						$this[$this.$resource](d);
					} else {
						$this.current(d);

						var k = _.findIndex($data, {_id: d._id});

						if (k > -1)
							$data[k] = d;
						else
							$data.push(d);
					}
				});
		};

		this.get = function(id, query) {
			return this.getBy(undefined, id, query);
		};

		this.getSet = function(id, resource, setId) {
			var deferred = $q.defer();

			var res = _.find(current[resource], {_id: setId});

			if (res) {
				deferred.resolve(res);
			} else {
				$http.get( url(id, resource, setId) ).success(function(d){
					deferred.resolve(d);
				});
			}

			return deferred.promise;
		};

		this.addSet = function(id, resource, data) {
			// @TODO	validation

			var deferred = $q.defer();

			if (_.isFunction($this.$before.$create)) {
				var response = $this.$before.$create.call($this, data, resource);
				
				if (response) {
					deferred.reject(response);
					return deferred.promise;
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
						$data[i][resource].push(d);

						//current[resource].push(d);
					}
				});
		};

		this.addResource = this.addSet;

		this.updateSet = function(id, resource, resId, data) {
			// @TODO	validation

			var deferred = $q.defer();

			if (_.isFunction($this.$before.$update)) {
				var response = $this.$before.$update.call($this, data, resource, resId);
				
				if (response) {
					deferred.reject(response);
					return deferred.promise;
				}
			}

			return $http.put(url(id, resource, resId), data)
				.success(function(d) {
					// after `update` we dispatch our events
					$this.$after.$update.call($this, d, resource, resId);

					var g = {};
					g[$this.$primaryKey] = id;

					var i = _($data).findIndex(g);

					if (i > -1) {
						var r = {};
						r[$this.$primaryKey] = resId;
						var k = _($data[i][resource]).findIndex(r);

						if (k > -1 )
							$data[i][resource][k] = d;
					}
				});
		};

		this.deleteSet = function(id, resource, resId) {
			// @TODO	validation

			var deferred = $q.defer();

			if (_.isFunction($this.$before.$delete)) {
				var response = $this.$before.$delete.call($this, resource, resId);
				
				if (response) {
					deferred.reject(response);
					return deferred.promise;
				}
			}

			if (_.isArray(resId)) {
				resId = resId.join(',');
			}


			// TODO  Confirm the action, this will erase 'x' data from 'a'..

			return $http.delete(url(id, resource, resId))
				.success(function(d) {
					// after `delete` we dispatch our events
					$this.$after.$delete.call($this, d, resource, resId);

					var g = {};
					g[$this.$primaryKey] = id;

					var i = _($data).findIndex(g);

					if (i > -1) {
						var r = {};

						if (_.isArray(resId)) {
							_.each(resId, function(_rid) {
								r[$this.$primaryKey] = _rid;
								var k = _($data[i][resource]).findIndex(r);

								if (k > -1) {
									$data[i][resource].splice(k, 1);
								}
							});

						} else {
							r[$this.$primaryKey] = resId;
							var k = _($data[i][resource]).findIndex(r);
							
							if (k > -1) {
								$data[i][resource].splice(k, 1);
							}
						}

						// $data[i] = d;
						// $this.current($data[i]);
					}
				});
		};

		this.updateResource = this.updateSet;

		this.create = function(data) {
			// @TODO	validation

			var deferred = $q.defer();

			if (_.isFunction($this.$before.$create)) {
				var response = $this.$before.$create.call($this, data, false);
				
				if (response) {
					deferred.reject(response);
					return deferred.promise;
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
				var response = $this.$before.$update.call($this, data, false);
				
				if (response) {
					deferred.reject(response);
					return deferred.promise;
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
				return deferred.promise;
			}

			if (_.isFunction($this.$before.$delete)) {
				var response = $this.$before.$delete.call($this, id);
				
				if (response) {
					deferred.reject(response);
					return deferred.promise;
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

		o = _.defaults(o, {
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
		});

		BaseModel.prototype = o;

		return new BaseModel();
	};

}]);