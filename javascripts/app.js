var $contacts = $('#contacts ul');
var $addContactView = $('#add-contact-view');
var $mainView = $('#main-view')
var $appFunctionBar = $('#app-functions');
var $newContactForm = $addContactView.find('form');
var contactTemplate = Handlebars.compile($('#contact-template').html());

if(!(localStorage.getItem('contactList'))) { 
  localStorage.setItem('contactList', JSON.stringify([]))
}

var contactx = {
  toggleViews: function() {
    $mainView.slideToggle();
    $addContactView.slideToggle();
  },
  submit: function() {
    this.createNewContact();
    this.toggleViews();
  },
  createNewContact: function() {
    var $newContactInfo = $newContactForm.find('input');
    var name = $newContactInfo.eq(0).val();
    var email = $newContactInfo.eq(1).val();
    var phone = $newContactInfo.eq(2).val();
    var newContact = Object.create(contact).init(name, email, phone);
    this.saveContact(newContact);
  },
  saveContact: function(contact) {
    var contactList = JSON.parse(localStorage.getItem('contactList'));
    contactList.push(contact);
    localStorage.setItem('contactList', JSON.stringify(contactList));
    this.displayContacts();
  },
  displayContacts: function() {
    var contactList = JSON.parse(localStorage.getItem('contactList'));
    contactList.forEach(function(contact) {
        $contacts.append(contactTemplate(contact));
    });
  },
}

var contact = {
  init: function(name, email, phone) {
    this.name = name;
    this.phone = phone;
    this.email = email;
    return this;
  }
}

//add event listener to parent container
$('main').on('click', 'a, input[type=submit]', function(e) {
  var action = this.id === 'addNew' || this.id === 'cancel' ? 'toggleViews' : this.id;
  e.preventDefault;
  contactx[action]();
})

contactx.displayContacts();