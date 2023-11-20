import axios from 'axios';

const wsUri = "dga.pragmaticplaylive.net/ws";

export default class Pragmatic {
    constructor(operator, currency = 'EUR', options = null){
        this.operator = operator;
        this.operatorId = null;
        this.currency = currency;
        let defaultOptions = {
            tryToConnect: true,
            class_dealer_name: 'cgdealer',
            ui: {
                seats: {
                    show: true,
                    show_icons_max: 8,
                    show_taken: true,
                    taken_class: 'cgtaken',
                    available_class: 'cgavailable',
                    class_identifier: 'cgseats'
                },
                limits: {
                    show: false,
                    class_min_bet: 'cgminbet',
                    class_max_bet: 'cgmaxbet',
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
        this.subscribedTables = [];
        this.connect();
        this.addTimers();
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
        let postData = {
            "operatorId" : self.operator,
            "provider" : "pragmatic"
        };
        if(self.tables.internal === null){
            axios.post('https://qa-gameplay-api.casimbagaming.com/games-connect/api/v1/liveTableDetails', postData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then((response) => {
                // self.operatorId = response.data.operatorId;
                self.operatorId = 'ppcgi00000000295';
                self.tables.internal = response.data.games;
                let data = {
                    "type":"available",
                    "casinoId": self.operatorId
                };
                self.send(data);
            }).catch(e => {
                console.log(e);
            });
        } else {
            let data = {
                "type":"available",
                "casinoId": self.operatorId
            };
            self.send(data);
        }
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
        for (const internal of self.tables.internal) {
            if(self.tables.external.includes(internal.externalId)) {
                self.tables.mix.push(internal)
            }
        }
    }

    async onMessage(evt) {
        var self = this;
        if(!evt.data) return;
        try {
            let response = JSON.parse(evt.data);
            if(response.tableKey && self.tables.mix.length === 0) {
                self.tables.external = response.tableKey;
                await self.generateMixTables();
            }
            else if(response.tableId && self.tables.mix.length > 0) {
                self.onRegisterTableMessageRecieved(response);
            }
        } catch (e) {
            console.log('Error on message', e);
            return false;
        }
    }

    onError(evt) {
        console.log('Error WSS', evt.data);
    }

    addDomAttributeToTrack() {
        var self = this;
        self.tables.mix.forEach((game) => {
           document.querySelectorAll('[data-gameCode="'+game.gameId+'"]').forEach((element) => {
               if(!element.hasAttribute('data-cgtrack')) element.setAttribute('data-cgtrack', game.externalId);
           })
        });
        self.suscribeToTables();
    }

    suscribeToTables() {
        var self = this;
        document.querySelectorAll('[data-cgtrack]').forEach((element) => {
            let tableId = element.getAttribute('data-cgtrack');
            if(self.subscribedTables.includes(tableId)) return;
            self.subscribedTables.push(tableId);
            let data = {
                "type":"subscribe",
                "casinoId": self.operatorId,
                "key": tableId,
                "currency": self.currency
            };
            self.send(data);
        });
    }

    addTimers() {
        var self = this;
        setInterval(self.addDomAttributeToTrack.bind(self), 4000);
    }

    onRegisterTableMessageRecieved(data) {
        var self = this;
        document.querySelectorAll('[data-cgtrack="'+data.tableId+'"]').forEach((element) => {
            if(self.ui?.seats?.show && data.totalSeatedPlayers) {
                let seats = Object.keys(data).filter(e => e.startsWith('seat'));
                self.manageSeats(seats, element);
            }
        });
    }

    manageSeats(seats, element) {
        console.log(seats);
    }
}
