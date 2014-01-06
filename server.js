require('./public/scripts/arrayUtils.js');
var util = require('util')
    , globals = require('./globals')
    , express = require('express.io')
    , app = express().http().io()
    , entries = []
    , adminEmail = 'test@test.com'
    , adminPassword = 'test'
    , admins = []
    , isEnding = false
    , isShowEntries = false
    , isShowWinners = false
    , curTime = 0
    , timerId
    , isAccepting = false;

// Setup your sessions, just like normal.
app.use(express.cookieParser());
//app.use(express.cookieSession({secret: globals.secret}));
app.use(express.session({secret: globals.secret}));
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.use(express.directory('/public'))
app.use(express.static(__dirname + '/public'));

// Session is automatically setup on initial request.
app.get('/', function(req, res) {
    req.session.isAuth = false;
    res.render('index.html');
});

app.get('/admin', function(req, res) {
    req.session.save(function() {
        res.render('admin.html');
    });
});

app.io.route('login', function(req) {
    var address = req.io.socket.handshake.address.address
        , email = req.data.email
        , password = req.data.password
        , isAuth = email === adminEmail && adminPassword === password;

    req.session.isAuth = isAuth;
    req.session.email = email;
    if(isAuth) {
        //admins.push(req.io.socket);
        req.io.join('admins');
//        req.io.socket.once('disconnect', function () {
//            admins.removeAll(function (item) {
//                return item.id === req.io.socket.id;
//            });
//        });
    }

    req.session.save(function() {
        req.io.emit('init', {isAuth: isAuth, entries: isAuth ? entries : [], isShowEntries: isShowEntries, isShowWinners: isShowWinners});
    });
});

app.io.route('endRaffle', function (req) {
    if(isEnding)
        return;
    if(!req.session.isAuth) {
        req.io.socket.emit('notify', cleanNotifictaion({isError: true, msg: 'Sorry you can\'t do that.'}));
        return;
    }
    if(entries.length <= 0) {
        req.io.socket.emit('notify', cleanNotifictaion({isError: true, msg: 'Sorry there are no entries to win.'}));
        return;
    }
    isEnding = true;

    var people = []
        , winners = [];
    entries.forEach(function (item) {
        if(!item.isWinner)
            people.push(item);
    });

    req.data = req.data <= people.length ? req.data : people.length;

    for(var i = 0; i < req.data; i++) {
        (function () {
           var winner
               , winningIndex = Math.floor((Math.random()*(people.length - 1))+1) - 1;
            console.log('winner', winningIndex, people[winningIndex]);
            winner = people[winningIndex];

            winner.isWinner = true;
            winners.push(winner);
            people.removeAll(function (item) {
                return item.email === winner.email;
            });
        }());
    }
    winners.forEach(function (item) {
        req.io.broadcast('winner', item.userName);
    });

    isEnding = false;
});

app.io.route('acceptEntries', function (req) {
    if(!req.session.isAuth) {
        req.io.socket.emit('notify', cleanNotifictaion({isError: true, msg: 'Sorry you can\'t do that.'}));
        return;
    }

    startTimer(req.data.time);
    req.io.broadcast('acceptEntries', {time: req.data.time, question: req.data.question});
});

app.io.route('reset', function (req) {
    if(!req.session.isAuth) {
        req.io.socket.emit('notify', cleanNotifictaion({isError: true, msg: 'Sorry you can\'t do that.'}));
        return;
    }

    resetRaffle();
});

app.io.route('showEntries', function (req) {
    if(!req.session.isAuth) {
        req.io.socket.emit('notify', cleanNotifictaion({isError: true, msg: 'Sorry you can\'t do that.'}));
        return;
    }
    console.log('show entries', req.data);
    isShowEntries = req.data;
    app.io.broadcast('showEntries', req.data);
});

app.io.route('showWinners', function (req) {
    if(!req.session.isAuth) {
        req.io.socket.emit('notify', cleanNotifictaion({isError: true, msg: 'Sorry you can\'t do that.'}));
        return;
    }
    isShowWinners = true;
    app.io.broadcast('showWinners');
});

app.io.route('showAll', function (req) {
    if(!req.session.isAuth) {
        req.io.socket.emit('notify', cleanNotifictaion({isError: true, msg: 'Sorry you can\'t do that.'}));
        return;
    }
    isShowWinners = false;
    app.io.broadcast('showAll');
});


app.io.route('ready', function(req) {
    var address = req.io.socket.handshake.address.address
        , email = req.session.email,
        entry;
    if(email) {
       entry = entries.first(function (item) {
            return item.email === email || item.address === address;
       });
    }

    console.log('ready', req.data, req.session.isAuth);

    var cleaned = [];
    if(req.data) {
        if(req.session.isAuth) {
            cleaned = entries;
        }
    } else {
        cleaned = entries.map(function (item) {
            return cleanEntry(item);
        });
    }

    req.session.save(function() {
        req.io.emit('init', {
            isAccepting: isAccepting,
            isAuth: req.session.isAuth,
            entries: cleaned,
            email: entry ? entry.email : null,
            isShowEntries: isShowEntries,
            isShowWinners: isShowWinners,
            userName: entry ? entry.userName : null
        });
    });
});

app.io.route('register', function(req) {
    var entry = {
            email: req.data.email,
            userName: req.data.userName,
            answer: req.data.answer,
            address: req.io.socket.handshake.address.address
        },
        dupCheck = entries.any(function (item) {
            var toReturn = item.email === entry.email || item.userName === entry.userName || item.address === entry.address;
//            if(item.address === entry.address) {
//                req.io.emit('notify', {isError: true, msg: 'Your i.p. address already has an entry.'});
//            } else
            if (toReturn) {
                req.io.emit('notify', cleanNotifictaion({isError: true, msg: 'You already have an entry.'}));
            }
       return toReturn;
    });

    if(dupCheck) {
        //already has entry
        console.log('dup entry', entry);
        return;
    } else {
        entries.push(entry);

        req.io.room('admins').broadcast('addEntryAdmin', entry);
        req.io.broadcast('addEntry', cleanEntry(entry));
        req.io.emit('addEntry', cleanEntry(entry));

        req.session.userName = entry.userName;
        req.session.email = entry.email;
    }


    req.session.save(function() {
        //req.io.emit('init', {entries: entries});
    });
});

app.listen(4000);

function cleanEntry(entry) {
    return {
        userName: entry.userName,
        isWinner: entry.isWinner
    };
}

function cleanNotifictaion (notifictaion) {
    return {
        isError: notifictaion.isError || false,
        isSuccess: notifictaion.isSuccess || false,
        msg: notifictaion.msg || ''
    }
}

function startTimer(time) {
    curTime = time;
    isAccepting = true;
    app.io.broadcast('time', curTime);
    timerId = setInterval(function () {
        curTime--;
        app.io.broadcast('time', curTime);
        if(curTime === 0) {
            clearInterval(timerId);
            isAccepting = false;
            timerId = null;
            app.io.broadcast('stopAccepting');
        }
    }, 1000);
}

function resetRaffle() {
    curTime = 0;

    if(isAccepting)
        app.io.broadcast('stopAccepting');

    isAccepting = false;
    if(timerId)
        clearInterval(timerId);

    entries = [];
    app.io.broadcast('reset');
}