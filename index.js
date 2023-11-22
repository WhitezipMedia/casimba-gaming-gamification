// 'use strict';

// import Pragmatic from './internal-js/pragmatic';
import Ezugi from './internal-js/ezugi';
import Pragmatic from "./internal-js/pragmatic";

class CGWidget {
    constructor() {
        this.ezugi = null;
        this.pragmatic = null;
    }

    connectPragmaticAPI() {
        this.pragmatic = new Pragmatic('ezeplayz-site', 'USD');
    }

    connectEzugiAPI() {
        this.ezugi = new Ezugi("ezeplayz-site");
    }
}

export default CGWidget;

// module.exports = CGWidget;
