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

  document.querySelector('#compose-form').onsubmit = () => {
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


function archiveEmail(id, icon) {
  const button = icon.parentElement;
  button.disabled = true;
  const isArchived = button.dataset.archived === "true";
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: !isArchived
    })
  })
    .then(response => {
      if (response.status === 204) {
        return { archived: !isArchived };
      } else {
        throw new Error("Resposta inesperada do servidor.");
      }
    })
    .then(updatedEmail => {
      icon.classList.remove("bi-archive", "bi-archive-fill");
      icon.classList.add(updatedEmail.archived ? "bi-archive-fill" : "bi-archive");
      button.dataset.archived = updatedEmail.archived.toString();
    })
    .catch(error => {
      console.error("Erro ao arquivar email:", error);
      alert("Não foi possível arquivar o email.");
    })
    .finally(() => {
      button.disabled = false;
    });
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
        emailElement.classList.add("email-item");
        if (email.read) emailElement.classList.add("email-read");

        const emailContent = document.createElement("div");
        emailContent.innerHTML = `
          <strong>${participantLabel}: </strong>${mailbox === "inbox" ? email.sender : email.recipients.join(", ")}<br/>
          <strong>Subject: </strong>${email.subject}<br>
          <strong>Date: </strong>${email.timestamp}<br>
        `;
        emailContent.classList.add("email-item-content");

        emailElement.appendChild(emailContent);

        if (mailbox !== "sent") {
          const spacer = document.createElement("div");
          spacer.style.width = "20px";
          spacer.style.height = "100%";
          spacer.style.cursor = "default";

          const archiveButton = document.createElement("button");
          archiveButton.dataset.archived = email.archived
          archiveButton.classList.add("archive-btn");
          const archiveIcon = document.createElement("i");
          if (email.archived) {
            archiveIcon.classList.add("bi", "bi-archive-fill");
          } else {
            archiveIcon.classList.add("bi", "bi-archive");
          }
          
          archiveButton.appendChild(archiveIcon);

          archiveButton.addEventListener('click', () => {
            archiveEmail(email.id, archiveIcon)
          })

          emailElement.appendChild(spacer);
          emailElement.appendChild(archiveButton);
        }

        emailContent.addEventListener('click', () => {
          view_email(email.id);
        });

        document.querySelector('#emails-view').append(emailElement);
      })
    })
    .catch(error => console.error("Erro ao carregar emails:", error));
}
