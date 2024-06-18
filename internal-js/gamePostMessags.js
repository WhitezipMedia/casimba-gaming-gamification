import axios from 'axios';

export default class GamePostMessages {
    constructor(){
        this.addPostEventListeners();
        this.onStartGameCallback = null;
        this.onGameAnimationStartedCallback = null;
        this.onGameAnimationFinishedCallback = null;
    }

    addPostEventListeners() {
        window.addEventListener("message", (event) => {this.executeGameCallBacks(event.data);}, false);
    }

    async executeGameCallBacks(data) {
        if(this.onStartGameCallback && typeof this.onStartGameCallback === 'function') {
            let balance = await this.getBalance();
            this.onStartGameCallback(balance);
        }
    }

    async getBalance() {
        //REGAL BET Process
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
