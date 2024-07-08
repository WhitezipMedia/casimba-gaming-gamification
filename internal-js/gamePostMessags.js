import axios from 'axios';

export default class GamePostMessages {
    constructor(){
        this.addPostEventListeners();
        this.onStartGameCallback = null;
        this.onBalanceUpdateCallback = null;
        this.onGameAnimationStartedCallback = null;
        this.onGameAnimationFinishedCallback = null;
    }

    addPostEventListeners() {
        window.addEventListener("message", (event) => {this.executeGameCallBacks(event.data);}, false);
    }

    async executeGameCallBacks(data) {
        if(['examplebalanceUpdate'].includes(data.type)) {
            if(this.onBalanceUpdateCallback && typeof this.onBalanceUpdateCallback === 'function') {
                let balance = await this.getBalance(data);
                if(balance !== null) this.onBalanceUpdateCallback(balance);
            }
        }
    }

    async getBalance(data) {
        //REGAL BET Process
        if(data.origin == 'test.com') {
            return data.amount;
        } else if (data.origin == 'test2.com') {
            try {
                let response = await axios.post('https://streaming.casimbagaming.com/liveTableDetails', {playerIdentifier: '1234567890'}, {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                return response.data || null;
            } catch (e) {
                console.log(e);
                return null;
            }
        }
    }
}
