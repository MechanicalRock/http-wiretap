export const proxyHost = "wiret-albSe-1VGDWATE2HD2B-1913174424.us-east-1.elb.amazonaws.com"
export const proxyPort = "5050"
export const serviceEndpoints = {
  GET: {
    "200": `http://${proxyHost}:${proxyPort}/downstream/ok`,
    "404": `http://${proxyHost}:${proxyPort}/downstream/not-found`,
    "200_SLOW_REPLY": `http://${proxyHost}:${proxyPort}/downstream/slow-reply`,
    "200_FIXED_BODY": `http://${proxyHost}:${proxyPort}/downstream/fixed-body`
  },

  POST: {
    "201": `http://${proxyHost}:${proxyPort}/downstream/created`,
    "500": `http://${proxyHost}:${proxyPort}/downstream/server-error`,
    "201_RELAY_BACK": `http://${proxyHost}:${proxyPort}/downstream/relay-back`
  }
}
