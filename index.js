// 'use strict';

// import Pragmatic from './internal-js/pragmatic';
import Ezugi from './internal-js/ezugi';

class CGWidget {
    constructor() {
        this.ezugi = null;
        this.pragmatic = null;
    }

    connectPragmaticAPI() {
        this.pragmatic = new Ezugi(10552002);
    }

    connectEzugiAPI() {
        this.ezugi = new Ezugi("ezeplayz-site");
    }
}

export default CGWidget;

// module.exports = CGWidget;
