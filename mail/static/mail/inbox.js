document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#read-email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-form').onsubmit = () =>{
      fetch(`/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value,
        })
      })
      .then(response => response.json())
      .then(result => {
        // Print result
        console.log(result);
        load_mailbox('inbox');
      });
      return false
    }
}


function view_email(id) {
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#read-email-view').style.display = 'block';

      document.querySelector('#read-email-view').innerHTML = `
      <h3>${email.subject}</h3>
      <strong>From: </strong>${email.sender}<br>
      <strong>To: </strong>${email.recipients.join(", ")}<br>
      <strong>Date: </strong>${email.timestamp}
      <hr>
      <p>${email.body.replace(/\n/g, "<br>")}</p>`;

      fetch(`/emails/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          read: true,
        })
      })
        .then(() => console.log("Email marcado como lido"));
    })
}


function load_mailbox(mailbox) {
  // Mostra a caixa de emails e esconde a de composição
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-email-view').style.display = 'none';

  // Define o título da caixa
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      emails.forEach(email => {
        const participantLabel = mailbox === "inbox" ? "From" : "To";
        const emailElement = document.createElement("div");
        if (email.read) emailElement.classList.add("email-read");
        emailElement.classList.add("email-item");
        emailElement.innerHTML = `<strong>${participantLabel}: </strong>${mailbox === "inbox" ? email.sender : email.recipients.join(", ")}<br/>
         <strong>Subject: </strong>${email.subject}<br>
         <strong>Date: </strong>${email.timestamp}<br>`;
        emailElement.addEventListener('click', () => {
          view_email(email.id);
        });

        document.querySelector('#emails-view').append(emailElement);
      })
    })
    .catch(error => console.error("Erro ao carregar emails:", error));
}
