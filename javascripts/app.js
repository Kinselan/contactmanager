var $contacts = $('#contacts ul');
var $formView = $('#form-view');
var $mainView = $('#main-view')
var $appFunctionBar = $('#app-functions');
var $searchBar = $('#search-bar');
var $tags = $('#tags');

//templates
var contactTemplate = Handlebars.compile($('#contact-template').html());
var formTemplate = Handlebars.compile($('#form-template').html());
var tagFilterTemplate = Handlebars.compile($('#tag-filter-template').html());

var TAG_DELIMITER = ' ';

//helpers
function revivePrototypeChain(list) {
  list.__proto__ = ContactList.prototype;

  for(var prop in list) {
    if(list[prop].hasOwnProperty('email')) {
      list[prop].__proto__ = Contact.prototype;
    }
  }
}

function unique(array) {
  var uniqueArray = [];
  array.forEach(function(item) {
    if(uniqueArray.indexOf(item) === -1) {
      uniqueArray.push(item);
    }
  })

  return uniqueArray;
}

function contactIsMatch(contact, filterMethod, string) {
  if(filterMethod === 'tagFilter') {
    return contact.tags.indexOf(string) > -1;
  }else {
    return RegExp(string, 'i').test(contact.name);
  }
}

//Contact
function Contact(id) {
  this.id = id;
  this.name = '';
  this.email = '';
  this.phone = '';
  this.tags = [];
}

Contact.prototype.addCategoryTags = function(string) {
  var self = this;
  if(!string) {return;}
  string.split(TAG_DELIMITER).forEach(function(tag) { self.tags.push(tag) });
};

Contact.prototype.update = function(newInfo) {
  this.name = newInfo.name;
  this.email = newInfo.email;
  this.phone = newInfo.phone;
  this.addCategoryTags(newInfo.tags);
};

Contact.prototype.removeTag = function(tag) {
  var idx = this.tags.indexOf(tag);
  this.tags.splice(idx, 1);
};

//Contact List
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

ContactList.prototype.updateContact = function(serializedArrInfo) {
  var newInfoObj = {};
  for(var i = 0; i < serializedArrInfo.length; i += 1) {
    newInfoObj[serializedArrInfo[i].name] = serializedArrInfo[i].value;
  }

  this[newInfoObj.id].update(newInfoObj);
  this.save();
};

ContactList.prototype.removeContact = function(id) {
  delete this[id];
  this.save();
};

ContactList.prototype.removeTagFromContact = function(id, tag) {
  this[id].removeTag(tag);
  this.save();
};

ContactList.prototype.updateCurrentTags = function() {
  var allTags = [];
  for(prop in this) {
    if(this[prop].hasOwnProperty('tags')) {
      allTags = allTags.concat(this[prop].tags);
    }
  }

  this.tags = unique(allTags);
  this.save();
}

ContactList.prototype.filter = function(string, filterMethod) {
  var filtered = {};
  var contact;
  Object.assign(filtered, this);
  
  for(var prop in filtered) {
    if(filtered[prop] instanceof Contact) {
      contact = filtered[prop];
      if(!contactIsMatch(contact, filterMethod, string)) {
        delete filtered[prop];
      }
    }
  }

  return filtered;
};

//Main app
var contactx = {
  toggleViews: function() {
    $mainView.slideToggle();
    $formView.slideToggle();
  },
  addNewContact: function() {
    var newContact = new Contact(contactList.nextId());
    contactList.addContact(newContact);
    $formView.html(formTemplate({ title: 'Create Contact', contact: newContact, submitAction: 'updateContact', cancelAction: 'cancelNewContact'}));
    this.toggleViews();
  },
  cancelNewContact: function() {
    var id = $formView.find('input[type="number"]').val();
    contactList.lastIdAssigned -= 1;
    contactList.removeContact(id);
    this.toggleViews();
  },
  editContact: function(e) {
    var id = this.getContactId(e);
    var contact = contactList.getContact(id);

    $formView.html(formTemplate({ title: 'Edit Contact', contact: contact, submitAction: 'updateContact', cancelAction: 'cancelEdit'}))
    this.toggleViews();
  },
  cancelEdit: function() {
    this.displayContacts(contactList);
    this.toggleViews();
  },
  updateContact: function() {
    var newInfoArray = $formView.find('form').serializeArray();
    contactList.updateContact(newInfoArray);
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
  displayContacts: function(list) {
    var html = '';
    for (var prop in list) {
      if(list[prop] instanceof Contact) {
        html += contactTemplate(list[prop]);
      }
    }
    this.updateTagFilter();
    $contacts.html(html);
  },
  updateTagFilter: function() {
    contactList.updateCurrentTags();
    $appFunctionBar.find('ul').html(tagFilterTemplate({tags: contactList.tags }));
  },
  displayFilteredContacts: function(e, pattern) {
    var filterMethod = e.data ? 'searchFilter' : 'tagFilter';
    var string = pattern || $(e.target).text();
    var filtered = contactList.filter(string, filterMethod);
    this.displayContacts(filtered);
  },
  removeTag: function(e) {
    var $tag = $(e.target).closest('li');
    var contactId = $('form input[type="number"]').val()
    $tag.remove();
    contactList.removeTagFromContact(contactId, $tag.text());
  },
  resetTagFilter: function() {
    this.displayContacts(contactList);
  }
}

//add event listeners
$('main').on('click', 'a, input[type=submit]', function(e) {
  e.stopPropagation();
  e.preventDefault();
  var action = $(this).data('action');
  contactx[action](e);
})

$searchBar.on('keyup', 'input', {filterMethod: 'searchFilter'}, function(e) {
  var pattern = $(e.target).val();
  if(pattern) {
    contactx.displayFilteredContacts(e, pattern);
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