define([
	'./fade',
	'dote/util',
	'dojo/_base/array',
	'dojo/_base/window',
	'dojo/dom',
	'dojo/json',
	'dojo/on',
	'dojo/request',
	'dijit/form/Button',
	'dijit/form/Textarea',
	'dijit/form/ValidationTextBox',
	'dijit/registry',
	'dojox/encoding/crypto/RSAKey',
	'./widgetModules',
	'dojo/domReady!'
], function (fade, util, array, win, dom, JSON, on, request, Button, Textarea, ValidationTextBox, registry, RSAKey) {
	var widgets = [],
		validLogin = false,
		userSignup = dom.byId('userSignup');

	function limit(delay, fn) {
		var fired,
			handle;

		return function () {
			if (!fired && handle) {
				clearTimeout(handle);
				handle = null;
			}
			handle = setTimeout(function () {
				fired = true;
				fn.apply(this, arguments);
			}, delay);
			fired = false;
			return validLogin;
		};
	}

	function checkValidForm() {
		if (validLogin && password.get('value') && (password.get('value') === (confirmpassword.get('value')))) {
			if (submit.get('disabled')) {
				submit.set('disabled', false);
			}
		}
		else {
			if (!submit.get('disabled')) {
				submit.set('disabled', true);
			}
		}
	}

	function checkLogin() {
		var id = login.get('value');
		if (id) {
			request.post('/validateLogin', {
				handleAs: 'json',
				data: {
					id: login.get('value')
				}
			}).then(function (data) {
				validLogin = !login._isEmpty(login.get('value')) && data.isValid;
				checkValidForm();
			});
		}
		else {
			validLogin = false;
			checkValidForm();
		}
	}

	widgets.push(new Button({
		id: 'submit',
		type: 'submit',
		name: 'submit',
		label: 'Submit',
		disabled: true
	}, 'submit'));
	widgets.push(new ValidationTextBox({
		id: 'login',
		name: 'login',
		type: 'text',
		required: true,
		placeholder: 'Login ID',
		promptMessage: 'Enter a login ID you wish to use.',
		invalidMessage: 'The login ID you have chosen is not valid,<br/>please choose a different one.',
		validator: limit(1000, checkLogin)
	}, 'login'));
	widgets.push(new ValidationTextBox({
		id: 'email',
		name: 'email',
		type: 'text',
		required: true,
		promptMessage: 'This is the e-mail address e-mails will be sent to.',
		invalidMessage: 'Not a valid e-mail address',
		placeholder: 'name@example.com'
	}, 'email'));
	widgets.push(new ValidationTextBox({
		id: 'password',
		name: 'password',
		type: 'password',
		promptMessage: 'Enter the password you wish to use.',
		invalidMessage: 'Please ensure your password is at least six characters long',
		pattern: '[A-Za-z0-9!#$%&\'*+/=?^_`{|}~-]{6,}',
		placeholder: 'Enter Password'
	}, 'password'));
	widgets.push(new ValidationTextBox({
		id: 'confirmpassword',
		name: 'confirmpassword',
		type: 'password',
		promptMessage: 'Please re-enter your password.',
		invalidMessage: 'Passwords do not match.',
		placeholder: 'Re-Enter Password',
		disabled: true
	}, 'confirmpassword'));
	widgets.push(new Textarea({
		id: 'message',
		name: 'message',
		promptMessage: 'Enter a message to the person authorising your account.',
		placeholder: 'Message to the administrators...',
		style: {
			width: '500px',
			minHeight: '100px'
		}
	}, 'message'));

	var login = registry.byId('login'),
		password = registry.byId('password'),
		confirmpassword = registry.byId('confirmpassword'),
		submit = registry.byId('submit');

	function signup(e) {
		e && e.preventDefault();
		submit.set('disabled', true);
		var signupData = {};
		array.forEach(userSignup.elements, function(element){
			if (element.name) {
				signupData[element.name] = element.value;
			}
		});
		delete signupData.confirmpassword;
		r = request.get('/pubKey', {
			handleAs: 'json'
		}).then(function (pubKey) {
			var rsakey = new RSAKey();
			rsakey.setPublic(pubKey.n, pubKey.e);
			signupData.password = util.hex2b64(rsakey.encrypt(signupData.password));
			return request.post('/signup', {
				data: {
					signup: JSON.stringify(signupData)
				}
			});
		}).then(function () {
			submit.set('disabled', false);
			win.global.location.href = '/thankyou';
		}, function (e) {
			console.error(e);
			submit.set('disabled', false);
		});
	}

	on(userSignup, 'submit', signup);
	submit.on('click', signup);

	password.on('input', function(e){
		if (password.get('value') !== 'password' && confirmpassword.get('disabled')) {
			confirmpassword.set('disabled', false);
		}
	});

	confirmpassword.validator = function (value) {
		checkValidForm();
		if (value === password.get("value")) {
			return true;
		}
		return false;
	};

	array.forEach(widgets, function (widget) {
		widget.startup();
	});

	fade.show(userSignup);

	login.focus();
});