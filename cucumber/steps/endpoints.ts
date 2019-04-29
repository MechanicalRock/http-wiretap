import { PROXY_HOST, PROXY_PORT } from "./config";

export const serviceEndpoints = {
  GET: {
    "200": `http://${PROXY_HOST}:${PROXY_PORT}/downstream/ok`,
    "404": `http://${PROXY_HOST}:${PROXY_PORT}/downstream/not-found`,
    "200_SLOW_REPLY": `http://${PROXY_HOST}:${PROXY_PORT}/downstream/slow-reply`,
    "200_FIXED_BODY": `http://${PROXY_HOST}:${PROXY_PORT}/downstream/fixed-body`
  },

  POST: {
    "201": `http://${PROXY_HOST}:${PROXY_PORT}/downstream/created`,
    "500": `http://${PROXY_HOST}:${PROXY_PORT}/downstream/server-error`,
    "201_RELAY_BACK": `http://${PROXY_HOST}:${PROXY_PORT}/downstream/relay-back`
  }
}
