// 'use strict';

// import Pragmatic from './internal-js/pragmatic';
import Ezugi from './internal-js/ezugi';
import Pragmatic from "./internal-js/pragmatic";

class CGWidget {
    constructor() {
        this.ezugi = null;
        this.pragmatic = null;
    }

    connectPragmaticAPI(operator, currency = 'EUR', options = null) {
        this.pragmatic = new Pragmatic(operator, currency, options);
    }

    connectEzugiAPI() {
        this.ezugi = new Ezugi("ezeplayz-site");
    }
}

export default CGWidget;

// module.exports = CGWidget;
