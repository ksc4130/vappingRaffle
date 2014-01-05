var mere = mere || {};
(function () {
    'use strict';


    var _arrayFirst = function (pred) {
        if((!Array.isArray(this) || !this.length)) {
            console.error('mere.arrayFirst\'s first param must be an array');
            return null;
        }
        pred = pred || function () {return true;};
        var found = null;
        for(var i = 0, il = this.length; i < il; i++) {
            found = (function (i) {
                if(pred(this[i])) {
                    return this[i];
                }
            }.call(this, i));
            if (!!found) {
                return found;
            }
        }
        return found;
    };

    mere.arrayFirst = function (array, pred) {
        return _arrayFirst.call(array, pred);
    };

    if(!Array.prototype.first) {
        Array.prototype.first = _arrayFirst;
//	Array.prototype.first = function (pred) {
//		pred = pred || function () {return true;};
//		var found;
//		for(var i = 0, il = this.length; i < il; i++) {
//			found = (function (i) {
//				if(pred(this[i])) {
//					return this[i];
//				}
//			}.call(this, i));
//			if (!!found) {
//				return found;
//			}
//		}
//	};
    }

    if(!Array.prototype.any) {
        Array.prototype.any = function (pred) {
            pred = pred || function () {return true;};
            var found = false;
            for(var i = 0, il = this.length; i < il; i++) {
                found = (function (i) {
                    if(pred(this[i])) {
                        return true;
                    }
                    return false;
                }.call(this, i));
                if (found) {
                    return found;
                }
            }
        };
    }

    if(!Array.prototype.howMany) {
        Array.prototype.howMany = function (pred) {
            pred = pred || function () {return true;};
            var found = false,
                cnt = 0;
            for(var i = 0, il = this.length; i < il; i++) {
                found = (function (i) {
                    if(pred(this[i])) {
                        return true;
                    }
                    return false;
                }.call(this, i));
                if (found) {
                    cnt++;
                }
            }
            return cnt;
        };
    }

    if(!Array.prototype.firstIndex) {
        Array.prototype.firstIndex = function (pred) {
            pred = pred || function () {return true;};
            var found,
                index;
            for(var i = 0, il = this.length; i < il; i++) {
                found = (function (i) {
                    if(pred(this[i])) {
                        index = i;
                        return true;
                    }
                    return false;
                }.call(this, i));
                if (found) {
                    return index;
                }
            }
        };
    }

    if(!Array.prototype.last) {
        Array.prototype.last = function (pred) {
            pred = pred || function () {return true;};
            var found;
            for(var i = (this.length-1); i >= 0; i--) {
                found = (function (i) {
                    if(pred(this[i])) {
                        return this[i];
                    }
                }.call(this, i));
                if (!!found) {
                    return found;
                }
            }
        };
    }

    if(!Array.prototype.lastIndex) {
        Array.prototype.lastIndex = function (pred) {
            pred = pred || function () {return true;};
            var found = false,
                index;
            for(var i = (this.length-1); i >= 0; i--) {
                found = (function (i) {
                    if(pred(this[i])) {
                        index = i;
                        return true;
                    }
                    return false;
                }.call(this, i));
                if (found) {
                    return index;
                }
            }
        };
    }

    if(!Array.prototype.removeFirst) {
        Array.prototype.removeFirst = function (pred) {
            pred = pred || function () {return true;};
            var found = false,
                index;
            for(var i = (this.length-1); i >= 0; i--) {
                found = (function (i) {
                    if(pred(this[i])) {
                        index = i;
                        return true;
                    }
                    return false;
                }.call(this, i));
                if (found) {
                    return this.splice(index, 1);
                }
            }
        };
    }

    if(!Array.prototype.removeAll) {
        Array.prototype.removeAll = function (pred) {
            pred = pred || function () {return true;};
            var found = false,
                index;
            for(var i = (this.length-1); i >= 0; i--) {
                found = (function (i) {
                    if(pred(this[i])) {
                        index = i;
                        return true;
                    }
                    return false;
                }.call(this, i));
                if (found) {
                    this.splice(index, 1);
                    return this.removeAll.call(this, pred);
                }
            }
        };
    }
}());