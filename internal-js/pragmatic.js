import axios from 'axios';

const wsUri = "prelive-dga0.pragmaticplaylive.net/ws";

export default class Pragmatic {
    constructor(operator, currency = 'EUR', options = null){
        this.operatorId = operator;
        this.currency = currency;
        let defaultOptions = {
            tryToConnect: true,
            ui: {
                seats: {
                    show: true,
                    show_taken: true,
                    taken_color: '#ff0000',
                    available_color: '#008000',
                    class_identifier: 'seats'
                }
            },
        };
        this.options = {...defaultOptions, options};
        this.connectionTries = 1;
        this.tables = {
            internal: null,
            external: null,
            mix: [],
        };
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
        var self = this;
        let data = {
            "type":"available",
            "casinoId": self.operatorId
        };
        this.socket.send(JSON.stringify(data));
    }

    authenticate() {
    }

    async send(data){
        this.socket.send(JSON.stringify(data));
    }

    onOpen(evt) {
        var self = this;
        this.initialize();
    }

    onClose(evt) {
        if(this.options?.tryToConnect && this.connectionTries < 3) {
            this.connectionTries++;
            this.connect();
        }
    }

    async generateMixTables() {
        var self = this;
        self.tables.mix = [];
        console.log("IM here");
        for (const externalTable of self.tables.external) {
            let exists = self.tables.internal.some((internal) => {
                if (parseInt(internal.externalId) === parseInt(externalTable.TableId)) {
                    externalTable.gameId = internal.gameId;
                    return true;
                }
                return false;
            });
            if(exists) self.tables.mix.push(externalTable);
        }
    }

    async onMessage(evt) {
        var self = this;
        console.log(evt);
    }

    onError(evt) {
        console.log('Error WSS', evt.data);
    }

    refresh() {
    }
}
