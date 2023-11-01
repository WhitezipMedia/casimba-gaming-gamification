var ezugixlg = {
    websocket : null,
    wsUri : null,
    tableId : null,
    casinoId : null,
    tryToConnect : true,
    data: null,

    // public
    connect : function(wsUri, operatorId, vipLevel, currency) {
        var self = this;
        self.data = {
            "OperatorID": operatorId,
            "vipLevel": vipLevel,
            "SessionCurrency": currency
        };
        let data = {...self.data, ...{"MessageType": "InitializeSession"}}
        self.wsUri = wsUri;
        console.log('connecting to ' + 'wss://' + wsUri);
        if(self.websocket !== null && self.websocket.readyState !== 3){
            self.websocket.close();
            console.log('Socket open closing it');
        }
        self.websocket = new WebSocket('wss://' + wsUri);
        self.websocket.onopen = function(evt) {
            self.onWsOpen(data)
        };
        self.websocket.onclose = function(evt) {
            self.onWsClose(evt)
        };
        self.websocket.onmessage = function(evt) {
            console.log(evt);
            self.onWsMessage(evt)
        };
        self.websocket.onerror = function(evt) {
            self.onWsError(evt)
        };
    },
    // public
    onMessage : function(data) {
        // to fill
        console.log('recieved', data);
    },
    // public
    onConnect : function() {
        // to fill
    },
    // public
    disconnect : function() {
        var self = this;
        self.tryToConnect = false;
        self.websocket.close();
        console.log('Disconnected');
    },
    // public
    Auhtenticate : function() {
        self.data.MessageType = "AuthenticateSession";
        console.log('subscribing' + tableId);

        var self = this;
        // console.log('Subscribing ' + tableId);
        self.doWsSend(self.data);
    },

    // public
    available : function(casinoId) {
        var availableMessage = {
            type : 'available',
            casinoId : casinoId
        }
        console.log('checking availability');

        var self = this;
        // console.log('Subscribing ' + tableId);
        var jsonSub = JSON.stringify(availableMessage);
        self.doWsSend(jsonSub);
    },

    onWsOpen : function(data) {
        var self = this;

        // console.log(evt.data);
        if (self.onConnect != null) {
            self.onConnect();
        }

        self.doWsSend(data)

        console.log(data);
        if (self.tableId) {
            self.Auhtenticate()
        }
    },

    onWsClose : function(evt) {
        console.log("DISCONNECTED");
        var self = this;
        if (self.tryToConnect === true) {
            console.log("RECONNECTING");
            self.connect(self.wsUri, self.data.OperatorID, self.data.vipLevel, self.data.SessionCurrency);
        }
    },

    onWsMessage : function(evt) {
        var self = this;
        var data = JSON.parse(evt.data);
        // console.log(evt.data);
        if (self.onMessage != null) {
            self.onMessage(data);
        }
    },

    onWsError : function(evt) {
        console.log('ERROR: ' + evt.data);
    },

    ping : function() {
        var self = this;
        var pingMessage = {
            type : 'ping',
            pingTime : Date.now().toString()
        }
        var jsonSub = JSON.stringify(pingMessage);
        self.doWsSend(jsonSub);
    },

    doWsSend : function(message) {
        var self = this;
        console.log("SENT: " + message);
        self.websocket.send(message);
    }
};

var ezugidga=ezugixlg;
