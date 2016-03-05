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

bookingService.factory('BooksGroupsResource', ['$resource',
    function($resource) {
        return $resource('endpoints/booksgroups/groupid', { groupid: '@groupid' });
    }]);

bookingService.factory('ManifestShowResource', ['$resource',
    function($resource) {
        return $resource('endpoints/showmanifest/date', { date: '@date' });
    }]);


bookingService.factory('staffStatusResource', ['$resource',
    function($resource) {
        return $resource('endpoints/staffstatus/staff', { staff: '@staff' });
    }]);
