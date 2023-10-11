'use strict'

import CSelect from './cselect.js'

window.addEventListener('DOMContentLoaded', () => {
  window['selectObj'] = {}
  const selectEls = [...document.querySelectorAll('.js-select')]
  for (const selectEl of selectEls) {
    window['selectObj'][selectEl.id] = new CSelect(selectEl, {
      minimumOptionsForSearch: 0,
      // onClose: (cselectObj) => {
      //   console.log(cselectObj)
      // },
    })
  }
  // window['selectObj']['select1'].open((cselectObj) => {
  //   console.log(cselectObj)
  // })
})
