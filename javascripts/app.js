var $contacts = $('#contacts ul');
var $formView = $('#form-view');
var $mainView = $('#main-view')
var $appFunctionBar = $('#app-functions');
var contactTemplate = Handlebars.compile($('#contact-template').html());
var formTemplate = Handlebars.compile($('#form-template').html());
var $searchBar = $('#search-bar');
var $tags = $('#tags');
var TAG_DELIMITER = '%';


function revivePrototypeChain(list) {
  list.__proto__ = ContactList.prototype;

  for(var prop in list) {
    if(list[prop].hasOwnProperty('email')) {
      list[prop].__proto__ = Contact.prototype;
    }
  }
}

function Contact(id, name, email, phone) {
  this.id = id;
  this.name = name;
  this.email = email;
  this.phone = phone;
  this.tags = ''
}

Contact.prototype.addCategoryTag = function(string) {
  this.tags += (string + TAG_DELIMITER);
}

Contact.prototype.edit = function(name, email, phone) {
  this.name = name;
  this.email = email;
  this.phone = phone;
}

function ContactList() {
  this.tags = [],
  this.lastIdAssigned = 0;
}

ContactList.prototype.nextId = function() {
  this.lastIdAssigned += 1;
  return this.lastIdAssigned;
};

ContactList.prototype.save = function() {
  localStorage.setItem('contactList', JSON.stringify(this));
};

ContactList.prototype.getContact = function(id) {
  return this[id];
};

ContactList.prototype.addContact = function(contact) {
  this[contact.id] = contact;
  this.save();
};

ContactList.prototype.addTag = function(tagName) {
  this.tags.push(tagName);
  this.save();
};

ContactList.prototype.editContact = function(id, name, email, phone) {
  this[id].edit(name, email, phone);
  this.save();
};

ContactList.prototype.removeContact = function(id) {
  delete this[id];
  this.save();
};

ContactList.prototype.filter = function(regex) {
  var filtered = {};
  Object.assign(filtered, this);
  
  for(var prop in filtered) {
    if(filtered[prop] instanceof Contact) {
      if(!regex.test(filtered[prop].name)) {
        delete filtered[prop];
      }
    }
  }

  return filtered;
}


var contactx = {
  toggleViews: function() {
    $mainView.slideToggle();
    $formView.slideToggle();
  },
  addNew: function() {
    $formView.html(formTemplate({id: contactList.nextId(), submitAction: 'createNewContact', title: 'Create Contact'}));
    this.toggleViews();
  },
  editContact: function(e) {
    var id = this.getContactId(e);
    var contact = this.getContact(id);

    $formView.html(formTemplate({id: id, submitAction: 'updateContact', title: 'Edit Contact'}))
    this.populateContactInfo(contact);
    this.toggleViews();
  },
  updateContact: function(e) {
    var inputValues = $formView.find('form').serializeArray();
    var id = inputValues[0].value;
    var name = inputValues[1].value;
    var email = inputValues[2].value;
    var phone = inputValues[3].value;
    
    contactList.editContact(id, name, email, phone);
    this.displayContacts(contactList);
    this.toggleViews();
  },
  deleteContact: function(e) {
    var id = this.getContactId(e);

    var message = 'Are you sure you want to delete this contact?'
    if(!window.confirm(message)) {return;}

    contactList.removeContact(id);
    this.displayContacts(contactList);
  },
  getContactId: function(e) {
    return $(e.target).closest('li').data('contactid');
  },
  getContact: function(id) {
    return contactList.getContact(id);
  },
  populateContactInfo: function(contact) {
    var $fields = $('form input');
    $fields.eq(0).attr('value', contact.id);
    $fields.eq(1).attr('value', contact.name);
    $fields.eq(2).attr('value', contact.email);
    $fields.eq(3).attr('value', contact.phone);
  },
  createNewContact: function() {
    var newContactInfo = $formView.find('form').serializeArray();
    var id = newContactInfo[0].value;
    var name = newContactInfo[1].value;
    var email = newContactInfo[2].value;
    var phone = newContactInfo[3].value;
    var newContact = new Contact(id, name, email, phone);
    this.saveContact(newContact);
    this.toggleViews();
  },
  saveContact: function(contact) {
    contactList.addContact(contact);
    this.displayContacts(contactList);
    contactList.save();
  },
  displayContacts: function(list) {
    var html = '';
    for (var prop in list) {
      if(list[prop] instanceof Contact) {
        html += contactTemplate(list[prop]);
      }
    }

    $contacts.html(html);
  },
  displayFilteredContacts: function(pattern) {
    var regex = RegExp(pattern, 'i');
    var filtered;
    filtered = contactList.filter(regex);
    this.displayContacts(filtered);
  },
  addTag: function(e) {
    var $input = $formView.find('aside input').eq(0);
    var newTag = $input.val();
    var id = this.getContactId(e);
    $input.val('');
    contactList[id].addCategoryTag(newTag);
  },
}

//add event listener to parent container
$('main').on('click', 'a, input[type=submit]', function(e) {
  e.stopPropagation();
  e.preventDefault();
  var action = $(this).data('action');
  contactx[action](e);
})

$searchBar.on('keyup', 'input', function(e) {
  var pattern = $searchBar.find('input').eq(0).val();
  if(pattern) {
    contactx.displayFilteredContacts(pattern);
  }else {
    contactx.displayContacts(contactList);
  }
});

// initialize contact list;
var contactList = JSON.parse(localStorage.getItem('contactList'));

if (contactList) {
  revivePrototypeChain(contactList);
}else {
  contactList = new ContactList();
}

contactx.displayContacts(contactList);