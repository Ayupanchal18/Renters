import React from "react";
import ReactDOM from "react-dom/client";
import "./global.css";
import App from "./App";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { ThemeProvider } from "./context/ThemeContext";
import { SnackbarProvider } from "./context/SnackbarContext";

const el = document.getElementById("root");
if (!el) throw new Error("Root element not found");

ReactDOM.createRoot(el).render(
    <React.StrictMode>
        <Provider store={store}>
            <ThemeProvider>
                <SnackbarProvider>
                    <App />
                </SnackbarProvider>
            </ThemeProvider>
        </Provider>
    </React.StrictMode>
);
