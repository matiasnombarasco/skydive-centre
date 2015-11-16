'use strict';

var bookingService = angular.module('bookingService', ['ngResource']);

bookingService.factory('BookResource', ['$resource',
    function($resource) {
        return $resource('endpoints/bookings/id', { id: '@id' });
    }]);

bookingService.factory('BooksGroupsResource', ['$resource',
    function($resource) {
        //here he hit to the endpoint, in this case we will get the whole list, without filtering, so no need
        //to pass paramters or some extra info in the request
        return $resource('endpoints/booksgroup/groupid', { groupid: '@groupid' });
    }]);
