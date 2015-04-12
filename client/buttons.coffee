h = require 'virtual-dom/h'
classNames = require 'classnames'

require('./buttons.scss')

ButtonBar = (buttons) ->
  h 'div',
    className: 'button-bar'
    for k,b of buttons
      h 'div',
        key: k
        className: classNames(
          'button'
          active: b.active
        )
        onclick: b.click
        onmouseover: b.hover
        [
          h 'div',
            className: 'content'
            [
              h 'i',
                className: "fa fa-fw #{b.icon}"
            ]
        ]

module.exports = {
  ButtonBar
}
