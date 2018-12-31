const pizza = topping => [`pizza`, `pizza--${topping}`]

document.addEventListener('DOMContentLoaded', () => [...document.querySelectorAll('p')].map(el => el.classList.add(...pizza('sausage'))))

const time = document.getElementById('time')
const now = new Date();
time.setAttribute('datetime', now.toISOString())
time.innerHTML = now
