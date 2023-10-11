'use strict'

const deepMerge = (...objects) => {
  const isObject = (obj) => obj && typeof obj === 'object'
  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach((key) => {
      const pVal = prev[key]
      const oVal = obj[key]
      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = pVal.concat(...oVal)
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = deepMerge(pVal, oVal)
      } else {
        prev[key] = oVal
      }
    })
    return prev
  }, {})
}

const DEFAULT_OPTIONS = {
  classNames: {
    wrapperEl: 'cselect',
    selectEl: 'cselect__select',
    renderedEl: 'cselect__rendered',
    renderedTextEl: 'cselect__rendered-text',
    searchEl: 'cselect__search',
    optionsEl: 'cselect__options',
    optionEl: 'cselect__option',
    init: 'js-init-cselect',
    open: 'is-open',
    onTop: 'is-on-top',
    selected: 'is-selected',
    hidden: 'is-hidden',
  },
  minimumOptionsForSearch: 10,
  onOpen: null,
  onClose: null,
  onToggle: null,
}

export default class CSelect {
  // Elements
  #wrapperEl
  #renderedEl
  #renderedTextEl
  #searchEl
  #optionsEl
  #optionEls
  // Functions
  #handleSearch
  #optionElClick
  #clickOutside
  #escPress

  constructor(selectEl, options = {}) {
    // Handle arguments
    this.selectEl = selectEl
    this.options = deepMerge(DEFAULT_OPTIONS, options)
    // Bind 'this'
    this.open = this.open.bind(this)
    this.close = this.close.bind(this)
    this.toggle = this.toggle.bind(this)
    this.#handleSearch = this.#handleSearchFn.bind(this)
    this.#optionElClick = this.#optionElClickFn.bind(this)
    this.#clickOutside = this.#clickOutsideFn.bind(this)
    this.#escPress = this.#escPressFn.bind(this)
    // Functions
    this.init()
  }

  init() {
    // Check if already init
    if (this.selectEl.classList.contains(this.options.classNames.init)) {
      console.error(`CSelect already initialized. ID: ${this.selectEl.id}`)
      return
    }
    // Handle select element
    this.selectEl.setAttribute('tabindex', '-1')
    this.selectEl.classList.add(this.options.classNames.selectEl)
    // Functions
    this.#generateHTML()
    this.#addEvents()
    // Add initialization
    this.selectEl.classList.add(this.options.classNames.init)
  }

  #generateHTML() {
    // Generate wrapper
    const wrapperHTML = /* HTML */ `<div class="${this.options.classNames.wrapperEl}"></div>`
    this.selectEl.insertAdjacentHTML('beforebegin', wrapperHTML)
    this.#wrapperEl = this.selectEl.previousElementSibling
    this.#wrapperEl.appendChild(this.selectEl)
    // Generate rendered
    const selectedOption = this.selectEl.options[this.selectEl.selectedIndex]
    const selectedOptionText = selectedOption.textContent
    this.#renderedEl = document.createElement('button')
    this.#renderedEl.type = 'button'
    this.#renderedEl.className = this.options.classNames.renderedEl
    this.#wrapperEl.appendChild(this.#renderedEl)
    this.#renderedTextEl = document.createElement('span')
    this.#renderedTextEl.className = this.options.classNames.renderedTextEl
    this.#renderedTextEl.textContent = selectedOptionText
    this.#renderedEl.appendChild(this.#renderedTextEl)
    // Generate options wrapper
    this.#optionsEl = document.createElement('div')
    this.#optionsEl.className = this.options.classNames.optionsEl
    this.#wrapperEl.appendChild(this.#optionsEl)
    // Generate search
    if ([...this.selectEl.options].length >= this.options.minimumOptionsForSearch) {
      this.#searchEl = document.createElement('input')
      this.#searchEl.type = 'text'
      this.#searchEl.className = this.options.classNames.searchEl
      this.#optionsEl.appendChild(this.#searchEl)
    }
    // Generate each option
    const selectOptions = [...this.selectEl.options]
    this.#optionEls = []
    for (const option of selectOptions) {
      if (option.disabled) {
        continue
      }
      const newOption = document.createElement('button')
      newOption.type = 'button'
      newOption.className = this.options.classNames.optionEl
      newOption.textContent = option.textContent
      newOption.setAttribute('data-value', option.value)
      if (option.selected) {
        newOption.classList.add(this.options.classNames.selected)
      }
      this.#optionsEl.appendChild(newOption)
      this.#optionEls.push(newOption)
    }
  }

  open(callback) {
    this.#wrapperEl.classList.add(this.options.classNames.open)
    // Handle optionsEl position
    this.#handleOptionsElPosition()
    // Handle search
    if (this.#searchEl !== null) {
      this.#resetSearch()
      this.#searchEl.focus()
    }
    // Handle callback functions
    if (typeof this.options.onOpen === 'function') {
      this.options.onOpen(this)
    }
    if (typeof callback === 'function') {
      callback(this)
    }
  }

  close(callback) {
    this.#wrapperEl.classList.remove(this.options.classNames.open)
    // Handle callback functions
    if (typeof this.options.onClose === 'function') {
      this.options.onClose(this)
    }
    if (typeof callback === 'function') {
      callback(this)
    }
  }

  toggle(callback) {
    if (!this.#wrapperEl.classList.contains(this.options.classNames.open)) {
      this.open()
    } else {
      this.close()
    }
    // Handle callback functions
    if (typeof this.options.onToggle === 'function') {
      this.options.onToggle(this)
    }
    if (typeof callback === 'function') {
      callback(this)
    }
  }

  #handleOptionsElPosition() {
    this.#optionsEl.classList.remove(this.options.classNames.onTop)
    const boundingRect = this.#optionsEl.getBoundingClientRect()
    const isOutTop = boundingRect.top < 0
    const isOutBottom = boundingRect.bottom > (window.innerHeight || document.documentElement.clientHeight)
    if (isOutBottom) {
      this.#optionsEl.classList.add(this.options.classNames.onTop)
    }
    if (isOutTop) {
      this.#optionsEl.classList.remove(this.options.classNames.onTop)
    }
  }

  #resetSearch() {
    this.#searchEl.value = ''
    for (const optionEl of this.#optionEls) {
      optionEl.classList.remove(this.options.classNames.hidden)
    }
  }

  #handleSearchFn() {
    for (const optionEl of this.#optionEls) {
      if (optionEl.textContent.toLowerCase().indexOf(this.#searchEl.value.toLowerCase()) > -1) {
        optionEl.classList.remove(this.options.classNames.hidden)
      } else {
        optionEl.classList.add(this.options.classNames.hidden)
      }
    }
  }

  #optionElClickFn(event) {
    // Close the select
    this.close()
    // Cache the target
    const target = event.target
    // Check if click selected option
    if (this.selectEl.value === target.dataset.value) {
      return
    }
    // Handle rendered text
    this.#renderedTextEl.textContent = target.textContent
    // Handle select element change
    this.selectEl.value = target.dataset.value
    const triggerEvent = new Event('change')
    this.selectEl.dispatchEvent(triggerEvent)
    // Highlight selected
    for (const optionEl of this.#optionEls) {
      optionEl.classList.remove(this.options.classNames.selected)
    }
    target.classList.add(this.options.classNames.selected)
  }

  #clickOutsideFn(event) {
    const isOutside = event.target.closest(`.${this.options.classNames.wrapperEl}`) !== this.#wrapperEl
    const isOpen = this.#wrapperEl.classList.contains(this.options.classNames.open)
    if (isOutside && isOpen) {
      this.close()
    }
  }

  #escPressFn(event) {
    const isEsc = event.keyCode === 27
    const isOpen = this.#wrapperEl.classList.contains(this.options.classNames.open)
    if (isEsc && isOpen) {
      this.close()
    }
  }

  #addEvents() {
    this.#renderedEl.addEventListener('click', this.toggle)
    if (this.#searchEl !== null) {
      this.#searchEl.addEventListener('input', this.#handleSearch)
    }
    for (const optionEl of this.#optionEls) {
      optionEl.addEventListener('click', this.#optionElClick)
    }
    document.addEventListener('click', this.#clickOutside)
    document.addEventListener('keyup', this.#escPress)
  }

  destroy() {
    // Check if already init
    if (!this.selectEl.classList.contains(this.options.classNames.init)) {
      console.error(`CSelect not initialized. ID: ${this.selectEl.id}`)
      return
    }
    // Remove Events
    document.removeEventListener('click', this.#clickOutside)
    document.removeEventListener('keyup', this.#escPress)
    // Unwrap
    this.#wrapperEl.replaceWith(this.selectEl)
    // Clear select element
    this.selectEl.removeAttribute('tabindex')
    this.selectEl.classList.remove(this.options.classNames.selectEl)
    this.selectEl.classList.remove(this.options.classNames.init)
  }
}
