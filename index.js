import Pragmatic from "./internal-js/pragmatic";

class CGWidget {
    constructor() {
        this.pragmatic = null;
    }

    connectPragmaticAPI(operator, currency = 'EUR', options = null) {
        this.pragmatic = new Pragmatic(operator, currency, options);
    }
}

export default CGWidget;
