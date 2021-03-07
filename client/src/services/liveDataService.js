const wsURI = process.env.REACT_APP_WSURI || 'ws://' + window.location.host;


let ws;


export const connect = async (onReceiveStockUpdate, onConnectionClose) => {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject("Timeout (5 secs)"), 5000);
        ws = new WebSocket(wsURI);
        ws.onmessage = (evt) => {
            const { data: message } = evt;
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.event === 'tickerPriceUpdate') {
                onReceiveStockUpdate(parsedMessage);
            }
        }
        ws.onopen = () => {
            clearTimeout(timeout);
            resolve();
        }

        ws.onerror = (evt) => {
            console.error("Ws error", evt);
        }
    });
}
export const disconnect = () => {
    ws.close();
    ws = null;
}

export const subscribeToTicker = (ticker) => {
    if(!ws) {
        throw Error("ws not connected.");
    }
    ws.send(JSON.stringify({
        ticker,
        event: "subscribeToTicker",
    }));
}

export const unsubscribeFromTicker = async (ticker) => {
    if(!ws) {
        throw Error("ws not connected.");
    }
    ws.send(JSON.stringify({
        ticker,
        event: "unsubscribeFromTicker",
    }));
}

