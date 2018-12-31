import format from 'date-fns/format'

const pizza = topping => {
  let classes = ['pizza']
  if (topping) classes.push(`pizza--${topping}`)
  return classes
}

document.addEventListener('DOMContentLoaded', () => [...document.querySelectorAll('p')].map(el => el.classList.add(...pizza('pepperoni'))))

const time = document.getElementById('time')
const now = new Date()
time.setAttribute('datetime', now.toISOString())
time.innerHTML = format(now, 'h:mm a')
