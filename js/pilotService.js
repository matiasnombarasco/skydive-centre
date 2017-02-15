'use strict';

var bookingService = angular.module('bookingService', ['ngResource']);

bookingService.factory('BookResource', ['$resource',
    function($resource) {
        return $resource('endpoints/bookings.php', { id: '@id' });
    }]);

bookingService.factory('BooksGroupsResource', ['$resource',
    function($resource) {
        return $resource('endpoints/booksgroups.php', { groupid: '@groupid' });
    }]);

bookingService.factory('ManifestShowResource', ['$resource',
    function($resource) {
        return $resource('endpoints/showmanifest.php', { date: '@date' });
    }]);

bookingService.factory('staffStatusResource', ['$resource',
    function($resource) {
        return $resource('/endpoints/staffstatus.php', { staff: '@staff' });
    }]);
