import axios from 'axios';

const wsUri = "engineint.tableslive.com/GameServer/gameNotifications";

export default class Ezugi {
    constructor(operator, vipLevel = 0, currency = 'EUR', options = null){
        this.operator = operator;
        this.operatorId = null;
        this.vipLevel = vipLevel;
        this.currency = currency;
        let defaultOptions = {
            tryToConnect: false,
            ui: {
                seats: {
                    show: true,
                    show_taken: true,
                    show_dealer: false,
                    taken_color: '#ff0000',
                    available_color: '#008000',
                    dealer_color: '#FFBF00',
                    class_identifier: 'seats'
                }
            },
        };
        this.options = {...defaultOptions, options};
        this.connectionTries = 3;
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
        let postData = {
            "operatorId" : self.operator,
            "provider" : "ezugi"
        };
        axios.post('https://qa-gameplay-api.casimbagaming.com/games-connect/api/v1/liveTableDetails', postData, {
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((response) => {
            // self.operatorId = response.data.operatorId;
            self.operatorId = 10552002;
            self.tables.internal = response.data.games;
            console.log(response);
            let data = {
                "MessageType": "InitializeSession",
                "OperatorID": self.operatorId,
                "vipLevel": self.vipLevel,
                "SessionCurrency": self.currency,
            };
            this.send(data).then(() => {
                setTimeout(() => this.authenticate(), 300);
            });
        });
    }

    authenticate() {
        var self = this;
        axios.get('https://fecmsapi.casimbagaming.com/api/check',{}).then((response) => {
            console.log(response.data.Token);
            let data = {
                "MessageType": "AuthenticateSession",
                "OperatorID": self.operatorId,
                "vipLevel": self.vipLevel,
                "SessionCurrency": self.currency,
                "Token": response.data.Token
            };
            this.send(data);
        }).catch((e) => {
            console.log(e);
            this.socket.close();
        });
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
        if(!evt.data) return;
        try {
            let response = JSON.parse(evt.data);
            switch (response?.MessageType) {
                case "ActiveTablesList":
                    self.tables.external = response.TablesList;
                    await this.generateMixTables();
                    this.onActiveTablesList();
                    break;
                case "SeatsStatus":
                    break;
                case "SuccessfulRegistration":
                    break;
                case "SuccessfulUnegistration":
                    break;
                default:
                    break;
            }
        } catch (e) {
            console.log('Error on message', e);
            return false;
        }
    }

    onError(evt) {
        console.log('Error WSS', evt.data);
    }

    refresh() {
        var self = this;
        let data = {
            "MessageType": "TablesListRequest",
            "OperatorID": self.operatorId,
            "vipLevel": self.vipLevel,
            "SessionCurrency": self.currency,
        };
        this.socket.send(JSON.stringify(data));
    }

    refreshSeats() {
        var self = this;
        let data = {
            "TableId":"1",
            "gameType":1,
            "OperatorID": self.operatorId,
            "destination":"table",
            "MessageType":"SeatsStatusRequest"
        };
        this.socket.send(JSON.stringify(data));
    }

    unregisterTables() {
        var self = this;
        let data = {
            "TableId":"100",
            "MessageType":"UnregisterSessionByTableId",
            "OperatorID": self.operatorId
        };
        this.socket.send(JSON.stringify(data));
    }

    registerTables() {
        var self = this;
        let data = {
            "TableId":"100",
            "MessageType":"RegisterSessionByTableId",
            "OperatorID": self.operatorId
        };
        this.socket.send(JSON.stringify(data));
    }

    onActiveTablesList() {
        var self = this;
        this.tables.mix.forEach((game) => {
            if(self.options?.ui?.seats?.show && game?.AvailableSeats) {
                let html = '<div>';
                let lastSeatHtml = '';
                game.AvailableSeats.forEach((seat) => {
                    if(seat.SeatId === 'd') return;
                    if(seat.Taken) {
                        html += '<div data-seat="'+seat.SeatId+'" style="color: '+self.options.ui.seats.taken_color+'">&spades;</div>';
                    } else if (!seat.Taken && self.options.ui.seats.show_taken) {
                        html += '<div data-seat="'+seat.SeatId+'" style="color: '+self.options.ui.seats.available_color+'">&spades;</div>';
                    }
                });
                html += '</div>';
                document.querySelectorAll('[data-gameCode="'+game.gameId+'"]').forEach((element) => {
                    element.querySelector('.'+self.options.ui.seats.class_identifier)?.insertAdjacentHTML('beforeend', html);
                })
            }
        });
    }
}
