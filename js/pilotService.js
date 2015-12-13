'use strict';

var bookingService = angular.module('bookingService', ['ngResource']);

bookingService.factory('BookResource', ['$resource',
    function($resource) {
        return $resource('endpoints/bookings/id', { id: '@id' });
    }]);

bookingService.factory('BooksGroupsResource', ['$resource',
    function($resource) {
        return $resource('endpoints/booksgroups/groupid', { groupid: '@groupid' });
    }]);
