import axios from 'axios';

const wsUri = "dga.pragmaticplaylive.net/ws";

export default class Pragmatic {
    constructor(operator, currency = 'EUR', options = null){
        this.operator = operator;
        this.operatorId = null;
        this.currency = currency;
        let defaultOptions = {
            tryToConnect: true,
            ui: {
                theme: null,
                class_has_data: 'cg-data',
                class_dealer_name: 'cg-dealer',
                currency: {
                    show: true,
                    position: 'default', //default or start or end,
                    symbol: 'default'
                },
                class_table_open: 'cg-table-open',
                class_side_bets: 'cg-side-bets',
                class_multiple_seats: 'cg-multiple-seats',
                class_new_table: 'cg-new-table',
                class_bet_behind: 'cg-bet-behind',
                seats: {
                    class_main: 'cg-seats',
                    taken_class_identifier: 'cg-seats-taken',
                    available_class_identifier: 'cg-seats-available',
                    inside_html: '<i class="seat"></i>'
                },
                limits: {
                    class_min_bet: 'cg-minbet',
                    class_max_bet: 'cg-maxbet',
                    class_multiple_seat_limit: 'cg-multiple-seats-limit',
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
        console.log(self.operator);
        let postData = {
            "operatorId" : self.operator,
            "provider" : "pragmatic"
        };
        if(self.tables.internal === null){
            axios.post('https://uat-streaming.casimbagaming.com/liveTableDetails', postData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then((response) => {
                self.operatorId = response.data.casinoId;
                // self.operatorId = 'ppcgi00000000295';
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

    onOpen() {
        this.initialize();
    }

    onClose() {
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
            // Dealers name
            if(self.options?.ui?.class_dealer_name && data.dealer?.name) {
                element.querySelectorAll('.'+self.options.ui.class_dealer_name).forEach(element2 => {
                    element2.classList.add(self.options.ui.class_has_data);
                    element2.innerHTML = data.dealer.name;
                })
            }
            //seats game live
            if(self.options?.ui?.seats?.class_main && typeof data.availableSeats !== "undefined") {
                element.querySelectorAll('.'+self.options.ui.seats.class_main).forEach(element2 => {
                    element2.classList.add(self.options.ui.class_has_data);
                    let seats = getAttributesByKeyStart(data, 'seat');
                    let html = '';
                    let needsTocreate = false;
                    Object.entries(seats).forEach(([key, value]) => {
                        let occupiedClass = value?self.options.ui.seats.taken_class_identifier:self.options.ui.seats.available_class_identifier;
                        key = key.replace(/([0-9])/g, '-$1').trim();
                        let seatElement = element2.querySelector('.cg-'+key);
                        if(!needsTocreate && seatElement) {
                            if(!seatElement.classList.contains(occupiedClass)) {
                                seatElement.classList.remove(self.options.ui.seats.taken_class_identifier);
                                seatElement.classList.remove(self.options.ui.seats.available_class_identifier);
                                seatElement.classList.add(occupiedClass);
                            }
                        } else {
                            needsTocreate = true;
                        }
                        html += '<div class="cg-'+key+' '+occupiedClass+'">'+self.options.ui.seats.inside_html+'</div>';
                    });
                    if(needsTocreate)
                        element2.innerHTML = html;
                })
            }
            //limit min bet
            if(self.options?.ui?.limits?.class_min_bet && data.tableLimits?.minBet) {
                element.querySelectorAll('.'+self.options.ui.limits.class_min_bet).forEach(element2 => {
                    element2.classList.add(self.options.ui.class_has_data);
                    element2.innerHTML = self.getBeautyCurrency(data.tableLimits.minBet, data.currency);
                })
            }
            //limit max bet
            if(self.options?.ui?.limits?.class_max_bet && data.tableLimits?.maxBet) {
                element.querySelectorAll('.'+self.options.ui.limits.class_max_bet).forEach(element2 => {
                    element2.classList.add(self.options.ui.class_has_data);
                    element2.innerHTML =self.getBeautyCurrency(data.tableLimits.maxBet, data.currency);
                })
            }
            //limit multiseat
            if(self.options?.ui?.limits?.class_multiple_seat_limit && typeof data.multiseatLimit !== "undefined") {
                element.querySelectorAll('.'+self.options.ui.limits.class_multiple_seat_limit).forEach(element2 => {
                    element2.classList.add(self.options.ui.class_has_data);
                    element2.innerHTML = data.multiseatLimit;
                })
            }
            //is table open
            if(self.options?.ui?.class_table_open && typeof data.tableOpen !== "undefined") {
                element.querySelectorAll('.'+self.options.ui.class_table_open).forEach(element2 => {
                    element2.classList.add(self.options.ui.class_has_data);
                    element2.setAttribute('data-cg-status', data.tableOpen?'1':'0');
                })
            }
            //has sidebets
            if(self.options?.ui?.class_side_bets && typeof data.sidebets !== "undefined") {
                element.querySelectorAll('.'+self.options.ui.class_side_bets).forEach(element2 => {
                    element2.classList.add(self.options.ui.class_has_data);
                    element2.setAttribute('data-cg-status', data.sidebets?'1':'0');
                })
            }
            //has multiseats
            if(self.options?.ui?.class_multiple_seats && typeof data.multiseat !== "undefined") {
                element.querySelectorAll('.'+self.options.ui.class_multiple_seats).forEach(element2 => {
                    element2.classList.add(self.options.ui.class_has_data);
                    element2.setAttribute('data-cg-status', data.multiseat?'1':'0');
                })
            }
            //is new table
            if(self.options?.ui?.class_new_table && typeof data.newTable !== "undefined") {
                element.querySelectorAll('.'+self.options.ui.class_new_table).forEach(element2 => {
                    element2.classList.add(self.options.ui.class_has_data);
                    element2.setAttribute('data-cg-status', data.newTable?'1':'0');
                })
            }
            //has bet behind
            if(self.options?.ui?.class_bet_behind && typeof data.betbehind !== "undefined") {
                element.querySelectorAll('.'+self.options.ui.class_bet_behind).forEach(element2 => {
                    element2.classList.add(self.options.ui.class_has_data);
                    element2.setAttribute('data-cg-status', data.betbehind?'1':'0');
                })
            }
        });
    }

    getBeautyCurrency(amount, currency) {
        var self = this;
        if(self.currency !== currency) {
            self.currency = currency;
            self.options.ui.currency.position = 'default';
            self.options.ui.currency.symbol = 'default';
        }
        let symbol = self.options?.ui?.currency?.symbol;
        if (!self.options?.ui?.currency?.position || self.options.ui.currency.position === 'default') {
            self.options.ui.currency.position = 'start';
        }
        if(!symbol || symbol === 'default') {
            switch (self.currency) {
                case 'EUR':
                    self.options.ui.currency.symbol = '€';
                    break;
                case 'USD':
                case 'CAD':
                case 'NZD':
                    self.options.ui.currency.symbol = '$';
                    break;
                case 'INR':
                    self.options.ui.currency.symbol = '₹';
                    break;
                case 'CLP':
                    self.options.ui.currency.symbol = 'CLP$';
                    break;
                case 'ARS':
                    self.options.ui.currency.symbol = 'ARS$';
                    break;
                case 'PEN':
                    self.options.ui.currency.symbol = 'S/';
                    break;
                case 'NOK':
                    if (!self.options?.ui?.currency?.position || self.options.ui.currency.position === 'default') {
                        self.options.ui.currency.position = 'end';
                    }
                    self.options.ui.currency.symbol = 'kr';
                    break;
                case 'BRL':
                    self.options.ui.currency.symbol = 'R$';
                    break;
                case 'GBP':
                    self.options.ui.currency.symbol = '£';
                    break;
                default:
                    self.options.ui.currency.symbol = '€';
                    break;
            }
        }
        if(self.options?.ui?.currency?.show) {
            if(self.options?.ui?.currency?.position === 'end'){
                amount = amount.toString() + self.options?.ui?.currency?.symbol;
            } else {
                amount = self.options?.ui?.currency?.symbol + amount.toString();
            }
        }
        return amount;
    }
}

function getAttributesByKeyStart(obj, start) {
    return Object.keys(obj).reduce((acc, key) => {
        if (key.startsWith(start)) {
            acc[key] = obj[key];
        }
        return acc;
    }, {});
}
