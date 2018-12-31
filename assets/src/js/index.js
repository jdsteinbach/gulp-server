const pizza = topping => `pizza pizza--${topping}`

document.on('ready', () => document.documentElement.addClass(pizza('sausage')))