import axios from 'axios';

const wsUri = "engineint.tableslive.com/GameServer/gameNotifications";

export default class Ezugi {
    constructor(operator, vipLevel = 0, currency = 'EUR', options = null){
        this.operator = operator;
        this.operatorId = null;
        this.vipLevel = vipLevel;
        this.currency = currency;
        let defaultOptions = {
            tryToConnect: true,
            ui: {
                container: 'body',
                seats: {
                    show: true,
                    show_taken: true,
                    taken_color: '#ff0000',
                    available_color: '#008000',
                    class_identifier: 'seats'
                },
                limits: {
                    maxBetBehind_class_identifier: false,
                    maxSideBet_class_identifier: false,
                    maxBet_class_identifier: false,
                    minBetBehind_class_identifier: false,
                    minSideBet_class_identifier: false,
                    minBet_class_identifier: false,
                    chips_class_identifier: false,
                }
            },
        };
        this.options = {...defaultOptions, options};
        this.connectionTries = 1;
        this.hasAuthenticate = false;
        this.timeOut = 700;
        this.retryTimeOut = 200000;
        this.tables = {
            internal: null,
            external: null,
            mix: [],
        };
        this.connect();
    };

    connect() {
        var self = this;
        self.socket = new WebSocket("wss://"+wsUri);
        self.socket.onmessage = function (evt) {self.onMessage(evt)};
        self.socket.onopen = function (evt) {self.onOpen(evt)};
        self.socket.onclose = function (evt) {self.onClose(evt)};
        self.socket.onerror = function (evt) {self.onError(evt)};
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
            self.send(data).then(() => {
                setTimeout(() => this.authenticate(), self.timeOut);
            });
        }).catch(e => {
            console.log(e);
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
            console.log('sending', data);
            self.send(data).then(() => {
                setTimeout(() => {
                    if(!self.hasAuthenticate) self.socket.close();
                }, self.retryTimeOut);
            });
        }).catch((e) => {
            console.log(e);
            self.socket.close();
        });
    }

    async send(data){
        var self = this;
        self.socket.send(JSON.stringify(data));
    }

    onOpen(evt) {
        var self = this;
        self.initialize();
    }

    onClose(evt) {
        var self = this;
        self.hasAuthenticate = false;
        console.log(self.connectionTries);
        if(self.options?.tryToConnect && self.connectionTries < 5) {
            self.connectionTries++;
            self.connect();
        }
    }

    async generateMixTables() {
        var self = this;
        self.tables.mix = [];
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
        self.hasAuthenticate = true;
        try {
            let response = JSON.parse(evt.data);
            switch (response?.MessageType) {
                case "ActiveTablesList":
                    self.tables.external = response.TablesList;
                    await self.generateMixTables();
                    self.onActiveTablesList();
                    break;
                case "SeatsStatus":
                    break;
                case "SuccessfulRegistration":
                    break;
                case "SuccessfulUnegistration":
                    break;
                case "Error":
                    switch (response.ErrorCode) {
                        case "30081":
                            self.hasAuthenticate = false;
                            self.socket.close();
                            break;
                        case "30057":
                            self.hasAuthenticate = false;
                            self.options.tryToConnect = false;
                            self.socket.close();
                            break;
                        default:
                            break;
                    }
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
        console.log('Error WSS --------------------------------------------------', evt.data);
    }

    refresh() {
        var self = this;
        let data = {
            "MessageType": "TablesListRequest",
            "OperatorID": self.operatorId,
            "vipLevel": self.vipLevel,
            "SessionCurrency": self.currency,
        };
        self.socket.send(JSON.stringify(data));
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
        self.socket.send(JSON.stringify(data));
    }

    unregisterTables() {
        var self = this;
        let data = {
            "TableId":"100",
            "MessageType":"UnregisterSessionByTableId",
            "OperatorID": self.operatorId
        };
        self.socket.send(JSON.stringify(data));
    }

    registerTables() {
        var self = this;
        let data = {
            "TableId":"100",
            "MessageType":"RegisterSessionByTableId",
            "OperatorID": self.operatorId
        };
        self.socket.send(JSON.stringify(data));
    }

    onActiveTablesList() {
        var self = this;
        self.tables.mix.forEach((game) => {
            if(self.options?.ui?.seats?.show && game?.AvailableSeats) {
                let html = '<div>';
                game.AvailableSeats.forEach((seat) => {
                    if(seat.SeatId === 'd') return;
                    if(seat.Taken) {
                        html += '<div data-seat="'+seat.SeatId+'" style="color: '+self.options.ui.seats.taken_color+'">&spades;</div>';
                    } else if (!seat.Taken && self.options.ui.seats.show_taken) {
                        html += '<div data-seat="'+seat.SeatId+'" style="color: '+self.options.ui.seats.available_color+'">&spades;</div>';
                    }
                });
                html += '</div>';
                document.querySelector(self.options.ui.container+' [data-gameCode="'+game.gameId+'"] .'+self.options.ui.seats.class_identifier)?.insertAdjacentHTML('beforeend', html);
            }
            // if(self.options?.ui?.seats?.show && game?.LimitsList) {
            //     let html = '<div>';
            //     game.AvailableSeats.forEach((seat) => {
            //         if(seat.SeatId === 'd') return;
            //         if(seat.Taken) {
            //             html += '<div data-seat="'+seat.SeatId+'" style="color: '+self.options.ui.seats.taken_color+'">&spades;</div>';
            //         } else if (!seat.Taken && self.options.ui.seats.show_taken) {
            //             html += '<div data-seat="'+seat.SeatId+'" style="color: '+self.options.ui.seats.available_color+'">&spades;</div>';
            //         }
            //     });
            //     html += '</div>';
            //     document.querySelector(self.options.ui.container+' [data-gameCode="'+game.gameId+'"] .'+self.options.ui.seats.class_identifier)?.insertAdjacentHTML('beforeend', html);
            // }
        });
    }
}
