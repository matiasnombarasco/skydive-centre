'use strict';

var pilotService = angular.module('pilotService', ['ngResource']);

pilotService.factory('Pilot', ['$resource',
    function($resource) {
        //here he hit to the endpoint, in this case we will get the whole list, without filtering, so no need
        //to pass paramters or some extra info in the request
        return $resource('endpoints/api/id', { id: '@id' });

    }]);