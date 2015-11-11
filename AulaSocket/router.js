var CONNECTION_MANAGER = function (connection, ctx) {
    var events = [];
    var permissions = {};
    var router = this;

    connection.on('message', function (message) {
        if (message.type === 'utf8')
            dispatch(JSON.parse(message.utf8Data));
    });

    connection.on('close', function (data) {
        for (var i = 0; i < events.length; i++)
            if (events [i].n == 'close') events [i].fn (data);
    });

    var dispatch = function (data) {
        var run = [];

        for (var i = 0; i < events.length; i++) {
            if (events [i].n.exec(data.route)) {
                if (events [i].fn instanceof Array) 
                    for (var j = 0; j < events [i].fn.length; j++)
                        run.push(events [i].fn [j].bind (ctx));
                else
                    run.push(events [i].fn.bind (ctx));
            }
        }

        runner (run, data.data);
    }

    var runner = function (run, data) {
        try {
            for (var i = 0; i < run.length; i++) {
                run [i] (data);
            }    
        } catch (e) {
            router.error (ctx.eHandler.error (e));
        }
    }

    var routify = function (n) {
        return new RegExp('^' + n
            .replace (/\/\*/g, '*')
            .replace (/\*/g, '.*')
            .replace (/\//g, '\\/') + '$', '');
    }

    this.on = function (n, fn) {
        events.push ({n: routify(n), fn: fn});
    }

    this.intercept = function (n, fn) {
        events.push ({n: routify(n), fn: fn});
    }

    this.send = function (d, clb) {
        try {
            connection.send( JSON.stringify(d), function (err) {
                if (err) console.log (err);
                if (clb) clb ();
            });
        } catch (err) {
            console.log (err);
        }
    }

    this.error = function (error) {
        this.send ({ route: CONSTANTS.EP.ERROR, data: error });
    }

    this.userHasPermissionOnBuilding = function (user_token, building_id) {
        if (typeof permissions.building == CONSTANTS.UNDEFINED)
            permissions.building = AUTHENTICATOR.userBuildingPermission (user_token, building_id);

        return permissions.building;
    }

    this.userHasPermission = function (user_token) {
        if (typeof permissions.user == CONSTANTS.UNDEFINED && user_token) {
            permissions.user = AUTHENTICATOR.userPermissions (user_token);
        }

        return permissions.user;
    }

    this.getConnection = function () {
        return connection;
    }

}

module.exports = CONNECTION_MANAGER;