import axios from 'axios';

const wsUri = "engineint.tableslive.com/GameServer/gameNotifications";

export default class Ezugi {
    constructor(operatorId, vipLevel = 0, currency = 'EUR', options = null){
        this.operatorId = operatorId;
        this.vipLevel = vipLevel;
        this.currency = currency;
        this.options = {
            tryToConnect: false
        };
        this.connectionTries = 1;
        this.connect();
    };

    connect() {
        var self = this;
        this.socket = new WebSocket("wss://"+wsUri);
        this.socket.onmessage = function (evt) {self.onMessage(evt)};
        this.socket.onopen = function (evt) {self.onOpen(evt)};
        this.socket.onclose = function (evt) {self.onClose(evt)};
        this.socket.onerror = function (evt) {self.onError(evt)};
    }

    async initialize() {
        let data = {
            "MessageType": "InitializeSession",
            "OperatorID": self.operatorId,
            "vipLevel": self.vipLevel,
            "SessionCurrency": self.currency,
        };
        this.send(JSON.stringify(data));
    }

    authenticate() {
        var self = this;
        axios.get('https://fecmsapi.casimbagaming.com/check').then((response) => {
            let data = {
                "MessageType": "AuthenticateSession",
                "OperatorID": self.operatorId,
                "vipLevel": self.vipLevel,
                "SessionCurrency": self.currency,
                "Token": response.data
            };
            this.send(data);
        });
    }

    send(data){
        this.socket.send(JSON.stringify(data));
    }

    onOpen(evt) {
        var self = this;
        this.initialize().then(() => {
            self.authenticate();
        });
    }

    onClose(evt) {
        if(this.options?.tryToConnect && this.connectionTries < 5) {
            this.connectionTries++;
            this.connect();
        }
    }

    onMessage(evt) {

    }

    onError(evt) {
        console.log('Error WSS', evt.data);
    }
}
