ko.bindingHandlers.numeric = {
    preprocess: function (value, name, addCb) {
        addCb('live', value);
    },
    init: function (element, valueAccessor) {
        $(element).on("keydown", function (event) {
            // Allow: backspace, delete, tab, escape, and enter
            if (event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 ||
                // Allow: Ctrl+A
                (event.keyCode == 65 && event.ctrlKey === true) ||
                // Allow: . ,
                (event.keyCode == 188 || event.keyCode == 190 || event.keyCode == 110) ||
                // Allow: home, end, left, right
                (event.keyCode >= 35 && event.keyCode <= 39)) {
                // let it happen, don't do anything
                return;
            }
            else {
                // Ensure that it is a number and stop the keypress
                if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105)) {
                    event.preventDefault();
                }
            }
        });
    }
};

var raffle = (function () {
    'use strict';
    ko.punches.enableAll();
    var that = {};

    that.io = io.connect();

    that.io.on('notify', function (data) {
        that.vm.notifications.push(data);
    });

    that.io.on('time', function (data) {
        that.vm.time(data);
    });

    that.io.on('addEntryAdmin', function (data) {
        data.isWinner = ko.observable(data.isWinner || false);
        data.answer = ko.observable(data.answer || null);
        that.vm.entries.push(data);
    });

    that.io.on('reset', function (data) {
        that.vm.entries([]);
        that.vm.question('');
        that.vm.isShowWinners(false);
    });

    that.io.on('winner', function (data) {
        var first = that.vm.entries().first(function (item) {
            return item.userName === data;
        });
        if(first)
            first.isWinner(true);
    });


    that.io.on('showEntries', function (data) {
        that.vm.isShowEntries(data);
    });

    that.io.on('showWinners', function (data) {
        that.vm.isShowWinners(true);
    });

    that.io.on('showAll', function (data) {
        that.vm.isShowWinners(false);
    });

    that.io.on('init', function (data) {
        console.log('init', data);
        that.vm.isAuth(data.isAuth);
        that.vm.entries(data.entries.map(function (item) {
            item.isWinner = ko.observable(item.isWinner || false);
            item.answer = ko.observable(item.answer || null);
            return item;
        }));
        that.vm.isShowWinners(data.isShowWinners);
        that.vm.isShowEntries(data.isShowEntries);
        that.vm.loaded(true);
    });

    that.io.on('removeEntry', function (data) {
        that.vm.entries.removeAll(function (item) {
            return item.email === data.email;
        });
    });

    ko.bindingHandlers.live = {
        preprocess: function (value, name, addCb) {
            addCb('valueUpdate', "'afterkeydown'");
            addCb('value', value);
        }
    };

    that.vm = (new function () {
        var self = this;

        self.loaded = ko.observable(false);
        self.isAuth = ko.observable(false);

        self.numberOfWinners = ko.observable(1);
        self.acceptEntriesTime = ko.observable(1);
        self.time = ko.observable(0);

        self.entries = ko.observableArray([]);
        self.question = ko.observable();

        self.isShowWinners = ko.observable(false);
        self.isShowEntries = ko.observable(false);

        self.filtered = ko.computed(function () {
            var arr = self.entries();
            return ko.utils.arrayFilter(arr, function (item) {
                return !self.isShowWinners () || item.isWinner();
            }).sort(function(left, right) { return left.userName.toLowerCase() == right.userName.toLowerCase() ? 0 : (left.userName.toLowerCase() < right.userName.toLowerCase() ? -1 : 1) });
        });

        self.loginVm = ko.validatedObservable({
            email: ko.observable().extend({email: true, required: true}),
            password: ko.observable().extend({required: true})
        });

        self.notifications = ko.observableArray([]);

        self.removeNotification = function (d) {
            self.notifications.remove(d);
        };

        self.login = function () {
            if(self.loginVm.isValid()) {
                that.io.emit('login', ko.toJS(self.loginVm));
            }
        };

        self.selectWinners = function () {
            var n = parseInt(self.numberOfWinners());
            that.io.emit('endRaffle', n <= 0 ? 1 : n);
        };

        self.acceptEntries = function () {
            var n = parseInt(self.acceptEntriesTime());
            that.io.emit('acceptEntries', {time: (n <= 0 ? 1 : n), question: self.question()});
        };

        self.resetRaffle = function () {
            that.io.emit('reset');
        };

        self.showWinners = function () {
            that.io.emit('showWinners');
        };

        self.showEntries = function () {
            that.io.emit('showEntries', true);
        };

        self.hideEntries = function () {
            that.io.emit('showEntries', false);
        };

        self.showAll = function () {
            that.io.emit('showAll');
        };

        return self;
    });

    ko.applyBindings(that.vm);
    that.io.emit('ready', true);
    return that;
}());