function Validator(formSelector, options) {
    // assign default value for param (ES5)
    if (!options) {
        options = {}
    }

    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement
            }
            element = element.parentElement
        }
    }

    var formRules = {
        /* expected
            fullname: 'required',
            email: 'required|email',
        */
    }

    /** Quy ước tạo rules:
     * - Nếu có lỗi thì return `error message`
     * - Nếu ko có lỗi thì return `undefined`
     */
    var validatorRules = {
        required: function (value) {
            return value ? undefined : 'Please enter this field'
        },
        email: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
            return regex.test(value) ? undefined : 'Please enter a valid email address'
        },
        min: function (min) {
            return function (value) {
                return value.length >= min ? undefined : `Please enter a minimum of ${min} characters`
            }
        },
        max: function (min) {
            return function (value) {
                return value.length <= max ? undefined : `Please enter a maximum of ${max} characters`
            }
        },
    }

    var ruleName = 'required'

    // console.log(validatorRules[ruleName])

    // get formElement in DOM according to 'formSelector'
    var formElement = document.querySelector(formSelector)

    // only handle when formElement exists in DOM
    if (formElement) {
        var inputs = formElement.querySelectorAll('[name][rules]')
        // console.log(inputs) // returns a NodeList

        for (var input of inputs) {
            // console.log(input.name) // returns name of input
            // console.log(input.getAttribute('rules'))

            var rules = input.getAttribute('rules').split('|')
            for (var rule of rules) {
                var ruleInfo
                var isRuleHasValue = rule.includes(':')

                if (isRuleHasValue) {
                    ruleInfo = rule.split(':')
                    rule = ruleInfo[0]
                }

                var ruleFunc = validatorRules[rule]

                if (isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1])
                }

                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc)
                } else {
                    formRules[input.name] = [ruleFunc]
                }
            }

            // event listener for validation (blur, change,...)
            input.onblur = handleValidate
            input.oninput = handleClearError
        }

        // function to validate
        function handleValidate(event) {
            var rules = formRules[event.target.name]
            var errorMessage

            rules.find(function (rule) {
                errorMessage = rule(event.target.value)
                return errorMessage
            })

            // if there's error, display error message to UI
            if (errorMessage) {
                var formGroup = getParent(event.target, '.form-group')

                if (formGroup) {
                    formGroup.classList.add('invalid')
                    var formMessage = formGroup.querySelector('.form-message')
                    if (formMessage) {
                        formMessage.innerText = errorMessage
                    }
                }
            }

            return !errorMessage // if no error message return true (validation succeeded)
        }

        // function to clear errorMessage
        function handleClearError(event) {
            var formGroup = getParent(event.target, '.form-group')
            if (formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid')
                var formMessage = formGroup.querySelector('.form-message')

                if (formMessage) {
                    formMessage.innerText = ''
                }
            }
        }
    }

    // event handler for form submission
    formElement.onsubmit = function (event) {
        event.preventDefault()

        var inputs = formElement.querySelectorAll('[name][rules]')
        var isValid = true

        for (var input of inputs) {
            if (!handleValidate({ target: input })) {
                isValid = false
            }
        }

        // when there's no error, submit form
        if (isValid) {
            if (typeof options.onSubmit === 'function') {
                var enableInputs = formElement.querySelectorAll('[name]')

                var formValues = Array.from(enableInputs).reduce(function (values, input) {
                    // gán input.value cho object values và return values

                    switch (input.type) {
                        case 'radio':
                            values[input.name] = formElement.querySelector(`input[name="${input.name}"]:checked`).value
                            break
                        case 'checkbox':
                            if (!input.matches(':checked')) {
                                values[input.name] = '' // ensure to return [] instead of nothing
                                return values
                            }
                            if (!Array.isArray(values[input.name])) {
                                values[input.name] = []
                            }
                            values[input.name].push(input.value) // push value into array
                            break
                        case 'file':
                            values[input.name] = input.files
                            break
                        default:
                            values[input.name] = input.value
                    }
                    return values
                }, {})

                // recalling onSubmit, return input values of form
                options.onSubmit(formValues)
            } else {
                formElement.submit()
            }
        }
    }
}