var raffle = (function () {
    'use strict';
    ko.punches.enableAll();
    var that = {};

    that.io = io.connect();

    that.io.on('notify', function (data) {
       that.vm.notifications.push(data);
    });

    that.io.on('addEntry', function (data) {
        data.isWinner = ko.observable(data.isWinner);
       that.vm.entries.push(data);
    });

    that.io.on('init', function (data) {
       that.vm.entries(data.entries.map(function (item) {
           item.isWinner = ko.observable(item.isWinner);
           return item;
       }));
        that.vm.loaded(true);
        that.vm.isAccepting(data.isAccepting || false);
        that.vm.question(data.question || '');
    });

    that.io.on('acceptEntries', function (data) {
        that.vm.isAccepting(true);
        that.vm.question(data.question);
        that.vm.time(data.time);
    });

    that.io.on('reset', function (data) {
        that.vm.entries([]);
        that.vm.regVm().answer(null);
        that.vm.question('');
        that.vm.isShowWinners(false);
    });

    that.io.on('time', function (data) {
        that.vm.time(data);
    });

    that.io.on('showWinners', function (data) {
        that.vm.isShowWinners(true);
    });

    that.io.on('showAll', function (data) {
        that.vm.isShowWinners(false);
    });

    that.io.on('stopAccepting', function (data) {
        that.vm.isAccepting(false);
    });

    that.io.on('winner', function (data) {
        var first = that.vm.entries().first(function (item) {
            return item.userName === data;
        });
        if(first)
            first.isWinner(true);
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

        self.question = ko.observable();
        self.isAccepting = ko.observable(false);
        self.time = ko.observable(0);

        self.regVm = ko.validatedObservable({
            isReg: ko.observable(false),
            email: ko.observable().extend({email: true, required: true}),
            userName: ko.observable().extend({required: true}),
            answer: ko.observable()
        });

        self.entries = ko.observableArray([]);

        self.isShowWinners = ko.observable(false);

        self.filtered = ko.computed(function () {
            var arr = self.entries();
            return ko.utils.arrayFilter(arr, function (item) {
                return !self.isShowWinners () || item.isWinner();
            });
        });

        self.notifications = ko.observableArray([]);

        self.removeNotification = function (d) {
            self.notifications.remove(d);
        };

        self.register = function () {
            if(self.regVm.isValid()) {
                that.io.emit('register', ko.toJS(self.regVm));
            }
        };
    });

    ko.applyBindings(that.vm);
    that.io.emit('ready');
    return that;
}());