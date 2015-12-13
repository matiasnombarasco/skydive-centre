'use strict';

/* Directives */


/* Controllers */

tandemApp.controller('BookingCtrl', ['$scope', 'BookResource', '$uibModal', '$filter', 'BooksGroupsResource', '$http',
    function($scope, BookResource, $uibModal, $filter, BooksGroupsResource, $http) {

        $scope.groupid = makeid();
        $scope.groupidview=false;
        $scope.groupiddisabled = false;
        $scope.invalidGroupID = false;


        $scope.selectFila = function(row)
        {
          $scope.selectedrow = row;
        };

        $scope.showgroupid = function () {
            $scope.groupidview = true;
        }

        function makeid()
        {
            var mid = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

            for( var i=0; i < 5; i++ )
                mid += possible.charAt(Math.floor(Math.random() * possible.length));
            return mid;
        };


        $scope.open = function (book) {
            var bookcopy = angular.copy(book);
            var modalInstance = $uibModal.open({
                templateUrl: 'bookingEdit.html',
                controller: 'bookingEditCtrl',
                resolve: {
                    item: function () {
                        return book;
                    }
                }
            }).result.then(function (item) {
                if ( typeof(book) === "object" ) // update
                {
                    var index = $scope.Books.indexOf(book);
                    $scope.Books.splice(index,1,item);
                }
                else // add new
                {
                    $scope.Books.push(item);
                }
            });
        };

        $scope.bookdelete = function () {
            var index = $scope.Books.indexOf(this.book);

            // remove from database;
            if (typeof this.book === "object" && this.book.id > 0) {
                this.book.$remove();
            }

            $scope.Books.splice(index, 1);

            return false;
        };

        $scope.Books = [];
        //$scope.Books = BookResource.query({makeid : $scope.groupid});


        $scope.refreshGroup = function () {
            if ($scope.groupid.length == 5) {
                $scope.groupid = $scope.groupid.toUpperCase();
                BookResource.query({groupid: $scope.groupid}).$promise.then(function (resultBooks) {
                    $scope.Books = resultBooks;
                    if (resultBooks.length == 0) {
                        $scope.groupid = makeid();
                        $scope.invalidGroupID = true;
                    }
                    else {
                        BooksGroupsResource.query({groupid: $scope.groupid}).$promise.then(function(resultBooksGroups) {
                            if (resultBooksGroups.length > 0) {
                                $scope.dt = resultBooksGroups[0].bookdate;
                            }
                        });
                    }
                });

            }
            else {
                $scope.Books = [];
            };
        };

        $scope.saveBooking = function() {
            // Waivers
            var modalInstance = $uibModal.open({
                templateUrl: 'waivers.html',
                controller: 'termsCtrl',
                resolve: {
                    item: function () {
                    }
                }
            }).result.then(function (item) {
                    // Save DB
                    $scope.Books[0].groupid = $scope.groupid;
                    $scope.Books[0].bookdate = $filter('date')($scope.dt, "yyyy/MM/dd");
                    $http.post('http://127.0.0.1/BookingAngular/endpoints/newBooking.php', $scope.Books);

                });


        };


        /////////////////////////////////////////
        // Date Picker
        $scope.disabled = function (date, mode) {
            //return ( mode === 'day' && !( date.getDay() === 0 || date.getDay() === 6  ) );
        };

        $scope.toggleMin = function () {
            $scope.minDate = $scope.minDate ? null : new Date();
            $scope.minDate.setDate($scope.minDate.getDate() +1 );
        };

        $scope.toggleMin();
        //$scope.maxDate = new Date(2020, 5, 22);
        $scope.maxDate = new Date(new Date().setMonth(new Date().getMonth()+2));

        $scope.opencalendar = function ($event) {
            $scope.status.opened = true;
        };

        $scope.setDate = function (year, month, day) {
            $scope.dt = new Date(year, month, day);
        };

        $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
        };

        $scope.status = {
            opened: true
        };
        // Date Picker End
        ////////////////////////////////////////


        $scope.selectFila = function(row)
        {
            $scope.selectedrow = row;
        };

        $scope.payments = [{ id: 1, name: 'Efectivo' }, { id: 2, name: 'Tarjeta de Credito' }];

        $scope.sendToManifest = function (book) {
            var bookcopy = angular.copy(book);
            var modalInstance = $uibModal.open({
                templateUrl: 'sendToManifest.html',
                controller: 'bookingEditCtrl',
                //windowClass: 'app-modal-sentToManifest',
                resolve: {
                    item: function () {
                        return book;
                    }
                }
            }).result.then(function (item) {
                    if ( typeof(book) === "object" ) // update
                    {
                        var index = $scope.Books.indexOf(book);
                        $scope.Books.splice(index,1,item);
                    }
                    else // add new
                    {
                        $scope.Books.push(item);
                    }
                });
        };



        $scope.updateBookList =  function ()
        {
            $scope.Books = BookResource.query({date:($filter('date')($scope.dt, "yyyy/MM/dd"))});
        }
    }
]);

tandemApp.controller('bookingEditCtrl', function ($scope, $modalInstance, item) {


    if ( item == 0 )
    {
        $scope.first = true;
    }

    if (typeof item === "object") {
        $scope.book = angular.copy(item);
        var dobdate = new Date(item.dob);
        delete $scope.book.dob;
        $scope.book.dob = [];
        //$scope.book.dob.day = ( (dobdate.getDate().length < 2) ? '0' + dobdate.getDate() : dobdate.getDate() );
        //$scope.book.dob.month = ( (dobdate.getMonth().length < 2) ? '0' + (dobdate.getMonth() + 1) : dobdate.getMonth() + 1 );
        //$scope.book.dob.year = dobdate.getFullYear();
    }

    $scope.cancel = function () {
        $modalInstance.dismiss('Close');
    };

    $scope.saveBook = function() {
        $modalInstance.close($scope.book);
    };

// Select Date

    $scope.days = function() {

            var daysList = [];
            for( var i = 1; i <= 31 ; i++){
                var iS = i.toString();
                daysList.push( (iS.length < 2) ? '0' + iS : iS ); // Adds a leading 0 if single digit
            }
            return daysList;
        };
    $scope.months = function() {
            var monthList = [];
            for( var i = 1; i <= 12 ; i++){
                var iS = i.toString();
                monthList.push( (iS.length < 2) ? '0' + iS : iS ); // Adds a leading 0 if single digit
            }
            return monthList;
        };

    $scope.years = function() {
            var yearsList = [];
            for( var i = 2000; i >= 1940 ; i--){
                yearsList.push( i.toString() );
            }
            return yearsList;
        };

// End Select Date

});


tandemApp.controller('termsCtrl', function ($scope, $modalInstance, item) {
    $scope.cancel = function () {
        $modalInstance.dismiss('Close');
    };

    $scope.acceptTerms = function() {
        $modalInstance.close(item);
    };
});


tandemApp.controller('QuickReceptionCtrl', ['$scope', 'BookResource', '$uibModal', '$filter', 'BooksGroupsResource',
    function($scope, BookResource, $uibModal, $filter, BooksGroupsResource) {


    }]);
