import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

import { Provider } from "react-redux";
import { store } from "./redux/store";

const mount = () => {
    const el = document.getElementById("root");
    if (!el) throw new Error("Root element not found");

    const anyWin = window;

    if (!anyWin.__REACT_ROOT__) {
        anyWin.__REACT_ROOT__ = createRoot(el);
    }

    anyWin.__REACT_ROOT__.render(
        <React.StrictMode>
            <Provider store={store}>
                <App />
            </Provider>
        </React.StrictMode>
    );
};

mount();

// Hot Module Replacement (HMR)
if (import.meta.hot) {
    import.meta.hot.accept("./App", (newModule) => {
        const NewApp = newModule?.default || App;
        const anyWin = window;

        anyWin.__REACT_ROOT__?.render(
            <React.StrictMode>
                <Provider store={store}>
                    <NewApp />
                </Provider>
            </React.StrictMode>
        );
    });
}
