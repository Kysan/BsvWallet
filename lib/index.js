module.exports = typeof window == "undefined" ? require("./node") : require("./browser")
