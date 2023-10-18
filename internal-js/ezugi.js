import('../external-js/ezugi');

const wsUri = "engineint.tableslive.com/GameServer/gameNotifications";

export default class Ezugi {
    constructor(operatorId, vipLevel = 0, currency = 'EUR'){
        ezugidga.connect(wsUri, operatorId, vipLevel, currency);
        ezugidga.available(casinoID);
        ezugidga.subscribe(casinoID, 'tableID', 'currency');
        ezugidga.onConnect();
    };
}
