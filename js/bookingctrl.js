tandemApp.controller('BookingCtrl', ['$scope', 'BookResource', '$uibModal', '$filter', 'BooksGroupsResource', '$http', '$location', '$routeParams', '$timeout', '$mdDialog', '$route',
    function($scope, BookResource, $uibModal, $filter, BooksGroupsResource, $http, $location, $routeParams, $timeout, $mdDialog, $route) {

        'use strict';

        $scope.TimeSlots = [];
        $scope.parent = {dt:''};
        $scope.depositpayed = false;
        $scope.bookupdated = false;
        $scope.outofslots = false;
        $scope.dtdisabled = false;
        $scope.continuedisabled = false;

        $scope.changeMode = function (mode) {
            $scope.mode = mode;
        };

        $scope.today = function () {
            $scope.currentDate = new Date();
        };

        $scope.isToday = function () {
            var today = new Date(),
                currentCalendarDate = new Date($scope.currentDate);

            today.setHours(0, 0, 0, 0);
            currentCalendarDate.setHours(0, 0, 0, 0);
            return today.getTime() === currentCalendarDate.getTime();
        };

        $scope.loadEvents = function () {
            $scope.eventSource = createRandomEvents();
        };

        $scope.onEventSelected = function (event) {
            $scope.event = event;
        };

        $scope.onTimeSelected = function (selectedTime) {
            console.log('Selected time: ' + selectedTime);
        };

        function createRandomEvents() {
            var events = [];
            for (var i = 0; i < 20; i += 1) {
                var date = new Date();
                var eventType = Math.floor(Math.random() * 2);
                var startDay = Math.floor(Math.random() * 90) - 45;
                var endDay = Math.floor(Math.random() * 2) + startDay;
                var startTime;
                var endTime;
                if (eventType === 0) {
                    startTime = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + startDay));
                    if (endDay === startDay) {
                        endDay += 1;
                    }
                    endTime = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + endDay));
                    events.push({
                        title: 'All Day - ' + i,
                        startTime: startTime,
                        endTime: endTime,
                        allDay: true
                    });
                } else {
                    var startMinute = Math.floor(Math.random() * 24 * 60);
                    var endMinute = Math.floor(Math.random() * 180) + startMinute;
                    startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate() + startDay, 0, date.getMinutes() + startMinute);
                    endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate() + endDay, 0, date.getMinutes() + endMinute);
                    events.push({
                        title: 'Event - ' + i,
                        startTime: startTime,
                        endTime: endTime,
                        allDay: false
                    });
                }
            }
            return events;
        }

        $scope.alert = function(){

            //reset
            $scope.showError = false;
            $scope.doFade = false;

            $scope.showError = true;

            $scope.errorMessage = 'Error has ocurred!!!';

            $timeout(function(){
                $scope.doFade = true;
            }, 2500);
        };


        $scope.$watch('parent.dt', function () {
            if ($scope.bookedit) {
                $scope.updateTimeSlots($scope.selectedTime);

            }

        });


        $http.get('endpoints/date.php')
            .success(function(data) {
                $scope.date = data[0].date;
                $scope.date = $scope.date.replace("-","/").replace("-","/")
                $scope.toggleDates();
            });

        $scope.selectFila = function(row)
        {
            $scope.selectedrow = row;
            $scope.indice = row;

        };

        $scope.showgroupid = function () {
            $scope.groupidview = true;
        };

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
                    if ($scope.bookedit) {
                        $scope.updateTimeSlots(0);
                    }
                });
        };

        $scope.bookdelete = function () {
            if (confirm('Desea eliminar el registro?')) {
                var index = $scope.Books.indexOf(this.book);

                // remove from database;
                this.book.deleted = 1;

                if ($scope.bookedit) {
                    $scope.updateTimeSlots(0);
                }

                return false;
            }
        };

        $scope.Books = [];

        $scope.refreshGroup = function() {
            if ($scope.groupid.length == 5) {
                $scope.groupid = $scope.groupid.toUpperCase();
                $scope.promise = BookResource.query({groupid: $scope.groupid}).$promise.then(function (resultBooks) {
                    $scope.Books = resultBooks;
                    $scope.bookslengthorig = $scope.Books.length;
                    if (resultBooks.length == 0) {
                        $scope.groupid = makeid();
                        $scope.invalidGroupID = true;
                    }
                    else {
                        var booklength = resultBooks.length;
                        $scope.depositpayed = false;
                        angular.forEach($scope.Books, function(value, key) {
                            if (value.vdeposit > 0) {
                                $scope.depositpayed = true;
                            }
                        });

                        BooksGroupsResource.query({groupid: $scope.groupid}).$promise.then(function(resultBooksGroups) {
                            if (resultBooksGroups.length > 0) {
                                $scope.selectedTime = resultBooksGroups[0].selectedTime;
                                $scope.parent.dt = resultBooksGroups[0].bookdate;
                                $scope.mpurl = resultBooksGroups[0].mpurl;
                                $scope.Books[0].notes = resultBooksGroups[0].notes;

                                var bookeddate = new Date(resultBooksGroups[0].booking_datetime);
                                bookeddate.setDate(bookeddate.getDate() + 1);
                                bookeddate.setHours(0,0,0,0);
                                var bookenddate = new Date(resultBooksGroups[0].bookdate + " 00:00:00");
                                var nextday = new Date($scope.date);
                                nextday.setDate(nextday.getDate() + 1);

                                if (bookenddate <= nextday && nextday.toString() != bookeddate.toString()) {
                                    $scope.dtdisabled = true;
                                    $scope.continuedisabledbydate = true;
                                }

                                $scope.updateTimeSlots(resultBooksGroups[0].selectedTime);
                            }
                        });
                    }
                });

            }
            else {
                $scope.Books = [];
            };
        };

        $scope.updateTimeSlots = function(selectedTime) {
            var obj = {};
            var obj = new Object();
            var fecha = $filter('date')($scope.parent.dt, "yyyy/MM/dd");
            var BooksTemp = $.grep($scope.Books, function(value){
                return (value.deleted != true)
            });

            var obj = { "date": fecha, "count":BooksTemp.length, "groupid":$scope.groupid};

            $scope.promise =  $http.post('endpoints/slotsavailables.php', obj)
                .success(function(result) {
                    if (result.error == 'error') {
                        $scope.alert();
                    }
                    else {
                        $scope.outofslots = false;
                        $scope.continuedisabled = false;

                        if (result.length == 0 && $scope.Books[0].bookdate != '' ) {
                            $scope.outofslots = true;
                            $scope.continuedisabled = true;
                        }

                        if (angular.isArray(result)) {
                            result.push({ label:'S/HORARIO', value: 0});
                        }

                        $scope.TimeSlots = result;

                        var TS = $.grep($scope.TimeSlots, function(TS) {
                            return TS.value == selectedTime;
                        });

                        if (TS.length == 0) {
                            $scope.selectedTime = 0;
                        }
                        else {
                            $scope.selectedTime = selectedTime;
                        }
                    }
                });
        };

        // Select if new or edit
        //if ($scope.groupid == undefined) {
            $scope.groupid = $routeParams.groupid;
            if (typeof $scope.groupid === 'undefined') {
                $scope.groupid = makeid();
                $scope.groupidview = false;
                $scope.groupiddisabled = false;
                $scope.invalidGroupID = false;
                $scope.status = {opened: true};
                $scope.bookedit = false;

            }
            else {
                $scope.groupidview = true;
                $scope.status = {opened: false};
                $scope.refreshGroup();
                $scope.bookedit = true;
                $scope.status = {opened: false};

            }
        //}

        $scope.saveGift = function () {
            if ($scope.book == undefined) {
                $scope.book = {};
            }

            if (!(($scope.book.firstname == undefined) ||
                ($scope.book.lastname == undefined) ||
                ($scope.book.email == undefined) ||
                ($scope.book.phonenumber == undefined) ||
                ($scope.book.areacode == undefined)))
            {
                $scope.Books = [];
                $scope.book.phone = '+54' + $scope.book.areacode + $scope.book.phonenumber;
                $scope.Books.push($scope.book);

                var modalInstance;
                modalInstance = $uibModal.open({
                    templateUrl: 'waivers.html',
                    controller: 'termsCtrl',
                    resolve: {}
                }).result.then(function () {
                    // Save DB
                    $scope.Books[0].groupid = $scope.groupid;
                    $scope.Books[0].bookdate = '';
                    $scope.Books[0].bookedit = false;
                    $scope.Books[0].bookslength = 1;
                    $scope.Books[0].selectedTime = 0;

                    $scope.promise = $http.post('endpoints/newBooking.php', $scope.Books).success(function (result) {
                        if (result.error == 'error') {
                            $scope.alert();
                        }
                        else {
                            var item = result[0];
                            item.bookslength = 1;
                            item.groupid = $scope.Books[0].groupid;
                            modalInstance = $uibModal.open({
                                templateUrl: 'mppaymentregalo.html',
                                controller: 'MPpaymentRegaloCtrl',
                                resolve: {item: item}
                            }).result.then(function () {
                                    $mdDialog.show(
                                        $mdDialog.alert()
                                            .parent(angular.element(document.querySelector('#popupContainer')))
                                            .clickOutsideToClose(true)
                                            .title('Pago de reserva pendiente')
                                            .textContent('Por favor tome nota del link http://booking.paracaidismorosario.com/#/' + $scope.groupid + ' para realizar el pago de la reserva. Ademas le hemos enviado el mismo a su correo ' + $scope.Books[0].email)
                                            .ok('Entendido')
                                    );
                                    $location.path('/booksucess/' + $scope.groupid);
                                    $route.reload();
                                }, function () {
                                    $location.path('/booksucess/' + $scope.groupid);
                                    $route.reload();
                                });
                        }
                    });
                });
            }
        };

        $scope.setPayColor = function() {
            if ($scope.outofslots == true) {
                return {"opacity": 0.5};
            }
        };
        $scope.saveBooking = function() {
            if ($scope.outofslots) {
                return;
            }

            // Waivers
            var email = false;
            var phone = false;
            angular.forEach($scope.Books, function(book)
            {
                if (!(book.deleted == true))
                {
                    if (!(book.email == undefined)) {
                        email = true;
                    }
                    if (!(book.phone == undefined)) {
                        phone = true;
                    }
                };

            });

            if (email && phone) {

                ////////////////////////////////////////////////////////////////////////////////////////////////////////
                // Book Edit
                if ($scope.bookedit)  {
                    // Save DB
                    $scope.Books[0].groupid = $scope.groupid;
                    $scope.Books[0].bookdate = $filter('date')($scope.parent.dt, "yyyy/MM/dd");
                    $scope.Books[0].bookedit = $scope.bookedit;
                    var bookslength = $scope.Books.length;
                    if ($scope.bookedit == true) {
                        if ($scope.depositpayed) {
                            bookslength = bookslength - $scope.bookslengthorig;
                        }
                        if (bookslength <= 0) {
                            bookslength = 0;
                        }
                    }

                    $scope.Books[0].bookslength = bookslength;
                    $scope.Books[0].selectedTime = $scope.selectedTime;

                    $scope.promise = $http.post('endpoints/newBooking.php', $scope.Books).success(function (result) {
                        if (result.error == 'error') {
                            $scope.alert();
                        }
                        else {
                            if (!$scope.depositpayed) {
                                var item = result[0];
                                item.bookslength = $scope.Books[0].bookslength;
                                var url = 'mppayment.html';
                                var ctrl = 'MPpaymentCtrl';
                                if ($scope.Books[0].notes == "GIFT") {
                                    url = 'mppaymentregalo.html';
                                    ctrl = 'MPpaymentRegaloCtrl';
                                }
                                modalInstance = $uibModal.open({
                                    templateUrl: url,
                                    controller: ctrl,
                                    resolve: {item: item}
                                }).result.then(function () {
                                        $mdDialog.show(
                                            $mdDialog.alert()
                                                .parent(angular.element(document.querySelector('#popupContainer')))
                                                .clickOutsideToClose(true)
                                                .title('Pago de reserva pendiente')
                                                .textContent('Por favor tome nota del link http://booking.paracaidismorosario.com/#/' + $scope.groupid + ' para realizar el pago de la reserva. Ademas le hemos enviado el mismo a su correo ' + $scope.Books[0].email)
                                                .ok('Entendido')
                                        );
                                        $location.path('/booksucess/' + $scope.groupid);
                                        $route.reload();
                                    }, function () {
                                        $location.path('/booksucess/' + $scope.groupid);
                                        $route.reload();
                                    });
                            }
                            else {
                                $scope.bookupdated = true;
                                $mdDialog.alert()
                                    .parent(angular.element(document.querySelector('#popupContainer')))
                                    .clickOutsideToClose(true)
                                    .title('Reserva actualizada')
                                    .textContent('Su reserva se ha actualizado con exito. Le hemos enviado un email con toda la informacion a su correo ' + $scope.Books[0].email)
                                    .ok('Entendido')
                            };
                        };
                    });
                }
                // end book edit
                ////////////////////////////////////////////////////////////////////////////////////////////////////////

                ////////////////////////////////////////////////////////////////////////////////////////////////////////
                // normal add
                else {
                    var modalInstance;
                    modalInstance = $uibModal.open({
                        templateUrl: 'waivers.html',
                        controller: 'termsCtrl',
                        resolve: {}
                    }).result.then(function () {
                            // Save DB
                            $scope.Books[0].groupid = $scope.groupid;
                            $scope.Books[0].bookdate = $filter('date')($scope.parent.dt, "yyyy/MM/dd");
                            $scope.Books[0].bookedit = $scope.bookedit;
                            var bookslength = $scope.Books.length;
                            if ($scope.bookedit == true) {
                                bookslength = bookslength - $scope.bookslengthorig;
                                if (bookslength <= 0) {
                                    bookslength = 0;
                                }
                            }

                            $scope.Books[0].bookslength = bookslength;
                            $scope.Books[0].selectedTime = $scope.selectedTime;

                            $scope.promise = $http.post('endpoints/newBooking.php', $scope.Books).success(function (result) {
                                if (result.error == 'error') {
                                    $scope.alert();
                                }
                                else {
                                    if (angular.isUndefined(result[0].duplicated)) {
                                        if (!(bookslength === 0)) {
                                            var item = result[0];
                                            item.bookslength = $scope.Books[0].bookslength;
                                            modalInstance = $uibModal.open({
                                                templateUrl: 'mppayment.html',
                                                controller: 'MPpaymentCtrl',
                                                resolve: {item: item}
                                            }).result.then(function () {
                                                    $mdDialog.show(
                                                        $mdDialog.alert()
                                                            .parent(angular.element(document.querySelector('#popupContainer')))
                                                            .clickOutsideToClose(true)
                                                            .title('Pago de reserva pendiente')
                                                            .textContent('Por favor tome nota del link http://booking.paracaidismorosario.com/#/' + $scope.groupid + ' para realizar el pago de la reserva. Ademas le hemos enviado el mismo a su correo ' + $scope.Books[0].email)
                                                            .ok('Entendido')
                                                    );
                                                    $location.path('/booksucess/' + $scope.groupid);
                                                    $route.reload();
                                                }, function () {
                                                    $location.path('/booksucess/' + $scope.groupid);
                                                    $route.reload();
                                                });
                                        }
                                        else {
                                            $mdDialog.alert()
                                                .parent(angular.element(document.querySelector('#popupContainer')))
                                                .clickOutsideToClose(true)
                                                .title('Reserva actualizada')
                                                .textContent('Su reserva se ha actualizado con exito. Le hemos enviado un email con toda la informacion a su correo ' + $scope.Books[0].email)
                                                .ok('Entendido')
                                        }
                                    }
                                    else
                                    {
                                        $mdDialog.show(
                                            $mdDialog.alert()
                                                .parent(angular.element(document.querySelector('#popupContainer')))
                                                .clickOutsideToClose(true)
                                                .title('Reserva duplicada')
                                                .textContent('Hemos encontrado una reserva bajo su nombre. Lo redirigiremos a la misma para su edicion.')
                                                .ok('Entendido')
                                        );
                                        $location.path('/booksucess/' + result[0].duplicated);
                                        $route.reload();
                                    }
                                }
                            });
                        })
                };
            }
            else {
                alert("Debe definir un email y telefono");
            };

        };


        /////////////////////////////////////////
        // Date Picker

        $scope.status = {
            opened: false
        };

        $http.get('endpoints/bookdatesavailables.php')
            .success(function (data) {
                $scope.bookdatesavailables = [];
                angular.forEach(data, function (value, key) {
                    $scope.bookdatesavailables.push(value.date);
                    $scope.status = {opened: true};

                    if ($scope.bookedit == true) {
                        $scope.status = {opened: false};
                    }

                });
            });

        $scope.disabled = function (date, mode) {
            if (!(localStorage.getItem('username') == null)) {
                return (mode === 'day' && 0);
            }
            if (angular.isArray($scope.bookdatesavailables)) {
                date = $filter('date')(date, "yyyy-MM-dd");
                var disabledate = true;
                if ($scope.bookdatesavailables.indexOf(date) != -1) {
                    disabledate = false;
                }

                return ( mode === 'day' && disabledate );
            }
            else {
                return (mode === 'day' && 1);
            }
        };

        $scope.toggleDates = function () {
            if (localStorage.getItem('username') == null) {
                $scope.minDate = new Date($scope.date);  //$scope.minDate ? null :
                $scope.minDate.setDate($scope.minDate.getDate() + 1);
            }
        };

        $scope.opencalendar = function ($event) {
            $scope.status.opened = true;
        };

        $scope.setDate = function (year, month, day) {
            $scope.parent.dt = new Date(year, month, day);
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
        if ($scope.book.dobyear && $scope.book.dobmonth && $scope.book.dobday) {
            $scope.book.dobdate = $scope.book.dobyear + "/" + $scope.book.dobmonth + "/" + $scope.book.dobday;
        }
        if ($scope.book.areacode && $scope.book.phonenumber) {
            $scope.book.phone = '+54' + $scope.book.areacode + $scope.book.phonenumber;
        }
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


tandemApp.controller('termsCtrl', function ($scope, $modalInstance) {
    $scope.cancel = function () {
        $modalInstance.dismiss('Close');
    };

    $scope.acceptTerms = function() {
        $modalInstance.close();
    };
});


tandemApp.controller('MPpaymentCtrl', function ($scope, $modalInstance, item) {

    $scope.MP_PayAmmount = item.bookslength * 300;

    $scope.horario = false;

    $scope.goBack = function () {
        $modalInstance.dismiss('Close');
    };

    $scope.acceptMP = function() {
        $scope.horario = true;
        $(".modal-body").html('<iframe  sandbox="allow-forms allow-scripts allow-pointer-lock allow-popups allow-same-origin" width="100%" height="75%" frameborder="0" scrolling="yes" allowtransparency="true" src="'+item.mpurl+'"></iframe>');
    };

    $scope.payAfter = function () {
        $modalInstance.close();
    }

});

tandemApp.controller('MPpaymentRegaloCtrl', function ($scope, $modalInstance, item) {

    $scope.MP_PayAmmount = 1900;
    $scope.groupid = item.groupid;

    $scope.goBack = function () {
        $modalInstance.dismiss('Close');
    };

    $scope.acceptMP = function() {
        $(".modal-body").html('<iframe  sandbox="allow-forms allow-scripts allow-pointer-lock allow-popups allow-same-origin" width="100%" height="75%" frameborder="0" scrolling="yes" allowtransparency="true" src="'+item.mpurl+'"></iframe>');
    };

    $scope.payAfter = function () {
        $modalInstance.close();
    }

});
