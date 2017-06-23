/*! dmsiVc - v0.1.0 - 2015-12-22 */(function() {
	'use strict';

	// Declare app level module which depends on views, and components
	angular.module('dmsiVc', [
	 'ui.router',
	]);

  angular.module('dmsiVc')
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('vc', {
          url: '/vc',
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
        .state('vc.items', {
          url: '/items/:step',
          views: {
            'content@': {
              templateUrl: 'views/items.html',
              controller: 'ItemsController'
            }
          },
          data: {
            page: "Items"
          }
        })
        .state('vc.items.detail', {
          url: '/:category/:itemNum',
          views: {
            'content@': {
              templateUrl: 'views/item-detail.html',
              controller: 'ItemDetailController'
            }
          },
          data: {
            page: "Item Detail"
          }
        })

        .state('vc.items.detail-notes', {
          url: '/itemNum/notes',
          views: {
            'content@': {
              templateUrl: 'views/item-detail-notes.html',
              controller: 'ItemDetailController'
            }
          }
        })
        .state('vc.selections', {
          url: '/selections',
          views: {
            'content@': {
              templateUrl: 'views/selections.html',
              controller: 'SelectionsController'
            }
          },
          data: {
            finished: false,
            page: "Selections"
          }
        })
        .state('vc.selections.detail', {
          url: '/:category/:itemNum',
          views: {
            'content@': {
              templateUrl: 'views/selected-detail.html',
              controller: 'SelectionDetailController'
            }
          },
          data: {
            page: "Selected Item"
          }
        })
        .state('vc.selections.detail-notes', {
          url: '/:category/:itemNum/notes',
          views: {
            'content@': {
              templateUrl: 'views/selected-detail.html',
              controller: 'SelectionDetailController'
            }
          }
        })
        .state('vc.selections-finished', {
          url: '/selections/finished',
          views: {
            'content@': {
              templateUrl: 'views/selections.html',
              controller: 'SelectionsController'
            }
          },
          data: {
            finished: true,
            page: "Add to Cart"
          }
        });

        $urlRouterProvider.otherwise('/vc/items/0');


}]); // end config

}()); // end scope closure
angular.module('dmsiVc')
.controller('ItemsController', ['$scope', '$state', '$stateParams', '$timeout', 'ItemsService', 'SelectionsService', 'VcRestService', function($scope, $state, $stateParams, $timeout, ItemsService, SelectionsService, VcRestService) {

  /* PROPERTIES */
  $scope.itemAlreadyAdded = false;
  $scope.items = [];  // This is our main holder for data for this controller.
  $scope.query = ""; // This is used in the UI to filter the items shown on screen.

  /* METHODS */
  $scope.init = function() {
    // start the spinner
    $scope.$emit('dmsi:loading:started');
    

    // Check to see if we're logged into the rest service.  If not, do that first.
    if (VcRestService._contextId === null) {
      VcRestService.login('aerickson', 'aerickson')
      //VcRestService.login('brad', 'brad')
      .then(
        // success
        function(result) {
          $scope.getConfig();
        },
        // error
        function(error) {
          console.log(error); // $$$$ need real error messaging.  breaks IE.
        }
      );
    } else {// $$$$$ how to check for expired contextIds?
      $scope.getConfig();
    }
  };

  $scope.getConfig = function() {
    // start the spinner
    $scope.$emit('dmsi:loading:started');
    
    VcRestService.getConfig()
    .then(
      // success
      function(results) {
        // stop the spinner
        $scope.$emit('dmsi:loading:complete');
        

        // check that we aren't already done:
        if (VcRestService.configuration.IsFullyConfigured === true || VcRestService.configuration.IsFullyConfigured === "true") {
          // Set our list of items to empty set.
          $scope.items = [];
          //Transition to the "done choosing state".
          $state.go('vc.selections-finished');
          return;
        }

        // if not, then gete the new list of items
        if (results !== false) {
          // Set our list of items
          $scope.items = ItemsService.get();
          // set the current category
          $scope.items.category = VcRestService.getCurrentCategory();

          // Set high level attributes. Thigns in $scope.vc are set in MainController
          $scope.vc.page = 0;// $$$$ need to replace this step functionality.  keep track if possible....//$state.current.data.page;
          // Set the page title and back button settings.
          $scope.vc.setPageInfo("vc.items");

          // Make sure the Selections are updated as well with the initial selections
          SelectionsService.get();

          $scope.safeApply();
        }
      },
      // failure
      function(errorMessage) {
        // stop the spinner
        $scope.$emit('dmsi:loading:complete');

        console.log(errorMessage);
      });
  };

  $scope.hasClass = function(event, className) {
    var itemElement;
    // get a list of the classes on the element and split into an array
    var classes = event.target.className.split(' ');
    // filter the list looking for the given className
    var filtered = classes.filter(
      function(arrElem) {
        if (arrElem.trim() === className) {
          return true;
        } else {
          return false;
        }
      });

    // return true or false if it has that class.
    if (filtered.length > 0) {
      return true;
    } else {
      return false;
    }
  };

  // $$$$ Here's another reason this should be a directive, this item, because we have to go searching for the event, when directives have direct access to it.
  $scope.selectItem = function(event, item) {
    // start the spinner
    $scope.$emit('dmsi:loading:started');
    

    item = item.item;

    // start animating the element
    var domItem;
    if ($scope.hasClass(event, 'item') !== true) {
      // this was not an item element, most likely it's a child that triggered it, so find the parent item element.
      domItem = $(event.target).closest('.item');
      if (typeof(domItem) === 'undefined') {
        // abort, we clicked, but we can't find an item to deal with.  Something crazy happened.
        return false;
      }
    } else {
      // this is an item element that got the click so proceed.
      domItem = event.target;
    }
    if (domItem.parent) {
      domItem.parent().children().addClass('fade');
    }

    // add it to the selected items list
    if ($scope.itemAlreadyAdded !== true) {
      // mark the item as selected, which kicks off the animations
      item.selected = true;
      // actually add it
      SelectionsService.add($scope.items.category, item).then(
        // success
        function(response) {
          // $$$$ this probably doesn't need to be done anymore....update the total cost of the cart
//either take this out or put it in try/catch...//SelectionsService.updateTotal(SelectionsService.selections);
          $state.go('vc.items', {"step": Number($stateParams.step) + 1});
        },
        // failure
        function(error) {
//console.log('ohhhh..... so sad!');
        });
    }

    // turn off clicking so they can't add it twice:
    $scope.itemAlreadyAdded = true;
  };

  $scope.goToSelections = function() {
    console.log('fire!');
    console.log($('.selectionsContainer'));
    // $$$$ this should be in a directive.
    $('.selectionsContainer').addClass('expand');
    // $$$$ there must be a way to detect the animation, but until then, just wait 0.5 seconds and then switch views.
    $timeout(function() {
      $state.go('vc.selections');
    }, 500);
  };


//$$$$$$$$$ right now this changes the .items - so if you search, you can never delete and get the items back.  this really is a filter, so best thing is to figure out how to rewrite this as a filter.  Elsewise, we need to have another model, which is the displayItems and manage both things.
  $scope.filterItems = function(item) {
    if (
      item.name.toLowerCase().indexOf($scope.query.toLowerCase()) >=0 ||
      item.description.toLowerCase().indexOf($scope.query.toLowerCase()) >=0 ||
      item.itemNum.toLowerCase().indexOf($scope.query.toLowerCase()) >=0 ||
      String(item.price).toLowerCase().indexOf($scope.query.toLowerCase()) >=0
    ) {
      return true;
    } else {
      return false;
    }
  };

  /* INITIALIZATION STATEMENTS */
  $scope.init();

}]);
angular.module('dmsiVc')
.controller('LoadScreenController', ['$scope', '$timeout', '$state', function($scope, $timeout, $state) {

  $scope.test = 'testing';
  $timeout(function() {
      $('.logo').addClass('hidden');
      $('.totalsContainer').addClass('shown');
    }, 500);

  $timeout(function() {
      $state.go('vc.items');
    }, 2000);

}]);
angular.module('dmsiVc')
.controller('MainController', ['$scope', '$rootScope', '$timeout', '$state', 'VcRestService', function($scope, $rootScope, $timeout, $state, VcRestService) {
  $scope.vc = {};
  $scope.vc.configuringItem = VcRestService.getParentItem();
  $scope.vc.page = "";
  $scope.vc.back = "vc.items";

  $scope.vc.setPageInfo = function(backState) {
    $scope.vc.page = $state.current.data.page;
    $scope.vc.back = backState;
    $('.headerLeft>a').attr('href', $state.href(backState));
    $scope.safeApply();
  };

  $scope.vc.goBack = function(event) {
    event.preventDefault();
    event.stopPropagation();
    console.log(event);
    $state.go($scope.vc.back);
  };

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

  // Event handler to listen for configuration complete, and update the name of the item we're configuring
  $rootScope.$on('dmsi:vc:configLoaded', function() {
    
    $scope.vc.configuringItem = VcRestService.getParentItem();
    
    $scope.safeApply();
  });

  // Add event handlers to disable/black out items pane while loading.
  $scope.$on('dmsi:loading:started', function() {
    if ($scope.timeoutId !== 0) {
      $timeout.cancel($scope.timeoutId);
    }
    $scope.timeoutId = $timeout(function() {
      $scope.vc.loading = true;
      $('.loader').css('display', true);
    }, 1300);
    
  });
  
  $scope.$on('dmsi:loading:complete', function() {
    $timeout.cancel($scope.timeoutId);
    $scope.vc.loading = false;
    $('.loader').css('display', true);
  });

}]);
angular.module('dmsiVc')
.controller('SelectionsController', ['$scope', '$q', '$state', '$timeout', 'SelectionsService', 'ItemsService', function($scope, $q, $state, $timeout, SelectionsService, ItemsService) {

  // Set the page title and back button settings.
  if ($state.current && $state.current.data) {
    //console.log($state.current.data.page);
  }
  $scope.vc.setPageInfo("vc.items");

  // Create the selection controller object if it's not defined laready.  The only case where it's already defined is unit testing
  if (typeof($scope.sc) === 'undefined') {
    $scope.sc = {};
    $scope.sc.prices = SelectionsService.prices;
    $scope.sc.finished = $state.current.data ? $state.current.data.finished : false;
  }

  // Go get the selections from the service.
  $scope.sc.selections = SelectionsService.selections;
  $scope.sc.prices = SelectionsService.prices;

  /**
   * Some hoakieness to make this controller keep up to date on the Service variable 'selections'.
   * This should be easier, but it isn't.
   */
  $scope.$watchCollection(
    function() { return SelectionsService.selections; },
    function(newVal) {
      $scope.sc.selections = newVal;
    });


  /// $$$$$$$ temp...just seeding the value for testing right now.
//  $timeout(function() {SelectionsService.add('width', 'W28');}, 8000);


}]);
angular.module('dmsiVc')
.directive('backBar', function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'directives/backBar.directive.html',
    link: function(scope, element, attr) {


      // handle click event by throwing a new event up the chain to the navigation handler.
      scope.goBack = function(event) {
        scope.$emit('dmsi:vc:goBack', scope, element, attr, event);
      };

      // attach an event handler
      element.bind('click', scope.goBack);


    }
  };
});
angular.module('dmsiVc')
.directive('configurationItemName', function() {
  return {
    restrict: 'EA',
    replace: true,
    templateUrl: 'directives/configurationItemName.directive.html'
  };
});
angular.module('dmsiVc')
.directive('itemsHeader', function() {
  return {
    restrict: 'EA',
    replace: true,
    templateUrl: 'directives/itemsHeader.directive.html'
  };
});
angular.module('dmsiVc')
.directive('notes', function() {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      ngModel: '=',
    },
    templateUrl: 'directives/notes.directive.html',


  };
});
angular.module('dmsiVc')
.directive('totalPrice', function() {
  return {
    restrict: 'EA',
    replace: true,
    templateUrl: 'directives/totalPrice.directive.html',


  };
});
var app = angular.module('dmsiVc');
app.filter('returnEmptyStringIfUndefined', function() {

  return function(input) {
    if (typeof(input) !== undefined && input !== "" && input !== null) {
      return input;
    } else {
      return "";
    }
  };
});
angular.module("dmsiVc")
.factory("Item", ['Utilities', function(Utilities) {
  /**
  Item - Stores information about a configuration option in visual cafe.

  Example:
  {
        "itemNum": "pl-54321",
        "name": "Solid Oak Plank 80x32",
        "description": "This incredibly smooth and solid oak plank will be add warmth and joy to your family home.  Finished with love and pride by elves at the north pole, this tree made flat can stand up to any weather conditions.",
        "price": 455,
        "imageSrc": "media/placeholderImages/single.jpg",
        "details": [
          {
            "label": "item1",
            "value": "Item One"
          },
          {
            "label": "Item 2",
            "value": "Item two"
          },
          {
            "label": "item 3",
            "value": "Item three three three three three three three"
          },
          {
            "label": "item4",
            "value": "Item 80x32 and longer"
          },
          {
            "label": "Item 5",
            "value": "Item Five"
          }
        ]
      }
  */
  var Item = function() {
    this.itemNum = "";
    this.name = "";
    this.description = "";
    this.price = "";
    this.priceUom = "";
    this.imageSrc = "";
    this.details = {};
  };

  /**
    Maps an item from the format returned from the Progress REST service to properties of this class.

    It comes from the rest server like this (when it's a selection.  it's differnt as a bom comp)
    :
    {
      "lProcess": false,
      "parent_sequence": 1,
      "cItemCode": "W28",
      "cSizeDesc": "2'8\"",
      "dDispQty": 1,
      "cDispQtyUOM": "EA",
      "dDispPrice": 0,
      "dDispExtPrice": 0,
      "cPriceUOM": "EA",
      "bom_id": 7770,
      "iBOMSeq": 4,
      "qty": 1,
      "cImageFile": "",
      "cItemShortDesc": "2-8",
      "cItemExtDesc": "",
      "lPromptForMsg": false,
      "dRetailPrice": 0,
      "dRetailExtPrice": 0,
      "dRetailListPrice": 0,
      "dRetailListExtPrice": 0
    }

    MAPPING:
      cItemCode = itemNum
      cItemShortDesc | cItemExtDesc | cSizeDesc = name
      cItemExtDesc | cItemShortDesc | cSizeDesc = description
      cSizeDesc = sizeDescription (if not already used in one of the two things above).
      dDispExtPrice = price
      cImageFile = imageSrc
      dDispQty = quantity
      dDispQtyUOM = quantityUom

      dDispPrice = .details.displayPricePerUom
      qty = .details.priceQty // $$$$ this needs to be checked with some real data
      cPriceUOM = .details.priceUom // $$$$ this needs to be checked with some real data

      dRetailPrice = .details.retailPrice
      dRetailExtPrice = .details.retailExtendedPrice
      dRetailListPrice = .details.retailListPrice
      dRetailListExtPrice = .details.retailListExtendedPrice
  */
  Item.prototype.mapFromRestItem = function(restItem) {
    try {
      this.itemNum = restItem.cItemCode;

      Utilities.assignStringIfExists(this, "name", restItem, ["cSizeDesc", "cItemExtDesc", "cItemShortDesc"], "");

      this.description = "";
      this.price =                            restItem.dDispExtPrice;
      this.imageSrc =                         restItem.cImageFile;
      this.quantity =                         restItem.dDispQty;
      this.quantityUom =                      restItem.cDispQtyUOM;
      this.displayPricePerUom =               restItem.dDispPrice;

      this.details.priceQty =                 restItem.qty;
      this.details.priceUom =                 restItem.cPriceUOM;
      this.details.retailPrice =              restItem.dRetailPrice;
      this.details.retailExtendedPrice =      restItem.dRetailExtPrice;
      this.details.retailListPrice =          restItem.dRetailListPrice;
      this.details.retailListExtendedPrice =  restItem.dRetailListExtPrice;

      return this;
    } catch (e) {
      return null;
    }
  };

  return Item;
}]);

angular.module("dmsiVc")
.factory("ItemsService", ['$q', '$http', '$log', 'VcRestService', 'Item', function($q, $http, $log, VcRestService, Item) {

  var is = {};
  is.items = [];

  /**
   * Go fetch the items from VcRestService and put them in items.
  */
  is.get = function() {
    is.items = is.mapRestItemsToItems(VcRestService.configuration.dsVCTables.dsVCTables.ttVCOptLists);
    return is.items;
  };

  is.mapRestItemsToItems = function(restItems) {
    try {
      var items = restItems.map(
        function(restItem) {
          var item = new Item();
          item.mapFromRestItem(restItem);
          return item;
        }
      );
      return items;
    } catch(e) {
      return null;
    }
  };

  return is;
}]);


angular.module('dmsiVc')
.factory("VcRestService", ['$rootScope', '$q', '$http', function($rootScope, $q, $http) {
    var vcrs = {};

    // Private properties
    // $$$ this goes into config file...
    vcrs._baseUrl = "http://restapps.dmsi.com:8980/VCRESTService/rest/VCRESTService";
    vcrs._contextId = null;
    vcrs._cartSequence = 0;
    vcrs._attributeSequence = 0;

    // Public properties
    vcrs.configuration = {};

    /**
    Logs into the VC REST backend with given username and password.  The returned context ID is used on all subequent calls.

      @param String username
      @param String password
    */
    vcrs.login = function(username, password) {
      var deferred = new $q.defer();
      vcrs._contextId = null;

      $http({
        method: 'POST',
        url: vcrs._baseUrl + '/Login',
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
          vcrs._contextId = response.data.response.SessionContextId;
          deferred.resolve(response);
        },
        // error
        function(error) {
          deferred.reject(error);
        }
      );

      return deferred.promise;
    };

    /**
    Retrieves a new or existing configuration (A customizable product, and all selected customizations made so far).  If you provide a cartSequence, then it will retrieve the product from the shopping cart as it was last saved.  If you omit cartSequence, you will get a blank configuration.

      @param String cartSequence - The id# of the configuration you want to retrieve from the PV shopping cart.
    */
    vcrs.getConfig = function(cartSequence) {
      // Do some input checking
      if (typeof(cartSequence) === 'number') {
        vcrs._cartSequence = cartSequence;
      } else if (typeof(cartSequence === 'string') && !isNaN(Number(cartSequence))) {
        vcrs._cartSequence = Number(cartSequence);
      } else {
        cartSequence = 0;
      }

      // Create our promise container.
      var deferred = new $q.defer();

      // Use cache if possible.  If it's already filled out, use the existing property.  It is the responsibility of other methods to keep it updated.  If they're requesting a different cart id, though then we're looking for a new/different configuration, so we need to go to the server.
      if (typeof(vcrs.configuration.dsVCWoDrvr) !== 'undefined' && cartSequence === vcrs._cartSequence) {
        deferred.resolve(vcrs.configuration);
        return deferred.promise;
      }

      // If we didn't use cache, we have to go get a configuration.  The rest of this method is responsible for that.

      // build request object
      var baseConfig = {
        "request":
          {
            "ContextID": vcrs._contextId,
            "CartSequence": cartSequence,
            "recordType":"",
            "controlNumber":0,
            "dsVCWoDrvr": {
              "ttVCWoDrvr": [
                {
                  "cMode": "Add",
                  "cTranSysid": "HATFIELD", //$$$$ where do I get this?
                  "iTranID": 0,
                  "iTranSeq": 0,
                  "cSource": "SO", //$$$$ where do I get this?
                  "cCustCode": "102447", //$$$$ where do I get this?
                  "iCustShiptoNum": 1,
                  "cSaleType": "WHSE", //$$$$ where do I get this?
                  "cParentItemCode": "INT", //$$$$ where do I get this?
                  "dQtyOrdered": 1.0, //$$$$ where do I get this?
                  "cQtyUomCode": "EA", //$$$$ where do I get this?
                  "dNetPrice": 0.0,
                  "iQuoteID": 0,
                  "dExtendedNetPrice": 0.0000,
                  "lApplyMarkupFactor": false, //$$$$ where do I get this?
                  "dMarkupFactor": "",
                  "cRetailMode": "",
                  "dRetailPrice": 0.00,
                  "dRetailExtPrice": 0.00,
                  "dRetailListPrice": 0.00,
                  "dRetailListExtPrice": 0.00,
                  "lImageLicenseAndUrl": false, //$$$$ where do I get this?
                  "cVcFormLogoUrl": ""
                }
              ]
            }
          }
      };

      // make request
      $http({
        method: 'POST',
        url: vcrs._baseUrl + '/VCGetExistingConfig',
        headers: {
          "Content-Type": "application/json",
        },
        data: baseConfig
      }).then(
        //success
        function(response) {
          vcrs.configuration = response.data.response;
          vcrs.contextualizeConfiguration();
          deferred.resolve(response.data.response);
          $rootScope.$emit('dmsi:vc:configLoaded');
        },
        // error
        function(error) {
          deferred.reject(error);
        }
      );

      // return promise
      return deferred.promise;
    };

    vcrs.selectItem = function(itemCode) {
      var deferred = new $q.defer();
      var items = vcrs.configuration.dsVCTables.dsVCTables.ttVCOptLists;
      var chosenItemIndex = -1;

      // do a little input checking
      if (typeof(itemCode) === 'undefined') {
        deferred.reject('Missing item code.  Cannot select item if not specified.');
        return deferred.promise;
      } else if (typeof(itemCode) !== 'string') {
        deferred.reject('Invalid item code.  Item code sent as type ' + typeof(itemCode) + '.  Item code must be a string.');
        return deferred.promise;
      }

      // Find the chosen itemCode in the list of choices;
      for (var i = 0; i < items.length; i++) {
        if (typeof(items[i].cItemCode) !== 'undefined' && String(items[i].cItemCode).toLowerCase() === String(itemCode).toLowerCase()) {
          chosenItemIndex = i;
          break;
        }
      }

      // Make sure we found 1 and only 1 match.
      if (chosenItemIndex === -1) {
        deferred.reject('Invalid item code.  Couldn\'t find item ' + itemCode + ' in list of available choices.');
        return deferred.promise;
      }

      // Set the item we're trying to select
      vcrs.configuration.dsVCTables.dsVCTables.ttVCOptLists[chosenItemIndex].lProcess = true;

      // Add our contextId and cart sequence
      vcrs.contextualizeConfiguration();

      // build request object
      var requestObj = {
        "request": vcrs.configuration
      };
      // make request
      $http({
        method: 'POST',
        url: vcrs._baseUrl + '/VCSelectComponent',
        headers: {
          //"ContextID": "3339218af549f95-bd9b-3eb6-0514-1ae3dc8af6e0", // can't put this here due to progress not accepting custom headers during preflight requests.
          "Content-Type": "application/json",

        },
        data: requestObj
      }).then(
        //success
        function(response) {
          // Update our main configuration variable with the new response data.
          vcrs.configuration = response.data.response;
          //resolve promise;
          deferred.resolve(response.data.response);
        },
        // error
        function(error) {
          deferred.reject(error);
        }
      );

      // return promise
      return deferred.promise;
    };

    vcrs.getParentItem = function() {
      if (typeof(vcrs.configuration.dsVCWoDrvr) !== 'undefined') {
        return vcrs.configuration.dsVCWoDrvr.dsVCWoDrvr.ttVCWoDrvr[0].cParentItemCode;
      } else {
        return "";
      }
    };

    vcrs.contextualizeConfiguration = function() {
      vcrs.configuration.ContextID = vcrs._contextId;
      vcrs.configuration.CartSequence = vcrs._cartSequence;
      vcrs.configuration.AttributeSequence = vcrs._attributeSequence;
    };

    /**
     * Gets the category that the current set of items available to choose from represents.
     */
    vcrs.getCurrentCategory = function() {
      var parentSequence = vcrs.configuration.ParentSequence;
      var parentOptListItem = vcrs.configuration.dsVCTables.dsVCTables.ttVCOptParents.filter(
        function(element) {
          if (element.parent_desig === parentSequence) {
            return true;
          } else {
            return false;
          }
        });
      // there should only be one, and only one item in the parentOptListItem array
      // if there's more than one, just leave the category to blank, because we couldn't figure one out
      if (parentOptListItem.length > 1 || parentOptListItem.length < 1) {
        return;
      }

      // assuming there's just one item, find the category from it and return that.
      return parentOptListItem[0].description;
    };

    return vcrs;
}]);

angular.module("dmsiVc")
.factory("Selection", ['Item', 'Utilities', function(Item, Utilities) {

  /**
  Selection - A configuration item chosen by the user in Visual Cafe, or returned by the server because it's required by some other selection.

  A selection looks like this:
      {
        "category": "Plank",
        "item" : { // this is an instance of the Item class.
          "itemNum": "pl-54321",
          "name": "Solid Oak Plank 80x32",
          "description": "This incredibly smooth and solid oak plank will be add warmth and joy to your family home.  Finished with love and pride by elves at the north pole, this tree made flat can stand up to any weather conditions.",
          "price": 455
        }
      }
  */
  var Selection = function() {
    this.category = "";
    this.item = new Item();
  };

  Selection.prototype.mapFromRestSelection = function(restSelObj) {
    this.item.itemNum =                          restSelObj.item;
    // Name needs to be there.  But the data is unreliable, so we look in several places.
    // Utilities.assignStringIfExists(this.item, "name", restSelObj, ["short_desc", "description", "size-description"], "");
    // this.item.description =                      restSelObj.description;
    // if (this.item.name === restSelObj["size-description"] || this.item.description === restSelObj["size-description"]) {
    //   this.item.sizeDescription = "me";
    // } else {
    //   this.item.sizeDescription = restSelObj["size-description"];
    // }



    this.item.name = restSelObj.description;

    // $$$$ we will use 'phrase' only if it was a note/prompt field.
    if (true === false) {
      this.item.description = restSelObj.phrase;
    } else {
      this.item.description = "";
    }

    this.item.price =                            restSelObj.price;
    this.item.imageSrc =                         restSelObj.image_location;

    this.item.quantity =                         restSelObj.dDispQty;
    this.item.quantityUom =                      restSelObj["price-uom"];
    this.item.displayPricePerUom =               restSelObj.price;

    this.item.details.priceQty =                 restSelObj.qty;
    this.item.details.priceUom =                 restSelObj["price-uom"];
    this.item.details.retailPrice =              restSelObj.dRetailPrice;
    this.item.details.retailExtendedPrice =      restSelObj.dRetailExtPrice;
    this.item.details.retailListPrice =          restSelObj.dRetailListPrice;
    this.item.details.retailListExtendedPrice =  restSelObj.dRetailListExtPrice;
  };

  return Selection;
}]);
angular.module("dmsiVc")
.factory("SelectionsService", ['$q', '$http', '$log', '$rootScope', 'VcRestService', 'Item', 'Utilities', 'Selection', function($q, $http, $log, $rootScope, VcRestService, Item, Utilities, Selection) {

  var ss = {};
  ss.selections = []; // an array of selection objects, detailed below.
  ss.prices = {
    "totalPrice": 0,
    "totalPricePerUnit": 0,
    "totalPriceUom": 0,
    "totalPriceQuantity": 0,
  };

  /**
   * Gets data from the Selections service and returns
   * a promise.
  */
  ss.get = function() {
    // Go get the data.
    if (typeof(VcRestService) !== 'undefined' && typeof(VcRestService.configuration !== 'undefined') && Object.keys(VcRestService.configuration).length > 0 && typeof(VcRestService.configuration.dsVCTables.dsVCTables.ttVCBomComps) !==
      'undefined') {
      ss.selections =
        VcRestService.configuration.dsVCTables.dsVCTables.ttVCBomComps
        .map(ss.mapRestSelectionToSelection)
        .filter( // get rid of empty, undefined, or null values.
          function(selection) {
            if (typeof(selection) === 'undefined' || selection === null || selection === false || selection === "") {
              return false;
            } else {
              return true;
            }
          }
        );
      // update the total price
      ss.updateTotal(); // consider changing to event broadcast.
      return ss.selections;
    }
    return null;
  };

  /*
    {
        "item": "214SSB",
        "size-description": "2-1/4\" Strike, Satin Brass",
        "ext_desc": "",
        "dDispQty": 1,
        "add-deduct": "       1.9500",
        "price-uom": "EA",
        "BOM_ID": 7799,
        "sequence": 7,
        "iAttrSeq": 18,
        "parent-type": "O",
        "parent_sequence": 11,
        "parent_desig": -1,
        "qty": 1,
        "description": "Strike, Satin Brass",
        "short_desc": "Strike, Satin Brass",
        "price": 1.95,
        "phrase": "Strike, Satin Brass",
        "image_location": "",
        "lDisplayInConfigurator": false,
        "lPromptForMsg": false,
        "dRetailPrice": 0,
        "dRetailExtPrice": 0,
        "dRetailListPrice": 0,
        "dRetailListExtPrice": 0,
        "allow_image": false
    }
  */
  ss.mapRestSelectionToSelection = function(bomComp) {
    // Check to see if it's one we display or not.
    if (bomComp.lDisplayInConfigurator === false) {
      // this is not displayable, so just return nothing.
      return null;
    }

    // fill in the values appropriately.
    var s = new Selection(); // selection object
    var parent = ss.findMatchingParent(bomComp);
    if (parent !== null && typeof(parent.description) !== 'undefined') {
      s.category = parent.description;
    } else {
      s.category = "";
    }
    s.mapFromRestSelection(bomComp);

    return s;
  };

  ss.findMatchingParent = function(bomComp) {
    var parents = VcRestService.configuration.dsVCTables.dsVCTables.ttVCOptParents;
    for (var i = 0; i < parents.length; i++) {
      if (parents[i].parent_desig === bomComp.parent_sequence) {
        return parents[i];
      }
    }
    return null;
  };

  ss.add = function(category, item) {
    var deferred = new $q.defer();

    // $$$$ category is in the parent item.
    VcRestService.selectItem(item.itemNum)
    .then(
      // success
      function(response) {
        // update the selections variable from the RestService saved
        //configuration property (also available here in the response, but
        //the rest service property is the single source of truth.)
        ss.selections = VcRestService.configuration.dsVCTables.dsVCTables.ttVCBomComps
        .map(ss.mapRestSelectionToSelection)
        .filter( // get rid of empty, undefined, or null values.
          function(selection) {
            if (typeof(selection) === 'undefined' || selection === null || selection === false || selection === "") {
              return false;
            } else {
              return true;
            }
          }
        );

        // update the total price
        ss.updateTotal();

        // resolve.
        deferred.resolve(response);
      },
      // error
      function(error) {
        deferred.resolve(error);
      }
    );

    return deferred.promise;
  };

  // This is going to have to come from the backend, as some places like to show prices and some don't.
  ss.updateTotal = function() {

    var wo = VcRestService.configuration.dsVCWoDrvr.dsVCWoDrvr.ttVCWoDrvr[0];
    ss.prices.totalPrice = wo.dExtendedNetPrice;
    ss.prices.totalPricePerUnit = wo.dNetPrice;
    ss.prices.totalPriceUom = wo.cQtyUomCode;
    ss.prices.totalPriceQuantity = wo.dQtyOrdered;
    return {
      "totalPrice": ss.prices.totalPrice,
      "totalPricePerUnit": ss.prices.totalPricePerUnit,
      "totalPriceUom": ss.prices.totalPriceUom,
      "totalPriceQuantity": ss.prices.totalPriceQuantity
    };
  };

  return ss;

}]);


angular.module('dmsiVc')
.factory("Utilities", [function() {

  var utils = {};

  /**
  Assigns the value of the first assignFronProps that has a value other than "" to assignToProp of the assignTo object.
  */
  utils.assignStringIfExists = function(assignTo, assignToProp, assignFrom, assignFromProps, defaultValue) {
    var valueAssigned;

    if (typeof(assignFromProps) === 'string') {
      var temp = Array();
      temp.push(assignFromProps);
    } else if (
      // it's an array
      Array.isArray(assignFromProps) &&
      // all elements are strings
      assignFromProps.reduce(function(prevTotal, currValue, currIndex, array) {
          if (typeof(currValue) === 'string') { return prevTotal + 0; }
          else { return prevTotal + 1; } }) === 0) {
      return undefined; // if it's not a string or array, we don't know what to do.
    }

    for (var i = 0; i < assignFromProps.length; i++) {
      if (assignFromProps[i] in assignFrom && assignFrom[assignFromProps[i]] !== "") {
        assignTo[assignToProp] = assignFrom[assignFromProps[i]];
        valueAssigned = true;
        break;
      }
    }

    if (valueAssigned === false) {
      assignTo[assignToProp] = defaultValue;
    }
  };

  return utils;
}]);
