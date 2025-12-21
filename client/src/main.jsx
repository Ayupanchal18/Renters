import React from "react";
import ReactDOM from "react-dom/client";
import "./global.css";
import App from "./App";
import { Provider } from "react-redux";
import { store } from "./redux/store";

const el = document.getElementById("root");
if (!el) throw new Error("Root element not found");

ReactDOM.createRoot(el).render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </React.StrictMode>
);
