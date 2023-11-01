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


const wsUri = "engineint.tableslive.com/GameServer/gameNotifications";
const socket = new WebSocket("wss://"+wsUri);


window.addEventListener(
    "message",
    (event) => {
        if(event.origin !== 'https://fecmsapi.casimbagaming.com') console.log(event);
    }
);
window.addEventListener("message", (e) => console.log(e), false);
socket.addEventListener("open", (event) => {
    let data = {
        "MessageType": "InitializeSession",
        "OperatorID": 10552002,
        "vipLevel": 0,
        "SessionCurrency": "USD"
    };
    socket.send(JSON.stringify(data));
});
socket.onmessage = function (e) {console.log('on message', e)};
socket.onopen = function (e) {console.log('on open', e)};
socket.onclose = function (e) {console.log('on close', e)};
socket.onerror = function (e) {console.log('on error', e)};
