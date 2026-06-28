// Suppress ResizeObserver loop errors globally at the very top
const suppressResizeObserverError = (e) => {
  const msg = e.message || (e.reason && e.reason.message) || "";
  if (msg.includes("ResizeObserver") || (e.error && e.error.message && e.error.message.includes("ResizeObserver"))) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
};
window.addEventListener("error", suppressResizeObserverError, true);
window.addEventListener("unhandledrejection", suppressResizeObserverError, true);

const originalOnError = window.onerror;
window.onerror = function (message, source, lineno, colno, error) {
  if (message && String(message).includes("ResizeObserver")) {
    return true;
  }
  if (originalOnError) {
    return originalOnError.apply(this, arguments);
  }
};

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

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./slices";

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