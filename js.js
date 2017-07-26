$(function() {
  console.log('jQuery loaded');

  var contactsTemplate  = Handlebars.compile($('#contactsTemplate').html()),
      tagsTemplate      = Handlebars.compile($('#tagsTemplate').html()),
      $addNewForm       = $('#addNewForm'),
      $editForm         = $('#editForm'),
      $saveChanges      = $('#saveChanges'),
      $contacts         = $('#contacts'),
      $cancel           = $('#cancel'),
      $cancelEdit       = $('#cancelEdit'),
      $search           = $('#search');
      $new              = $('#newContact'),
      $add              = $('#add');
      contacts          = []; // do we need this? we will always pull from localstorage

  Handlebars.registerPartial('tagsTemplate', $('#tagsTemplate').html());

  function setContacts(contactsToSave) {
    localStorage.setItem('contacts', JSON.stringify(contactsToSave));
  }

  function getContacts() {
    return JSON.parse(localStorage.getItem('contacts')) || [];
  }

  function getNextId() {
    var id = Number(localStorage.getItem('id')) || 1;
    localStorage.setItem('id', id + 1);
    return id;
  }



  function loadContacts() {
    $contacts.empty();
    contacts = getContacts();

    console.log(contacts);
    if (contacts === null) {
      console.log('contacts null, returning');
      return;
    }

    $('#contacts').append(contactsTemplate({ contacts: contacts }));
  }

  function displayNewContactForm() {
    $contacts.slideUp();
    $addNewForm.slideDown();
  }

  function resetFormValues() {
    $('#formFullName').val('');
    $('#formEmail').val('');
    $('#formTel').val('');
    $('#formTags').val('');
  }

  function addNewContact() {
    var name  = $('#formFullName').val();
    var email = $('#formEmail').val();
    var phone   = $('#formTel').val();
    var tags = $('#formTags').val().split(' ');
    console.log(tags);

    var id = getNextId();
    console.log("just retrieved this ID: " + id);
    console.log("contacts is: " + contacts);
    contacts.push({
      id: id,
      name: name,
      email: email,
      phone: phone,
      tags: tags,
    });

    resetFormValues();
    setContacts(contacts);
    loadContacts();
    $addNewForm.slideUp();
    $contacts.slideDown();
  }


  function saveChanges(e) {
    e.preventDefault();
    console.log('editing this contact:' + contact);

    contact[0].name =  $('#editFormFullName').val();
    contact[0].email = $('#editFormEmail').val();
    contact[0].phone = $('#editFormTel').val();
    contact[0].tags = $('#editFormTags').val().split(' ');

    setContacts(contacts);
    loadContacts();
    $editForm.slideUp();
    $contacts.slideDown();
  }


  function displayEditContactForm() {
    var id = Number($(this).closest('.contact').attr('data-id'));

    contact = contacts.filter(function(c) {
      return c.id === id;
    });

    $('#editFormFullName').val(contact[0].name);
    $('#editFormEmail').val(contact[0].email);
    $('#editFormTel').val(contact[0].phone);
    $('#editFormTags').val(contact[0].tags.join(' '));

    $editForm.slideDown(); // oops, addnewForm may work but looks silly here
    $contacts.slideUp();
  }




  $new.on('click', function(e) {
    e.preventDefault();
    displayNewContactForm();
  });


  $add.on('click', function(e) {
    e.preventDefault();
    addNewContact();
  });

  $cancel.on('click', function(e) {
    e.preventDefault();

    $contacts.slideDown();
    $addNewForm.slideUp();
    resetFormValues();
  });

  $cancelEdit.on('click', function(e) {
    e.preventDefault();
    console.log('Cancel edit clicked');
    $contacts.slideDown();
    $editForm.slideUp();
  });



  function deleteContact(e) { // do i need e?
    var id = $(this).closest('.contact').attr('data-id');
    // alert('Are you sure you want to delete this contact?')
    if (confirm('Are you sure you want to delete this contact?')) {
      contacts = contacts.filter(function(contact) {
        return (contact.id !== Number(id));
      });

      setContacts(contacts); // save in localStorage
      loadContacts();
    }
  }

  function filterByTag() {
    console.log('clicked on a tag');
    // console.log(this);
    console.log($(this).text());
    $search.val($(this).text());
    $search.trigger("keyup");
    // now trigger a keyup
  }

  $contacts.on('click', '.delete', deleteContact);
  $contacts.on('click', '.edit', displayEditContactForm);
  $contacts.on('click', '.tag', filterByTag);
  $saveChanges.on('click', saveChanges);

  $search.on('keyup', function(e) {
    $('.contact').show();
    var filteredContacts = contacts.filter(function(contact) {
      var searchTerm = $search.val().toLowerCase();
      console.log("Search term: " + searchTerm);
      if ((contact.name.toLowerCase().indexOf(searchTerm)           >= 0) ||
          (contact.email.toLowerCase().indexOf(searchTerm)          >= 0) ||
          (contact.tags.join(' ').toLowerCase().indexOf(searchTerm) >= 0) ||
          (contact.phone.toLowerCase().indexOf(searchTerm)      >= 0)) {
            return true;
          }
    });

    console.log(filteredContacts);
    $('.contact').toggle(); // hide all
    filteredContacts.forEach(function(contact) {
      console.log(contact.id);
      $('.contact').filter("[data-id=" + contact.id + "]").toggle();
    });
  });

  loadContacts();
});
