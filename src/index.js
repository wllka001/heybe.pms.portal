import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./slices";

// Suppress ResizeObserver loop errors globally
const OriginalResizeObserver = window.ResizeObserver;
if (OriginalResizeObserver) {
  window.ResizeObserver = class ResizeObserver extends OriginalResizeObserver {
    constructor(callback) {
      super((entries, observer) => {
        window.requestAnimationFrame(() => {
          try {
            callback(entries, observer);
          } catch (err) {
            console.warn("ResizeObserver callback error:", err);
          }
        });
      });
    }
  };
}

// Global window error fallback handler
const suppressResizeObserverError = (e) => {
  const msg = e.message || (e.reason && e.reason.message) || "";
  if (msg.includes("ResizeObserver")) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
};
window.addEventListener("error", suppressResizeObserverError);
window.addEventListener("unhandledrejection", suppressResizeObserverError);

const store = configureStore({ reducer: rootReducer, devTools: true });

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    <React.Fragment>
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <App />
      </BrowserRouter>
    </React.Fragment>
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();