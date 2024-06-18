import Pragmatic from "./internal-js/pragmatic";
import gamePostMessags from "./internal-js/gamePostMessags";

class CGWidget {
    constructor() {
        this.pragmatic = null;
        this.gamePostMessages = null;
    }

    connectPragmaticAPI(operator, currency = 'EUR', options = null) {
        this.pragmatic = new Pragmatic(operator, currency, options);
    }

    initializeGamePostMessaged() {
        this.gamePostMessages = new GamePostMessages();
    }
}

export default CGWidget;
