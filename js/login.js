'use strict';

tandemApp.controller('loginCtrl', function ($scope, $http, $location, BookResource) {


    $scope.searchJumper = function () {
        $scope.searching = true;
        $scope.promise = BookResource.query({where: "firstname LIKE '%" + $scope.selectedJumper + "%' OR lastname LIKE '%" + $scope.selectedJumper + "%';"}).$promise.then(function (resultBooks) {
            $scope.jumpers = resultBooks;
            $scope.searching = false;
        });

    }


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
