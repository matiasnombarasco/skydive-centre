'use strict';

/* Directives */


/* Controllers */

tandemApp.controller('SystemCtrl', ['$scope', 'BookResource', '$uibModal', '$filter', 'BooksGroupsResource', '$http', '$location', '$routeParams', 'ManifestShowResource', '$interval',
    function($scope, BookResource, $uibModal, $filter, BooksGroupsResource, $http, $location, $routeParams, ManifestShowResource, $interval) {

        $scope.onUpdate = false;

        if (localStorage.getItem('username') == null) {
            $location.path('login');
            return;
        }

        ManifestShowResource.query().$promise.then(function (result) {
            $scope.manifestLoads = result;
        },  function(error) {
            $scope.manifestLoads = [];

        });

        $scope.intervalManifestShow = false;
        $scope.intervalManifest = false;

        $interval(function(){
            if (!$scope.intervalManifestShow) {
                $scope.intervalManifestShow = true;
                ManifestShowResource.query().$promise.then(function (result) {
                    $scope.manifestLoads = result;
                    $scope.intervalManifestShow = false;
                }, function (error) {
                    console.log(error);
                    $scope.intervalManifestShow = false;
                });

            }
            // AutoUpdate Book list

            if ((!$scope.onUpdate) && (!$scope.intervalManifest)) {

                var queryday = '';
                if ($scope.biggerthandatelocal) {
                    queryday = '>'
                };

                queryday += ($filter('date')($scope.dtdate, "yyyy/MM/dd"));
                if (!(queryday == null)) {
                    $scope.intervalManifest = true;
                    BookResource.query({date: queryday}).$promise.then(function (result) {
                        $scope.Books = result;
                        $scope.intervalManifest = false;
                    }, function (error) {
                        $scope.Books = [];
                        $scope.intervalManifest = false;
                    });
                }
            }

        },3000);

        $scope.logoff = function() {
            localStorage.clear();
            $http.post('endpoints/logoff.php')
            $location.path('login');
        };


        $scope.refreshManifest = function () {

            //$scope.manifestLoads = ManifestShowResource.query();

            $scope.promise =
            ManifestShowResource.query().$promise.then(function (result) {
                $scope.manifestLoads = result;
                });

            localStorage.setItem('user', JSON.stringify({user: "saresca"}));
        };

        $scope.setLoadColor = function(loadnumber) {
            if (loadnumber % 2 == 0) {
                    return { "background-color": "ffcc66"}
                }
            else
                {
                    return { "background-color": "ffff99"}
                }
        };


        /*
        $http.get('endpoints/dateenabled.php', { cache: 'true'})
            .success(function(data) {
                $scope.date = data;
                $scope.date = $scope.date.replace("-","/").replace("-","/")
                $scope.toggleDates();
            });
        */

        // Select if new or edit
        $scope.groupid = $routeParams.groupid;
        if (typeof $scope.groupid === 'undefined') {
            $scope.groupid = makeid();
            $scope.groupidview=false;
            $scope.groupiddisabled = false;
            $scope.invalidGroupID = false;
            $scope.status = {opened: true};
            $scope.bookedit = false;

        }
        else
        {
            $scope.groupidview=true;
            refreshGroup();
            $scope.status = {opened: false};
            $scope.bookedit = true;

        }

        $scope.sendToManifest = function (book) {
            $scope.varindex = $scope.Books.indexOf(book);

            var bookcopy = angular.copy(book);
            bookcopy.dob = new Date(book.dob+"T18:00:00");

            var modalInstance = $uibModal.open({
                templateUrl: 'sendToManifest.html',
                controller: 'manifestEditCtrl',
                //windowClass: 'app-modal-sentToManifest',
                resolve: {
                    item: function () {
                        return bookcopy;
                    }
                }
            }).result.then(function (item) {
                    if (!angular.equals(bookcopy,item)) {
                        item.$save();
                    }

                    $scope.Books.splice($scope.varindex, 1);

                    $scope.onUpdate = true;
                    $http.post('endpoints/automanifest.php', item).success(function() {
                            $scope.onUpdate = false;
                        }
                    );

                    /*
                    if (typeof(book) === "object") // update
                    {
                        var index = $scope.Books.indexOf(book);
                        $scope.Books.splice(index, 1, item);
                    }
                    else // add new
                    {
                        $scope.Books.push(item);
                    }
                    */
                });
        };

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
            if (confirm('Desea eliminar el registro?')) {
                var index = $scope.Books.indexOf(this.book);

                // remove from database;
                if (typeof this.book === "object" && this.book.id > 0) {
                    this.book.$remove();
                }

                $scope.Books.splice(index, 1);

                return false;
            }
        };

        $scope.Books = [];
        //$scope.Books = BookResource.query({makeid : $scope.groupid});


        function refreshGroup() {
            if ($scope.groupid.length == 5) {
                $scope.groupid = $scope.groupid.toUpperCase();
                BookResource.query({groupid: $scope.groupid}).$promise.then(function (resultBooks) {
                    $scope.Books = resultBooks;
                    $scope.bookslengthorig = $scope.Books.length;
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
            var modalInstance;
            modalInstance = $uibModal.open({
                templateUrl: 'waivers.html',
                controller: 'termsCtrl',
                resolve: {
                    item: function () {
                    }
                }
            }).result.then(function (item) {
                    // Save DB
                    $scope.Books[0].groupid = $scope.groupid;
                    $scope.Books[0].bookdate = $filter('date')($scope.dtdate, "yyyy/MM/dd");
                    $scope.Books[0].bookedit = $scope.bookedit;
                    var bookslength = $scope.Books.length;
                    if ($scope.bookedit == true)
                    {
                        bookslength = bookslength - $scope.bookslengthorig;
                        if (bookslength <= 0)
                        {
                            bookslength = 0;
                        }
                    }

                        switch (bookslength) {
                            case 0:

                            case 1:
                                $scope.Books[0].paymenturl = 'http://mpago.la/K0Na';
                                break;
                            case 2:
                                $scope.Books[0].paymenturl = 'http://mpago.la/GdkH';
                                break;
                            case 3:
                                $scope.Books[0].paymenturl = 'http://mpago.la/SEa2';
                                break;
                            case 4:
                                $scope.Books[0].paymenturl = 'http://mpago.la/qlQr';
                                break;
                            case 5:
                                $scope.Books[0].paymenturl = 'http://mpago.la/ayyS';
                                break;
                            default:
                                $scope.Books[0].paymenturl = 'http://mpago.la/1eVD';
                        }
                    $http.post('endpoints/newBooking.php', $scope.Books);
                    $location.path('booksucess/' + bookslength);
                });


        };


        /////////////////////////////////////////
        // Date Picker
        $scope.disabled = function (date, mode) {
            return ( mode === 'day' && !( date.getDay() === 0 || date.getDay() === 6 ) );
            /*
            if ("6" in )
            {
                return true;
            }
            else
            {
                return true;
            }
            */


        };

        $scope.toggleDates = function () {
            $scope.minDate = new Date($scope.date);  //$scope.minDate ? null :
            $scope.minDate.setDate($scope.minDate.getDate() +1 );
            $scope.maxDate = new Date(new Date().setMonth(new Date().getMonth()+1));
        };

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


        // Date Picker End
        ////////////////////////////////////////


        $scope.selectFila = function(row)
        {
            $scope.selectedrow = row;
        };

        $scope.payments = [{ id: 1, name: 'Efectivo' }, { id: 2, name: 'Tarjeta de Credito' }];

        $scope.editTimePayment = function (book) {

            $scope.promise = BooksGroupsResource.query({groupid: book.groupid}).$promise.then(function(resultBooksGroups) {
                if (resultBooksGroups.length > 0) {
                    $scope.bookgroup = resultBooksGroups[0];
                    $scope.bookgroup.deposit = book.deposit;
                };
            var modalInstance = $uibModal.open({
                templateUrl: 'timepaymentEdit.html',
                controller: 'timepaymentEditCtrl',
                resolve: {
                    item: function () {
                        return $scope.bookgroup;
                    }
                }
            }).result.then(function () {
                    $scope.bookgroup.bookdate = $filter('date')($scope.bookgroup.bookdate, "yyyy/MM/dd");
                    $scope.bookgroup.$save();
                    book.deposit = $scope.bookgroup.deposit;
                    var bookcopy = angular.copy(book);
                    bookcopy.$save();
                    /*
                        .then(function() {
                            $scope.updateBookList();
                        });
                        */

                    $scope.Books.forEach(function(scopebook) {
                        if (scopebook.groupid == book.groupid) {
                            scopebook.schtime = $scope.bookgroup.schtime;
                            scopebook.notes = $scope.bookgroup.notes;
                            scopebook.pending = 1650 - $scope.bookgroup.deposit;
                            if (!(angular.isUndefined($scope.bookgroup.bookdate))) {
                                scopebook.bookdate = $scope.bookgroup.bookdate.replace("/","-").replace("/","-");
                            }
                        }
                    });


                });
            });
        };


        $scope.updateBookList =  function ()
        {
            $scope.dtdate = this.dt;
            var queryday = ''
            if (this.biggerthandate) {
                $scope.biggerthandatelocal = this.biggerthandate
                queryday = '>'
            }
            else
            {
                $scope.biggerthandatelocal = false;
            }
            queryday += ($filter('date')($scope.dtdate, "yyyy/MM/dd"));
            $scope.promise = BookResource.query({date:queryday}).$promise.then(function(result){
                $scope.Books = result;
            },  function(error) {
                console.log(error);
                $scope.Books = [];
                return false;
            });
        };
    }
]);

tandemApp.controller('BookingCtrl', ['$scope', 'BookResource', '$uibModal', '$filter', 'BooksGroupsResource', '$http', '$location', '$routeParams', 'ManifestShowResource', '$interval',
    function($scope, BookResource, $uibModal, $filter, BooksGroupsResource, $http, $location, $routeParams, ManifestShowResource, $interval) {


        $http.get('endpoints/date.php', { cache: 'true'})
            .success(function(data) {
                $scope.date = data;
                $scope.date = $scope.date.replace("-","/").replace("-","/")
                $scope.toggleDates();
            });

        // Select if new or edit
        $scope.groupid = $routeParams.groupid;
        if (typeof $scope.groupid === 'undefined') {
            $scope.groupid = makeid();
            $scope.groupidview=false;
            $scope.groupiddisabled = false;
            $scope.invalidGroupID = false;
            $scope.status = {opened: true};
            $scope.bookedit = false;

        }
        else
        {
            $scope.groupidview=true;
            refreshGroup();
            $scope.status = {opened: false};
            $scope.bookedit = true;

        }

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
            if (confirm('Desea eliminar el registro?')) {
                var index = $scope.Books.indexOf(this.book);

                // remove from database;
                if (typeof this.book === "object" && this.book.id > 0) {
                    this.book.$remove();
                }

                $scope.Books.splice(index, 1);

                return false;
            }
        };

        $scope.Books = [];

        function refreshGroup() {
            if ($scope.groupid.length == 5) {
                $scope.groupid = $scope.groupid.toUpperCase();
                BookResource.query({groupid: $scope.groupid}).$promise.then(function (resultBooks) {
                    $scope.Books = resultBooks;
                    $scope.bookslengthorig = $scope.Books.length;
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
            var modalInstance;
            modalInstance = $uibModal.open({
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
                    $scope.Books[0].bookedit = $scope.bookedit;
                    var bookslength = $scope.Books.length;
                    if ($scope.bookedit == true)
                    {
                        bookslength = bookslength - $scope.bookslengthorig;
                        if (bookslength <= 0)
                        {
                            bookslength = 0;
                        }
                    }

                    switch (bookslength) {
                        case 0:

                        case 1:
                            $scope.Books[0].paymenturl = 'http://mpago.la/K0Na';
                            break;
                        case 2:
                            $scope.Books[0].paymenturl = 'http://mpago.la/GdkH';
                            break;
                        case 3:
                            $scope.Books[0].paymenturl = 'http://mpago.la/SEa2';
                            break;
                        case 4:
                            $scope.Books[0].paymenturl = 'http://mpago.la/qlQr';
                            break;
                        case 5:
                            $scope.Books[0].paymenturl = 'http://mpago.la/ayyS';
                            break;
                        default:
                            $scope.Books[0].paymenturl = 'http://mpago.la/1eVD';
                    }
                    $http.post('endpoints/newBooking.php', $scope.Books);
                    $location.path('booksucess/' + bookslength);
                });


        };


        /////////////////////////////////////////
        // Date Picker
        $scope.disabled = function (date, mode) {
            return ( mode === 'day' && !( date.getDay() === 0 || date.getDay() === 6 || date.getDate() === 24 || date.getDate() === 25 ) );
            /*
             if ("6" in )
             {
             return true;
             }
             else
             {
             return true;
             }
             */


        };

        $scope.toggleDates = function () {
            $scope.minDate = new Date($scope.date);  //$scope.minDate ? null :
            $scope.minDate.setDate($scope.minDate.getDate() +1 );
            $scope.maxDate = new Date(new Date().setMonth(new Date().getMonth()+1));
        };

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


        // Date Picker End
        ////////////////////////////////////////

    }
]);


tandemApp.controller('bookingEditCtrl', function ($scope, $modalInstance, item) {

    if ( item == 0 )
    {
        $scope.first = true;
    }

    $scope.cancel = function () {
        $modalInstance.dismiss('Close');
    };

    $scope.saveBook = function() {
        $scope.book.dobdate = $scope.book.dobyear + "/" + $scope.book.dobmonth + "/" + $scope.book.dobday
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



tandemApp.controller('timepaymentEditCtrl', function ($scope, $modalInstance, item) {

    $scope.bookgroup = item;

    $scope.cancel = function () {
        $modalInstance.dismiss('Close');
    };

    $scope.saveBookGroup = function() {
        $modalInstance.close($scope.bookgroup);
    };

    /////////////////////////////////////////
    // Date Picker

    $scope.status = {opened: false};

    $scope.disabled = function (date, mode) {
        //return ( mode === 'day' && !( date.getDay() === 0 || date.getDay() === 6  ) );
    };

    $scope.toggleDates = function () {
        $scope.minDate = new Date($scope.date);  //$scope.minDate ? null :
        $scope.minDate.setDate($scope.minDate.getDate() +1 );
        $scope.maxDate = new Date(new Date().setMonth(new Date().getMonth()+1));
    };


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

    // Date Picker End
    ////////////////////////////////////////

    $scope.dt = $scope.bookgroup.bookdate;

});

tandemApp.controller('manifestEditCtrl', function ($scope, $modalInstance, item) {

    $scope.book = angular.copy(item);

    $scope.cancel = function () {
        $modalInstance.dismiss('Close');
    };

    $scope.saveBook = function() {
        $modalInstance.close($scope.book);
    };


});

tandemApp.controller('loginCtrl', function ($scope, $http, $location) {

    $scope.login = function() {
        var data = {
            username: $scope.username,
            password: $scope.password
            };
        $scope.promise =
        $http.post('endpoints/login.php', data).success(function(response){
            if (!(response[0].username == null)) {
                localStorage.setItem("username", response[0].username);
                $location.path('system');
            }
            else
            {
                $scope.invaliduser = true;
            }

        }).error(function(error){
            console.log('error');
            console.log(error);
        });
    };

});
