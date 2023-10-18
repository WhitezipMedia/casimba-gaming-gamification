import('../external-js/dgaAPI');

export default class Pragmatic {
    constructor(server, casinoID, currency = 'EUR'){
        this.casinoID = casinoID;
        this.currency = currency;
        dga.connect(server);
        dga.available(casinoID);
        dga.subscribe(casinoID, 'tableID', 'currency');
        dga.onConnect();
    };
}
