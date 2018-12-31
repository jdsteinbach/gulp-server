"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var pizza = function pizza(topping) {
  return ["pizza", "pizza--".concat(topping)];
};

document.addEventListener('DOMContentLoaded', function () {
  return _toConsumableArray(document.querySelectorAll('p')).map(function (el) {
    var _el$classList;

    return (_el$classList = el.classList).add.apply(_el$classList, _toConsumableArray(pizza('sausage')));
  });
});
var time = document.getElementById('time');
var now = new Date();
time.setAttribute('datetime', now.toISOString());
time.innerHTML = now;