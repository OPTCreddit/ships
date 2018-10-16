(function() {

var directives = { };
var filters = { };

var app = angular.module('unb');

/**************
 * Directives *
 **************/

directives.characterTable = function($rootScope, $timeout, $compile, $storage) {
    return {
		restrict: 'E',
		replace: true,
		template: '<table id="mainTable" class="table table-striped-column panel panel-default"></table>',
		link: function(scope, element, attrs) {
			var table = element.dataTable({
				iDisplayLength: $storage.get('unitsPerPage', 10),
				stateSave: true,
				data: scope.table.data,
				columns: scope.table.columns,
				rowCallback: function(row, data, index) {
					if (!row || row.hasAttribute('loaded')) return;
					var $row = $(row);
					if (!$row) return;
					// lazy thumbnails
					$row.find('[data-original]').each(function(n,x) {
						x.setAttribute('src',x.getAttribute('data-original'));
						x.removeAttribute('data-original');
					});
					var id = data[data.length - 1] + 1;

					// compile
					$compile($(row).contents())($rootScope);
					if (window.units[id - 1].preview) $(row).addClass('preview');
					else if (window.units[id - 1].incomplete) $(row).addClass('incomplete');
					row.setAttribute('loaded','true');
				},
				headerCallback : function(header) {
					if (header.hasAttribute('loaded')) return;
					header.cells[header.cells.length - 1].setAttribute('title', 'Character Log');
					header.setAttribute('loaded',true);
				}
			});
			scope.table.refresh = function() {
				$rootScope.$emit('table.refresh');
				$timeout(function() { element.fnDraw(); });
			};
            // report link
            var link = $('<span class="help-link">If you find any incorrect info or bugs, please <a>send me a message on reddit</a></span>');
            link.find('a').attr('href', 'https://www.reddit.com/message/compose/?to=antonlabz&subject=units_db');
            link.insertAfter($('.dataTables_length'));
            // night toggle
            var nightToggle = $('<label class="night-toggle"><input type="checkbox">Night mode</input></label>');
            nightToggle.find('input').change(function(e) {
                $rootScope.nightMode = e.target.checked;
                if (!$rootScope.$$phase) $rootScope.$apply();
            });
            if ($rootScope.nightMode) nightToggle.find('input').attr('checked', 'checked');
            nightToggle.insertBefore($('.dataTables_length'));
        }
    };
};

//modal full art and scrolls
directives.decorateSlot = function() {
    return {
        restrict: 'A',
        scope: { uid: '=', big: '@' },
        link: function(scope, element, attrs) {
            if (scope.big)
                element[0].style.backgroundImage = 'url(' + Utils.getBigThumbnailUrl(scope.uid) + ')';
            else
                element[0].style.backgroundImage = 'url(' + Utils.getScroll(scope.uid) + ')';
        }
    };
};

//modal 'evolves to'
directives.decorateSlot2 = function() {
    return {
        restrict: 'A',
        scope: { uid: '='},
        link: function(scope, element, attrs) {
                element[0].style.backgroundImage = 'url(' + Utils.getThumbnailUrl(scope.uid) + ')';
        }
    };
};

directives.autoFocus = function($timeout) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			$timeout(function(){ element[0].focus(); });
		}
	};
};

directives.addSailorOptions = function($timeout, $compile, MATCHER_IDS) {
    //TO DO ONCE WE FIND OUT WHAT SAILOR ABILITIES DO ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    var TARGET = MATCHER_IDS['sailor.ClassBoostingSailors'];
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            if (scope.n !== TARGET) return;
            var filter = $('<div id="class-filters" ng-class="{ enabled: filters.custom[' + TARGET + '] }"></div>');
            var classes = [ 'Fighter', 'Shooter', 'Slasher', 'Striker', 'Free Spirit', 'Cerebral', 'Powerhouse', 'Driven' ];
            classes.forEach(function(x,n) {
                var template = '<span class="filter subclass %c" ng-class="{ active: filters.classSailor == \'%s\' }" ' +
                    'ng-click="onSailorClick($event,\'%s\')">%s</span>';
                filter.append($(template.replace(/%s/g,x).replace(/%c/,'width-6')));
            });
            element.after(filter);
            $compile(filter)(scope);
            scope.onSailorClick = function(e,type) {
                scope.filters.classSailor = (scope.filters.classSailor == type ? null : type);
            };
        }
    };
};

directives.addSpecialOptions = function($timeout, $compile, MATCHER_IDS) {
    var TARGET = MATCHER_IDS['special.ClassBoostingSpecials'];
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            if (scope.n !== TARGET) return;
            var filter = $('<div id="class-filters" ng-class="{ enabled: filters.custom[' + TARGET + '] }"></div>');
            var classes = [ 'Fighter', 'Shooter', 'Slasher', 'Striker', 'Free Spirit', 'Cerebral', 'Powerhouse', 'Driven' ];
            classes.forEach(function(x,n) {
                var template = '<span class="filter subclass %c" ng-class="{ active: filters.classSpecial == \'%s\' }" ' +
                    'ng-click="onSpecialClick($event,\'%s\')">%s</span>';
                filter.append($(template.replace(/%s/g,x).replace(/%c/,'width-6')));
            });
            element.after(filter);
            $compile(filter)(scope);
            scope.onSpecialClick = function(e,type) {
                scope.filters.classSpecial = (scope.filters.classSpecial == type ? null : type);
            };
        }
    };
};

directives.addOrbOptions = function($timeout, $compile, MATCHER_IDS) {
    var TARGET = MATCHER_IDS['special.OrbControllers'];
    return {
        restrict: 'A',
        link: function(scope,element,attrs) {
            if (scope.n !== TARGET) return;
            var orbs = { ctrlFrom: [ ], ctrlTo: [ ] };
            var filter = $('<div id="controllers" ng-class="{ enabled: filters.custom[' + TARGET + '] }">' +
                    '<span class="separator">&darr;</span></div>');
            var separator = filter.find('.separator');
            [ 'STR', 'DEX', 'QCK', 'PSY', 'INT', 'RCV', 'TND', 'BLOCK', 'EMPTY', 'BOMB', 'G' ].forEach(function(type) {
                var template = '<span class="filter orb %s" ng-class="{ active: filters.%f.indexOf(\'%s\') > -1 }" ' +
                    'ng-model="filters.%f" ng-click="onOrbClick($event,\'%s\')">%S</span>';
                separator.before($(template.replace(/%s/g,type).replace(/%S/g,type[0]).replace(/%f/g,'ctrlFrom')));
                filter.append($(template.replace(/%s/g,type).replace(/%S/g,type[0]).replace(/%f/g,'ctrlTo')));
            });
            element.after(filter);
            $compile(filter)(scope);
            scope.onOrbClick = function(e,type) {
                var target = e.target.getAttribute('ng-model');
                if (!target) return;
                target = target.match(/filters\.(.+)$/)[1];
                if (orbs[target].indexOf(type) == -1) orbs[target].push(type);
                else orbs[target].splice(orbs[target].indexOf(type), 1);
                orbs[target] = orbs[target].slice(-2);
                scope.filters[target] = orbs[target];
            };
        }
    };
};

directives.addDebuffOptions = function($timeout, $compile, MATCHER_IDS) {
    var TARGET = MATCHER_IDS['special.DebuffReducingSpecials'];
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            if (scope.n !== TARGET) return;
            var filter = $('<div id="debuff" ng-class="{ enabled: filters.custom[' + TARGET + '] }"></div>');
            var debuffs = [ 'Bind', 'Despair', 'Silence', 'Paralysis', 'Blindness', 'Poison', 'Anti-Healing', 'Chain Limit' ];
            debuffs.forEach(function(x,n) {
                var template = '<span class="filter debuff %c" ng-class="{ active: filters.debuffs == \'%s\' }" ' +
                    'ng-click="onDebuffClick($event,\'%s\')">%s</span>';
                filter.append($(template.replace(/%s/g,x).replace(/%c/,'width-6')));
            });
            element.after(filter);
            $compile(filter)(scope);
            scope.onDebuffClick = function(e,type) {
                //console.log(scope.filters.debuffs);
                scope.filters.debuffs = (scope.filters.debuffs == type ? null : type);
            };
        }
    };
};

directives.goBack = function($state) {
	return {
		restrict: 'A',
        link: function(scope, element, attrs) {
            element.click(function(e) {
                if (!e.target || e.target.className.indexOf('inner-container') == -1) return;
                element.find('.modal-content').addClass('rollOut');
                $('.backdrop').addClass('closing');
                setTimeout(function() { $state.go('^'); },300);
            });
        }
    };
};

directives.evolution = function($state, $stateParams) {
    return {
        restrict: 'E',
        replace: true,
        scope: { unit: '=', base: '=', evolvers: '=', evolution: '=', size: '@' },
        templateUrl: 'views/evolution.html',
        link: function(scope, element, attrs) {
            scope.goToState = function(id) {
                if (!Number.isInteger(id)) return;
                if (id == parseInt($stateParams.id,10)) return;
                var previous = $stateParams.previous.concat([ $stateParams.id ]);
                $state.go('main.search.view',{ id: id, previous: previous });
            };
        }
    };
};

directives.unit = function($state, $stateParams) {
    return {
        restrict: 'E',
        scope: { uid: '=' },
        template: '<a class="slot medium" decorate-slot uid="uid" ng-click="goToState(uid)"></a>',
        link: function(scope, element, attrs) {
            scope.goToState = function(id) {
                if (id == parseInt($stateParams.id,10)) return;
                var previous = $stateParams.previous.concat([ $stateParams.id ]);
                $state.go('main.search.view',{ id: id, previous: previous });
            };
        }
    };

};

directives.addNames = function($stateParams, $rootScope) {
    var name = window.aliases;
    return {
        restrict: 'E',
        replace: true,
        template: '<table class="table table-striped-column abilities"><tbody></tbody></table>',
        link: function(scope, element, attrs) {
            var id = $stateParams.id, data = details[id];

                var currentAliases = name[id];
                if(typeof currentAliases != 'undefined'){
                    var otherAliases = currentAliases.toString().replace(/(.*?), (.*?),/,"");
                    element.append($('<tr><td>'+ otherAliases +'</td></tr>'));
                }
                }
    }
};

directives.addTags = function($stateParams, $rootScope) {
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="tag-container"></div>',
        link: function(scope, element, attrs) {
            var id = $stateParams.id, data = details[id];
            // flags
            var flags = window.flags[id] || { };
            element.append($('<span class="tag flag">' + (flags.global ? 'Global unit' : 'Japan unit') + '</div>'));
            if (flags.rr) element.append($('<span class="tag flag">Rare Recruit only</div>'));
            if (flags.lrr) element.append($('<span class="tag flag">Limited Rare Recruit only</div>'));
            if (flags.promo) element.append($('<span class="tag flag">Promo-code only</div>'));
            if (flags.shop) element.append($('<span class="tag flag">Rayleigh Shop Unit</div>'));
            if (flags.special) element.append($('<span class="tag flag">One time only characters</div>'));
            // matchers
            if (!data) return;
            matchers.forEach(function(matcher) {
                var name;
                // sailor effects
                if (matcher.target.indexOf('sailor') === 0 && !(data[matcher.target] === undefined)) {
                    if (data[matcher.target].base){
                        for (var sailor in data[matcher.target]){
                            if (matcher.matcher.test(data[matcher.target][sailor])){
                                name = matcher.name;
                                if (!/sailor$/.test(name)) name = name.replace(/ers$/,'ing').replace(/s$/,'') + ' sailor';
                                else name = name.replace(/s$/,'');
                                name = name.replace(/iing/,'ying');
                                element.append($('<span class="tag sailor">' + name + '</div>'));
                            }
                        }
                    }
                    else{
                        if (matcher.matcher.test(data[matcher.target])){
                            name = matcher.name;
                            if (!/sailor$/.test(name)) name = name.replace(/ers$/,'ing').replace(/s$/,'') + ' sailor';
                            else name = name.replace(/s$/,'');
                            name = name.replace(/iing/,'ying');
                            element.append($('<span class="tag sailor">' + name + '</div>'));
                        }
                    }
                }
                // specials
                if (matcher.target.indexOf('special') === 0 && matcher.matcher.test(data[matcher.target])) {
                    name = matcher.name;
                    if (!/specials$/.test(name)) name = name.replace(/ers$/,'ing').replace(/s$/,'') + ' special';
                    else name = name.replace(/s$/,'');
                    name = name.replace(/iing/,'ying');
                    element.append($('<span class="tag special">' + name + '</div>'));
                }
                // limit
                if (matcher.target.indexOf('limit') === 0 && matcher.matcher.test(data[matcher.target])) {
                    name = matcher.name;
                    if (!/limit$/.test(name)) name = name.replace(/ers$/,'ing').replace(/s$/,'') + ' limit';
                    else name = name.replace(/s$/,'');
                    name = name.replace(/iing/,'ying');
                    if (name != "Has Limit Break limit"){
                        element.append($('<span class="tag limit">' + name + '</div>'));
                    }
                }
            });
        }
    };
};

directives.costSlider = function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.ionRangeSlider({
                grid: true,
                type: 'double',
                min: scope.filters.cost[0],
                max: scope.filters.cost[1],
                from: scope.filters.cost[0],
                to: scope.filters.cost[1],
                postfix: ' cost',
                onFinish: function(data) {
                    scope.filters.cost[0] = data.from;
                    scope.filters.cost[1] = data.to;
                    if (!scope.$$phase) scope.$apply();
                }
            });
        }
    };
};

/******************
 * Initialization *
 ******************/

for (var directive in directives)
    app.directive(directive, directives[directive]);

for (var filter in filters)
    app.filter(filter, filters[filter]);

})();
