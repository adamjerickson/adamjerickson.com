/*! dmsi.viewers.poc - v0.1.0 - 2016-02-16 */(function() {
	'use strict';

	// Declare app level module which depends on views, and components
	angular.module('dmsi.viewers.poc', [
	 'ui.router',
   'ngAnimate',
   'angular-loading-bar',
   'ui.grid',
   'ui.grid.pinning',
   'ui.grid.autoResize',
   'ui.grid.resizeColumns',
   'ui.grid.cellNav',
   'ui.grid.selection',
   'frapontillo.gage'
	]);

  angular.module('dmsi.viewers.poc')
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('viewers', {
          url: '/viewers',
          views: {
            'header': {
              templateUrl: 'partials/header.html',
            },
            'content': {
              templateUrl: 'views/default.html',
            },
            'footer': {
              templateUrl: 'partials/footer.html'
            }
          }
        })
        .state('viewers.inventory', {
          url: '/inventory',
          views: {
            'content@': {
              templateUrl: 'views/inventory.html',
              controller: 'InventoryViewerController'
            }
          },
          data: {
            viewer: "Inventory"
          }
        })
        .state('viewers.transactions', {
          url: '/transactions',
          views: {
            'content@': {
              templateUrl: 'views/transactions.html',
              controller: 'TransactionViewerController'
            }
          },
          data: {
            viewer: "Transactions"
          }
        })
        .state('viewers.cmViewerForBrent', {
          url: '/cm',
          views: {
            'content@': {
              templateUrl: 'views/viewerGeneric.html',
              controller: 'CmViewerController'
            }
          },
          data: {
            viewer: "CM"
          }
        })
        .state('viewers.salesOrders', {
          url: '/so',
          views: {
            'content@': {
              templateUrl: 'views/viewerGeneric.html',
              controller: 'SoViewerController'
            }
          },
          data: {
            viewer: "Sales Orders"
          }
        })
        .state('viewers.cgGroupOrdersMonth', {
          url: '/so',
          views: {
            'content@': {
              templateUrl: 'views/viewerGeneric.html',
              controller: 'CgGroupOrdersMonthViewerController'
            }
          },
          data: {
            viewer: "CG Group Orders - Month"
          }
        });
        $urlRouterProvider.otherwise('/viewers/inventory');


}]); // end config

}()); // end scope closure
angular.module('dmsi.viewers.poc')
.controller('CgGroupOrdersMonthViewerController', ['$scope', '$rootScope', 'ViewerService', function($scope, $rootScope, ViewerService) {

  $scope.data = [];
  $scope.viewer = {};
  $scope.viewer.highlightColumn = '';
  $scope.columnDefs = [];

  $scope.viewer.gridOptions = {
    enableFiltering: true,
    enableSorting: true,
    enablePinning: true,
    onRegisterApi: function( gridApi ) {
      $scope.gridApi = gridApi;
    },
    columnDefs: $scope.columnDefs
  };

  $scope.setColDefs = function(data) {
    if (data.length < 1) {
      return;
    }
    for (var x = 0; x < Object.keys(data[0]).length; x++) {
      $scope.columnDefs.push(
        {
          name: Object.keys(data[0])[x],
          index: x,
          width: "100",
          cellClass: x % 4 ? '' : 'red'
        }
      );
    }

  };

  $scope.init = (function() {
    ViewerService.login('bheavican', 'bheavican').then(function() {
      ViewerService.getCgGroupOrdersMonth().then(function(response) {
        $scope.setColDefs(response);
        $scope.viewer.gridOptions.data = response;
      });
    });

  });
  $scope.init();

}]);
angular.module('dmsi.viewers.poc')
.controller('CmViewerController', ['$scope', '$rootScope', 'ViewerService', function($scope, $rootScope, ViewerService) {

  $scope.data = [];
  $scope.viewer = {};
  $scope.viewer.highlightColumn = '';
  $scope.columnDefs = [];

  $scope.viewer.gridOptions = {
    enableFiltering: true,
    enableSorting: true,
    enablePinning: true,
    onRegisterApi: function( gridApi ) {
      $scope.gridApi = gridApi;
    },
    columnDefs: $scope.columnDefs
  };

  $scope.setColDefs = function(data) {
    if (data.length < 1) {
      return;
    }
    for (var x = 0; x < Object.keys(data[0]).length; x++) {
      $scope.columnDefs.push(
        {
          name: Object.keys(data[0])[x],
          index: x,
          width: "100",
          cellClass: x % 4 ? '' : 'red'
        }
      );
    }

  };

  $scope.init = (function() {
    ViewerService.login('bheavican', 'bheavican').then(function() {
      ViewerService.getCm().then(function(response) {
        $scope.setColDefs(response);
        $scope.viewer.gridOptions.data = response;
      });
    });

  });
  $scope.init();

}]);
angular.module('dmsi.viewers.poc')
.controller('InventoryViewerController', ['$scope', '$rootScope', '$timeout', '$log', 'ViewerService', function($scope, $rootScope, $timeout, $log, ViewerService) {

  $scope.data = [];
  $scope.viewer = {};
  $scope.viewer.highlightColumn = '';
  $scope.columnDefs = [];
  $scope.viewer.gridOptions = {
    data: 'data',
    enableFiltering: true,
    enableSorting: true,
    enablePinning: true,
    enableRowSelection: true,
    enableSelectAll: true,
    multiSelect: false,
    enableRowHeaderSelection: false,
    enableFullRowSelection: true,
    showGridFooter:false,
    onRegisterApi: function( gridApi ) {
      $scope.gridApi = gridApi;
      $scope.gridApi.core.on.filterChanged( $scope, function() {
        var grid = this.grid;
        var visibleRows = $scope.gridApi.core.getVisibleRows(grid);
        $timeout(function(){
          $scope.viewer.callouts.uniqueItems.value = visibleRows.length;
          $scope.viewer.callouts.totalItems.value = $scope.getTotalNumItems(visibleRows.map(function(element) {
            return element.entity;
          }));
          $scope.getAvailableRatio(visibleRows.map(function(element) {
            return element.entity;
          }));
          $scope.safeApply();
        } , 50);
      });
      gridApi.selection.on.rowSelectionChanged($scope,function(row, event){
        document.location.search = "branch=" + row.entity.branch + "&itemPtr=" + row.entity.itemPtr;
      });
 
      gridApi.selection.on.rowSelectionChangedBatch($scope,function(rows){
        var row = rows[0];
        document.location.href = document.location.hostname + document.location.pathname + "branch=" + row.entity.branch + "&itemPtr=" + row.entity.itemPtr;
      });
    },
 
  // I was having trouble setting parameters for the grid after it was loaded, here looks like a good example of how to do it properly.:
  // $scope.toggleRow1 = function() {
  //     $scope.gridApi.selection.toggleRowSelection($scope.gridOptions.data[0]);
  //   };
 
  //   $scope.toggleFullRowSelection = function() {
  //     $scope.gridOptions.enableFullRowSelection = !$scope.gridOptions.enableFullRowSelection;
  //     $scope.gridApi.core.notifyDataChange( uiGridConstants.dataChange.OPTIONS);
  //   };$scope.toggleFullRowSelection = function() {
  //     $scope.gridOptions.enableFullRowSelection = !$scope.gridOptions.enableFullRowSelection;
  //     $scope.gridApi.core.notifyDataChange( uiGridConstants.dataChange.OPTIONS);
  //   };
  // $scope.setSelectable = function() {
  //     $scope.gridApi.selection.clearSelectedRows();
 
  //     $scope.gridOptions.isRowSelectable = function(row){
  //       if(row.entity.age > 30){
  //         return false;
  //       } else {
  //         return true;
  //       }
  //     };
  //     $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.OPTIONS);
 
  //     $scope.gridOptions.data[0].age = 31;
  //     $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.EDIT);
  //   };
  
    columnDefs: $scope.columnDefs
  };

  $scope.getAvailableRatio = function(incomingData) {
    var data;
    if (typeof(incomingData) !== 'undefined') {
      data = incomingData;
    } else {
      data = $scope.data;
    }

    if (data.length < 1) {
      return 0;
    } else {
      var commitRatioArr = data
      .map(function(element) {
        return { "onHand": element.onHand, 'committed': element.committed, 'available': element.availqty };
      });

      var totalOnHand = commitRatioArr
      .reduce(function(tot, element) {
        return tot + element.onHand;
      }, 0);

      var totalCommitted = commitRatioArr
      .reduce(function(tot, element) {
        return tot + element.committed;
      }, 0);

      var totalAvailable = commitRatioArr
      .reduce(function(tot, element) {
        return tot + element.available;
      }, 0);

      $scope.viewer.callouts.commitRatio.value = totalOnHand !== 0 ? Math.round((totalAvailable/totalOnHand) * 100) : 0;
      $scope.viewer.callouts.commitRatio.min = 0;
      $scope.viewer.callouts.commitRatio.max = 100;
    }
  };

  $scope.getTotalNumItems = function(incomingData) {
    var data;
    if (typeof(incomingData) !== 'undefined') {
      data = incomingData;
    } else {
      data = $scope.data;
    }

    if (data.length < 1) {
      return 0;
    } else {
      var theResult = data.reduce(function(total, element) {
        return total + element.onHand;
      }, 0);
      return Math.round(theResult);
    }
  };

  $scope.gettopThreeAvailable = function(incomingData) {
    var data;
    if (typeof(incomingData) !== 'undefined') {
      data = incomingData;
    } else {
      data = $scope.data;
    }

    // bug out if we have no data.
    if (data.length < 1) {
      return 0;
    }

    // group by item number

    // Sort by the availqty field, desc
    
    data.sort(function(elem1, elem2) {
      if (elem1.availqty < elem2.availqty) {
        return 1;
      }

      if (elem1.availqty > elem2.availqty) {
        return -1;
      }

      return 0;
    });

    // take the top 5
    return data.slice(0, 3);    


  };


  $scope.viewer.callouts = {};
  $scope.viewer.callouts.uniqueItems = {title: "Unique Items", label: "Unique Items", value: 0};
  $scope.viewer.callouts.totalItems = {title: "Total Items", label: "Total Items", value: 0};
  $scope.viewer.callouts.topThree = {title: "Most Available", label: "Most Available", value: 0};
  $scope.viewer.callouts.onHand = {};
  $scope.viewer.callouts.avail = {};
  $scope.viewer.callouts.committed = {};
  $scope.viewer.callouts.backorder = {};
  $scope.viewer.callouts.onorder = {};
  $scope.viewer.callouts.commitRatio = {title: "Availability Ratio", label:"Available/On Hand", value: $scope.getAvailableRatio()};




  $scope.setColDefs = function(data) {
    if (data.length < 1) {
      return;
    }
    for (var x = 0; x < Object.keys(data[0]).length; x++) {
      $scope.columnDefs.push(
        {
          name: Object.keys(data[0])[x],
          index: x,
          width: "100",
          cellClass: x % 10 ? '' : 'red'
        }
      );
    }

  };


  $scope.gridActionTestOne = function(event) {
    document.location.href = "/brent/this/is/a/test?can=you&read=what&I=am&writing=here";
  };


  $scope.init = (function() {
    ViewerService.login('bheavican', 'bheavican').then(function() {
      ViewerService.getInventory().then(function(response) {
        $scope.setColDefs(response);
        $scope.data = response;
        //$scope.viewer.gridOptions.data = $scope.data;
        $scope.getAvailableRatio();
        $scope.viewer.callouts.uniqueItems.value = $scope.data.length;
        $scope.viewer.callouts.totalItems.value = $scope.getTotalNumItems();
        $scope.viewer.callouts.topThree.value = $scope.gettopThreeAvailable();
      });
    });

  });
  $scope.init();

  // Some event for filtering happening that updates totalItems....

}]);
angular.module('dmsi.viewers.poc')
.controller('MainController', ['$scope', '$rootScope', '$timeout', '$state', function($scope, $rootScope, $timeout, $state) {
  $scope.viewers = {};
  $scope.viewers.viewer = "";
  $scope.viewers.userAgent = navigator.userAgent;
  $scope.viewers.showUserAgent = false;

  $scope.safeApply = function(fn) {
    var phase = this.$root.$$phase;
    if(phase == '$apply' || phase == '$digest') {
      if(fn && (typeof(fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };

  // Add event handlers to disable/black out items pane while loading.
  $scope.$on('cfpLoadingBar:started', function() {
    $scope.viewers.loading = true;
  });
  $scope.$on('cfpLoadingBar:completed', function() {
    $timeout(function() {
      $scope.viewers.loading = false;
      $scope.viewers.viewer = $state.current.data.viewer;
    }, 800);
  });

}]);
angular.module('dmsi.viewers.poc')
.controller('SoViewerController', ['$scope', '$rootScope', 'ViewerService', function($scope, $rootScope, ViewerService) {

  $scope.data = [];
  $scope.viewer = {};
  $scope.viewer.highlightColumn = '';
  $scope.columnDefs = [];

  $scope.viewer.gridOptions = {
    enableFiltering: true,
    enableSorting: true,
    enablePinning: true,
    onRegisterApi: function( gridApi ) {
      $scope.gridApi = gridApi;
    },
    columnDefs: $scope.columnDefs
  };

  $scope.setColDefs = function(data) {
    if (data.length < 1) {
      return;
    }
    for (var x = 0; x < Object.keys(data[0]).length; x++) {
      $scope.columnDefs.push(
        {
          name: Object.keys(data[0])[x],
          index: x,
          width: "100",
          cellClass: x % 4 ? '' : 'red'
        }
      );
    }

  };

  $scope.init = (function() {
    ViewerService.login('bheavican', 'bheavican').then(function() {
      ViewerService.getSalesOrders().then(function(response) {
        $scope.setColDefs(response);
        $scope.viewer.gridOptions.data = response;
      });
    });

  });
  $scope.init();

}]);
angular.module('dmsi.viewers.poc')
.controller('TransactionViewerController', ['$scope', '$rootScope', '$timeout', '$log',  'uiGridConstants', 'ViewerService', function($scope, $rootScope, $timeout, $log, uiGridConstants, ViewerService) {

  $scope.dataContainer = [];
  $scope.data = [];
  $scope.viewer = {};
  $scope.columnDefsContainer = [];
  $scope.columnDefs = [];
  $scope.viewer.gridOptions = {
    data: 'data',
    enableFiltering: true,
    enableSorting: true,
    enablePinning: true,
    enableRowSelection: true,
    enableSelectAll: true,
    multiSelect: false,
    enableRowHeaderSelection: false,
    enableFullRowSelection: true,
    showGridFooter:true,
    onRegisterApi: function( gridApi ) {
      $scope.gridApi = gridApi;
      $scope.gridApi.core.on.filterChanged( $scope, function() {
        var grid = this.grid;
        var visibleRows = $scope.gridApi.core.getVisibleRows(grid);
        $timeout(function(){
          /*$scope.viewer.callouts.uniqueItems.value = visibleRows.length;
          $scope.viewer.callouts.totalItems.value = $scope.getTotalNumItems(visibleRows.map(function(element) {
            return element.entity;
          }));
          $scope.getAvailableRatio(visibleRows.map(function(element) {
            return element.entity;
          }));
          $scope.safeApply(); */
        } , 50); // This is in a timeout to allow for filters to apply before recalculating callout data.
      });
      
    },
  
  // I was having trouble setting parameters for the grid after it was loaded, here looks like a good example of how to do it properly.:
  // $scope.toggleRow1 = function() {
  //     $scope.gridApi.selection.toggleRowSelection($scope.gridOptions.data[0]);
  //   };
 
  //   $scope.toggleFullRowSelection = function() {
  //     $scope.gridOptions.enableFullRowSelection = !$scope.gridOptions.enableFullRowSelection;
  //     $scope.gridApi.core.notifyDataChange( uiGridConstants.dataChange.OPTIONS);
  //   };$scope.toggleFullRowSelection = function() {
  //     $scope.gridOptions.enableFullRowSelection = !$scope.gridOptions.enableFullRowSelection;
  //     $scope.gridApi.core.notifyDataChange( uiGridConstants.dataChange.OPTIONS);
  //   };
  // $scope.setSelectable = function() {
  //     $scope.gridApi.selection.clearSelectedRows();
 
  //     $scope.gridOptions.isRowSelectable = function(row){
  //       if(row.entity.age > 30){
  //         return false;
  //       } else {
  //         return true;
  //       }
  //     };
  //     $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.OPTIONS);
 
  //     $scope.gridOptions.data[0].age = 31;
  //     $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.EDIT);
  //   };
  
    columnDefs: $scope.columnDefs
  };

  $scope.toggleFullRowSelection = function() {
    $scope.viewer.gridOptions.enableFullRowSelection = !$scope.viewer.gridOptions.enableFullRowSelection;
    $scope.gridApi.core.notifyDataChange( uiGridConstants.dataChange.OPTIONS);
  };

  $scope.setColDefs = function(data) {
    if (data.length < 1) {
      return [];
    }

    var columns = [];
    for (var x = 0; x < Object.keys(data[0]).length; x++) {
      
        columns.push(
          {
            name: Object.keys(data[0])[x],
            index: x,
            width: 100,
            minWidth: 50,
            cellClass: x % 10 ? '' : 'red'
          }
        
      );
      
    }

    return columns;

  };

  $scope.switchViews = function() {
    // reset data

    // reset columns

    // refresh the grid.
  };

  $scope.getTransactions = function() {
    ViewerService.getTransactions()
    .then(function(response) {
      // Transactions response is always an array of at least two objects in an array with a title and data properties
      // Protect ourselves from bad data.
      if (Array.isArray(response) !== true) {
        return;
      }
      if (Object.keys(response[0]).length !== 2) {
        return;
      }
      if (Object.keys(response[0]).sort().join().toLowerCase() !== "data,title") { // Better to have some dat typing here, but everything in time.
        return;
      }

      // Assign the response to the data container
      $scope.dataContainer = response;

      // Assign column definitions for each data set in the response.
      for (var i = 0; i < $scope.dataContainer.length; i++) {
        $scope.columnDefsContainer.push($scope.setColDefs($scope.dataContainer[i].data));
      }

      // Set the grid to use the first data set in the container.
      $scope.chosenViewer = "summary";
      $scope.columnDefs = $scope.columnDefsContainer[0];
      $scope.data = $scope.dataContainer[0].data;
      
      $scope.viewer.gridOptions.columnDefs = $scope.columnDefs;
      $scope.viewer.gridOptions.data = $scope.data;

    });
  };

  $scope.changeGridData = function() {
    if ($scope.chosenViewer.toLowerCase() === "summary") {
      $scope.viewer.gridOptions.columnDefs = $scope.columnDefsContainer[0];
      $scope.data = $scope.dataContainer[0].data;
    } else {
      $scope.viewer.gridOptions.columnDefs = $scope.columnDefsContainer[1];
      $scope.data = $scope.dataContainer[1].data; 
    }
  };
  

  $scope.init = (function() {
    ViewerService.login('bheavican', 'bheavican')
    .then(function() {
      $scope.getTransactions();
    });
  });
  $scope.init();
}]);





angular.module('dmsi.viewers.poc')
.directive('chooser', function() {
  return {
    restrict: 'EA',
    replace: true,
    templateUrl: 'directives/chooser.directive.html',
    link: function(scope, element, attr) {

      scope.applyFocusHighlightingToLabel = function(event) {
        $(event.target).closest('label').addClass('focus');
        console.log('focusing');
      };
      scope.removeFocusHighlightingToLabel = function(event) {
        $(event.target).closest('label').removeClass('focus');
        console.log('blurring');
      };
      

    }
  };
});
angular.module("dmsi.viewers.poc")
.factory("ViewerService", ['$q', '$http', '$log', function($q, $http, $log) {

  var vs = {};
  vs._contextId = "";
  vs._baseUrl = "http://restapps.dmsi.com:8980/AgilityViewerService/rest/AgilityViewerService";
  //vs._baseUrl = "http://localhost:5000/AgilityViewerService/rest/AgilityViewerService";

  /**
    Logs into the VC REST backend with given username and password.  The returned context ID is used on all subequent calls.

      @param String username
      @param String password
  */
  vs.login = function(username, password) {
    var deferred = new $q.defer();
    vs._contextId = null;

    $http({
      method: 'POST',
      url: vs._baseUrl + '/Login',
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        "request":
          {
            "LoginID": username,
            "Password": password
          }
      }
    }).then(
      //success
      function(response) {
        vs._contextId = response.data.response.SessionContextId;
        deferred.resolve(response);
      },
      // error
      function(error) {
        deferred.reject(error);
      }
    );

    return deferred.promise;
  };



  vs.getViewer = function(viewerName, viewerType, viewAs) {
    var deferred = $q.defer();

    var baseConfig = {
        "request":
          {
            "ContextID": vs._contextId,
            "ViewerType": viewerType,
            "ViewerName": viewerName,
            "AccessedBy": viewAs
          }
        };

    // make request
    $http({
      method: 'POST',
      url: vs._baseUrl + '/Viewer',
      headers: {
        "Content-Type": "application/json",
      },
      data: baseConfig
    }).then(
      //success
      function(response) {
        deferred.resolve(response.data.response.ResultsTable.ttDisplayData);
      },
      // error
      function(error) {
        deferred.reject(error);
      }
    );

    return deferred.promise;
  };

  vs.getInventory = function() {
    return vs.getViewer('Inventory Viewer', 'IN', 'bheavican');
  };
  vs.getTransactions = function() {
    var deferred = $q.defer();
    vs.getViewer('web test detail', 'SO', 'Adam').then(
      // success
      function getTransactionsSuccess(data) {
        var summaryData, detailData;
        
        data.map(function(transaction) {
          for (var property in transaction) {
            if (transaction[property] === null) {
              delete transaction[property];
            }
          }
        });

        summaryData = data.filter(function(transaction) {
          if (transaction.detailSummary.toLowerCase().trim() === "summary") {
            return true;
          } else {
            return false;
          }
        });

        detailData = data.filter(function(transaction) {
          if (transaction.detailSummary.toLowerCase().trim() === "detail") {
            return true;
          } else {
            return false;
          }
        });

        deferred.resolve(
          [
            {"title": "Summary", "data": summaryData},
            {"title": "Detail", "data": detailData}
          ]
        );
      },
      // error
      function getTransactionsError(error) {
        deferred.reject(error);
      }
    
    );
    return deferred.promise;
  };
  vs.getCm = function() {
    return vs.getViewer('CM Viewer for Brent', 'SO', 'bheavican');
  };
  vs.getSalesOrders = function() {
    return vs.getViewer('SO Viewer - Becky', 'SO', 'bheavican');
  };
  vs.getCgGroupOrdersMonth = function() {
    return vs.getViewer('CG Group Orders for this month', 'SO', 'bheavican');
  };




  return vs;
}]);