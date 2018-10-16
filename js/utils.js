(function() {

var CharUtils = { };

var addMark = function(value, type) {
    if (!value) value = 0;
    return (value | (marks[type] || 32));
};

/* * * * * Public methods * * * * */

CharUtils.generateSearchParameters = function(query, filters) {
    if (/^\d+$/.test(query)) {
        var n = parseInt(query,10);
        if (n > 0 && n <= units.length) query = 'id=' + query;
    }
    var result = Utils.generateSearchParameters(query);
    if (result === null && Object.keys(filters).length === 0) return null;
    if (filters.class && filters.class.constructor != RegExp) filters.class = new RegExp(filters.class,'i');
    var temp = jQuery.extend({ },filters);
    temp.custom = [ ];
    if (filters.custom) {
        for (var i=0;i<filters.custom.length;++i) {
            if (filters.custom[i])
                temp.custom.push(window.matchers[i]);
        }
    }
    if (Object.keys(temp).length > 0 || temp.custom.length > 0) {
        if (!result) result = { };
        result.filters = temp;
    }
    return result;
};

CharUtils.searchEvolverEvolutions = function(id) {
    var result = { }, current = parseInt(id,10);
    for (var key in evolutions) {
        var paddedId = ('000' + key).slice(-4);
        if (!evolutions[key].evolution) continue;
        if (evolutions[key].evolvers.indexOf(current) != -1)
            result[paddedId] = (result[paddedId] || [ ]).concat([ evolutions[key].evolution ]);
        for (var i=0;i<evolutions[key].evolution.length;++i) {
            if (evolutions[key].evolvers[i].indexOf(current) != -1)
                result[paddedId] = (result[paddedId] || [ ]).concat([ evolutions[key].evolution[i] ]);
        }
    }
    return result;
};

CharUtils.getEvolversOfEvolution = function(from,to,withID) {
    if (!to) return [ ];
    from = parseInt(from,10);
    to = parseInt(to,10);
    if (evolutions[from].evolution == to) return evolutions[from].evolvers;
    if (!withID) return evolutions[from].evolvers[evolutions[from].evolution.indexOf(to)];
    for (var i=0;i<evolutions[from].evolution.length;++i) {
        if (evolutions[from].evolution[i] != to) continue;
        if (evolutions[from].evolvers[i].indexOf(withID) == -1) continue;
        return evolutions[from].evolvers[i];
    }
    return [ ];
};


CharUtils.getStatOfUnit = function(unit, stat, level) {
    var maxLevel = (unit.maxLevel == 1 ? 1 : unit.maxLevel -1);
    var minStat = 'min' + stat.toUpperCase(), maxStat = 'max' + stat.toUpperCase();
    var result = unit[minStat] + (unit[maxStat] - unit[minStat]) * Math.pow((level-1) / maxLevel);
    return Math.floor(result);
};

/***********
 * Caching *
 ***********/

var orbControllerCache = { }, regexCache = { }, classCache = { captain: { }, special: { }, sailor: { } };

CharUtils.getOrbControllerData = function(id) {
    if (orbControllerCache.hasOwnProperty(id) || !window.details[id] || !window.details[id].special)
        return (orbControllerCache[id] || null);
    var special = window.details[id].special;
    var data = (special.constructor != String ? JSON.stringify(special) : special);
    var match = data.match(/(changes.+?orbs into.+?orbs)/gi);
    if (!match) {
        orbControllerCache[id] = null;
        return null;
    }
    var result = { from: { }, to: { }, map: { } };
    match.forEach(function(match) {
        var n = match.indexOf(' into ');
        var from = match.slice(0,n).match(/\[(.+?)\]/gi);
        var to = match.slice(n + 6).match(/\[(.+?)\]/gi);
        if (from) {
            from = from.map(function(x) { return x.slice(1,-1); });
            from.forEach(function(x) { result.from[x] = true; });
        }
        if (to) {
            to = to.map(function(x) { return x.slice(1,-1); });
            to.forEach(function(x) { result.to[x] = true; });
        }
        if (from && to) {
            from.forEach(function(f) {
                if (!result.map[f]) result.map[f] = { };
                to.forEach(function(x) { result.map[f][x] = true; });
            });
        }
    });
    orbControllerCache[id] = result;
    return result;
};

CharUtils.checkMatcher = function(matcher, id) {
    var target = window.details[id][matcher.target], name = matcher.target + '.' + matcher.name, result;
    if (regexCache[name] && regexCache[name].hasOwnProperty(id)) return regexCache[name][id];
    else if (!target) result = false;
    else if (matcher.include && matcher.include.indexOf(id) != -1) result = true;
    else {
        if (target.constructor != String) target = JSON.stringify(target);
        result = matcher.matcher.test(target);
    }
    if (!regexCache.hasOwnProperty(name)) regexCache[name] = { };
    regexCache[name][id] = result;
    return result;
};

CharUtils.isClassBooster = function(target, id, clazz) {
    var data = window.details[id][target], result;
    if (!classCache[target].hasOwnProperty(clazz)) classCache[target][clazz] = { };
    if (classCache[target][clazz].hasOwnProperty(id)) return classCache[target][clazz][id];
    if (!data) result = false;
    else {
        if (data.constructor != String) data = JSON.stringify(data);
        result = (new RegExp('of.+' + clazz + '.+characters')).test(data);
    }
    classCache[target][clazz][id] = result;
    return result;
};

/******************
 * Initialization *
 ******************/

window.CharUtils = CharUtils;

})();
