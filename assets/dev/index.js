"use strict";

var pizza = function pizza(topping) {
  return "pizza pizza--".concat(topping);
};

document.on('ready', function () {
  return document.documentElement.addClass(pizza('sausage'));
});